import { eq, exists, gt, gte, ilike, lt, lte, ne, sql, SQL } from 'drizzle-orm';
import { Builder, FilterOperator } from './types/interfaces';

/**
 * Apply a filter operator to a column with a value
 * @param column - Drizzle column reference
 * @param operator - Filter operator type
 * @param value - Value to filter by
 * @param builder - Builder function for 'exists' and 'custom' operators
 * @param table - Join table for 'exists' operator (required when operator is 'exists')
 * @param conditions - Conditions mapping for 'switch' operator (required when operator is 'switch')
 * @returns Drizzle SQL condition
 */
export function applyFilterOperator(
  column: any,
  operator: FilterOperator,
  value: any,
  builder?: Builder,
  table?: any,
  conditions?: Record<string, (column: any) => SQL>
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

    case 'exists':
      if (!builder) {
        throw new Error(
          'builder function is required for "exists" filter operator'
        );
      }
      if (!table) {
        throw new Error('table is required for "exists" filter operator');
      }

      const whereConditions = builder(value, column);

      return exists(
        // language=SQL format=false
        sql`(SELECT 1 FROM ${table} WHERE ${whereConditions})`
      );

    case 'switch':
      if (!conditions || Object.keys(conditions).length === 0) {
        throw new Error(
          'conditions mapping is required for "switch" filter operator'
        );
      }
      const conditionFn = conditions[value];
      if (!conditionFn) {
        const availableKeys = Object.keys(conditions).join(', ');
        throw new Error(
          `Invalid value '${value}' for switch filter. Available options: ${availableKeys}`
        );
      }
      return conditionFn(column);

    case 'custom':
      if (!builder) {
        throw new Error(
          'builder function is required for "custom" filter operator'
        );
      }
      return builder(value, column);

    default:
      throw new Error(`Unsupported filter operator: ${operator}`);
  }
}
