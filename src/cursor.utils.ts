import { throwBadRequestException } from './core/bad-request.exception';

/**
 * Encode cursor values to base64 string
 * @param values - Object containing field values for cursor
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(values: Record<string, any>): string {
	try {
		const json = JSON.stringify(values);
		return Buffer.from(json).toString('base64');
	} catch (error) {
		throw new Error('Failed to encode cursor');
	}
}

/**
 * Decode base64 cursor string to values object
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor values object
 */
export function decodeCursor(cursor: string): Record<string, any> {
	try {
		const json = Buffer.from(cursor, 'base64').toString('utf-8');
		const values = JSON.parse(json);

		if (typeof values !== 'object' || values === null) {
			throwBadRequestException('Invalid cursor format');
		}

		return values;
	} catch (error) {
		throwBadRequestException('Invalid cursor: unable to decode');
	}
}

/**
 * Extract cursor values from a record based on field names
 * @param record - Database record
 * @param fields - Array of field names to extract
 * @returns Object with extracted values
 */
export function extractCursorValues(
	record: any,
	fields: string[]
): Record<string, any> {
	const values: Record<string, any> = {};

	for (const field of fields) {
		if (!(field in record)) {
			throw new Error(
				`Field '${field}' not found in record for cursor generation`
			);
		}
		values[field] = record[field];
	}

	return values;
}
