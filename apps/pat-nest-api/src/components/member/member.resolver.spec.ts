import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { Readable } from 'stream';
import { MemberResolver } from './member.resolver';
import { AuthService } from '../auth/auth.service';
import { MemberService } from './member.service';
import { ImageUploadService } from './image-upload.service';
import type { FileUpload } from './image-upload.service';

// The upload scalar is ESM; these tests exercise Nest's runtime argument metadata.
jest.mock('graphql-upload/GraphQLUpload.mjs', () => ({
  __esModule: true,
  default: {},
}));

describe('MemberResolver upload validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const file: FileUpload = {
    filename: 'avatar.png',
    mimetype: 'image/png',
    createReadStream: () => Readable.from(Buffer.from('image')),
  };

  it('preserves a single upload through global validation and passes it to the upload service', async () => {
    const metatype = Reflect.getMetadata('design:paramtypes', MemberResolver.prototype, 'imageUploader')[0];
    const validatedFile = await pipe.transform(file, { type: 'body', metatype, data: 'file' });
    expect(validatedFile).toBe(file);
    expect(validatedFile.createReadStream).toBe(file.createReadStream);

    const upload = jest.fn().mockResolvedValue('uploads/member/avatar.png');
    const resolver = new MemberResolver({} as MemberService, { imageUploader: upload } as unknown as ImageUploadService, {} as AuthService);
    const pendingFile = pipe.transform(Promise.resolve(file), { type: 'body', metatype, data: 'file' });

    await expect(resolver.imageUploader(pendingFile, 'member')).resolves.toBe('uploads/member/avatar.png');
    expect(upload).toHaveBeenCalledWith(file, 'member');
  });

  it('keeps multiple upload promises intact', async () => {
    const metatype = Reflect.getMetadata('design:paramtypes', MemberResolver.prototype, 'imagesUploader')[0];
    const files = [Promise.resolve(file)];
    const validatedFiles = await pipe.transform(files, { type: 'body', metatype, data: 'files' });
    expect(validatedFiles).toBe(files);
    await expect(validatedFiles[0]).resolves.toBe(file);
  });
});
