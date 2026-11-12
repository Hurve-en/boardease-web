function pgErrorCode(error: unknown): string | undefined {
	if (!(error instanceof Error)) return undefined;
	return (error.cause as {code?: string} | undefined)?.code;
}

export function isUniqueViolation(error: unknown): boolean {
	return pgErrorCode(error) === "23505";
}

export function isForeignKeyViolation(error: unknown): boolean {
	return pgErrorCode(error) === "23503";
}
