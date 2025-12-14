import { eq, gt, gte, ilike, lt, lte, ne, SQL } from 'drizzle-orm';
import { FilterOperator } from './types/interfaces';

/**
 * Apply a filter operator to a column with a value
 * @param column - Drizzle column reference
 * @param operator - Filter operator type
 * @param value - Value to filter by
 * @returns Drizzle SQL condition
 */
export function applyFilterOperator(
	column: any,
	operator: FilterOperator,
	value: any
): SQL {
	switch (operator) {
		case 'eq':
			return eq(column, value);

		case 'neq':
			return ne(column, value);

		case 'gt':
			return gt(column, value);

		case 'lt':
			return lt(column, value);

		case 'gte':
			return gte(column, value);

		case 'lte':
			return lte(column, value);

		case 'like':
			// Case-insensitive LIKE with auto-wrapping
			return ilike(column, `%${value}%`);

		default:
			throw new Error(`Unsupported filter operator: ${operator}`);
	}
}
