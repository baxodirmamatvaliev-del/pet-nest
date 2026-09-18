import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createWriteStream, promises as fs } from 'fs';
import { extname, join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { Message } from '../../libs/enums/common.enum';

export interface FileUpload {
  filename: string;
  mimetype: string;
  createReadStream: () => Readable;
}

@Injectable()
export class ImageUploadService {
  public async imageUploader(file: FileUpload, target: string): Promise<string> {
    const extensions: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    };

    const fileExtension = extname(file?.filename ?? '').toLowerCase();
    if (!extensions[file?.mimetype]?.includes(fileExtension)) {
      throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(target)) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }

    const imageName = `${randomUUID()}${fileExtension}`;
    const directory = join(process.cwd(), 'uploads', target);
    const url = `uploads/${target}/${imageName}`;
    const path = join(directory, imageName);

    try {
      await fs.mkdir(directory, { recursive: true });
      await pipeline(file.createReadStream(), createWriteStream(path));
      return url;
    } catch (err) {
      console.log('Error! ImageUploadService.imageUploader', err.message);
      await fs.unlink(path).catch(() => undefined);
      throw new InternalServerErrorException(Message.UPLOAD_FAILED);
    }
  }

  public async imagesUploader(files: Promise<FileUpload>[], target: string): Promise<string[]> {
    if (!files.length || files.length > 10) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }

    const uploadedImages: string[] = [];
    try {
      for (const file of files) {
        uploadedImages.push(await this.imageUploader(await file, target));
      }
      return uploadedImages;
    } catch (err) {
      await Promise.all(
        uploadedImages.map((url) => fs.unlink(join(process.cwd(), url)).catch(() => undefined)),
      );
      throw err;
    }
  }
}
