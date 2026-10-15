// Catch ichida kelgan qiymat har doim Error bo'lmasligi mumkin.
export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

// MongoDB unique indeksiga zid yozuv uchun bir xil tekshiruv ishlatamiz.
export function isDuplicateKeyError(error: unknown): boolean {
	return error !== null && typeof error === 'object' && 'code' in error && error.code === 11000;
}
