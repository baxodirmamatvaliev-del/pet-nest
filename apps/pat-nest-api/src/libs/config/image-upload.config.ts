export const MAX_IMAGE_FILE_SIZE = 15_000_000;
export const MAX_IMAGE_FILES = 10;

export const ALLOWED_UPLOAD_TARGETS = ['member', 'pet', 'products'];

export const ALLOWED_IMAGE_EXTENSIONS: Record<string, string[]> = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
};
