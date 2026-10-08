import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createWriteStream, promises as fs } from 'fs';
import { extname, join } from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { Message } from '../../libs/enums/common.enum';
import {
	ALLOWED_IMAGE_EXTENSIONS,
	ALLOWED_UPLOAD_TARGETS,
	MAX_IMAGE_FILE_SIZE,
	MAX_IMAGE_FILES,
} from '../../libs/config/image-upload.config';

export interface FileUpload {
	filename: string;
	mimetype: string;
	createReadStream: () => Readable;
}

const hasValidImageSignature = (buffer: Buffer, mimetype: string): boolean => {
	if (mimetype === 'image/jpeg') {
		return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
	}

	if (mimetype === 'image/png') {
		return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
	}

	return false;
};

@Injectable()
export class ImageUploadService {
	public async imageUploader(file: FileUpload, target: string): Promise<string> {
		const fileExtension = extname(file?.filename ?? '').toLowerCase();
		if (!ALLOWED_IMAGE_EXTENSIONS[file?.mimetype]?.includes(fileExtension)) {
			throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
		}
		if (!ALLOWED_UPLOAD_TARGETS.includes(target)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const imageName = `${randomUUID()}${fileExtension}`;
		const directory = join(process.cwd(), 'uploads', target);
		const url = `uploads/${target}/${imageName}`;
		const path = join(directory, imageName);
		const temporaryPath = `${path}.tmp`;
		let uploadedSize = 0;

		const imageSizeValidator = new Transform({
			transform(chunk, _encoding, callback) {
				if (!Buffer.isBuffer(chunk)) {
					callback(new BadRequestException(Message.INVALID_IMAGE_CONTENT));
					return;
				}

				uploadedSize += chunk.length;
				if (uploadedSize > MAX_IMAGE_FILE_SIZE) {
					callback(new PayloadTooLargeException(Message.IMAGE_TOO_LARGE));
					return;
				}

				callback(null, chunk);
			},
		});

		try {
			await fs.mkdir(directory, { recursive: true });
			await pipeline(file.createReadStream(), imageSizeValidator, createWriteStream(temporaryPath, { flags: 'wx' }));

			const imageHeader = Buffer.alloc(8);
			const imageFile = await fs.open(temporaryPath, 'r');
			try {
				await imageFile.read(imageHeader, 0, imageHeader.length, 0);
			} finally {
				await imageFile.close();
			}

			if (!hasValidImageSignature(imageHeader, file.mimetype)) {
				throw new BadRequestException(Message.INVALID_IMAGE_CONTENT);
			}

			await fs.rename(temporaryPath, path);
			return url;
		} catch (err: unknown) {
			await Promise.all([fs.unlink(temporaryPath).catch(() => undefined), fs.unlink(path).catch(() => undefined)]);

			if (err instanceof HttpException) throw err;
			if (typeof err === 'object' && err !== null && 'status' in err && err.status === 413) {
				throw new PayloadTooLargeException(Message.IMAGE_TOO_LARGE);
			}

			console.log('Error! ImageUploadService.imageUploader', err instanceof Error ? err.message : err);
			throw new InternalServerErrorException(Message.UPLOAD_FAILED);
		}
	}

	public async imagesUploader(files: Promise<FileUpload>[], target: string): Promise<string[]> {
		if (!files.length || files.length > MAX_IMAGE_FILES) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const uploadedImages: string[] = [];
		try {
			for (const file of files) {
				uploadedImages.push(await this.imageUploader(await file, target));
			}
			return uploadedImages;
		} catch (err) {
			await Promise.all(uploadedImages.map((url) => fs.unlink(join(process.cwd(), url)).catch(() => undefined)));
			throw err;
		}
	}
}
