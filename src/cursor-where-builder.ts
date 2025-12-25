import { and, eq, gt, lt, or, SQL } from 'drizzle-orm';
import { SortInstruction } from './types/interfaces';

/**
 * Build a WHERE clause for cursor-based pagination
 * Generates nested OR conditions for multi-field sorting
 *
 * Example for sorting by firstName ASC, lastName ASC, id ASC:
 * WHERE (firstName > 'John')
 *    OR (firstName = 'John' AND lastName > 'Doe')
 *    OR (firstName = 'John' AND lastName = 'Doe' AND id > 123)
 *
 * @param sortInstructions - Array of sort instructions with columns and order
 * @param cursorValues - Decoded cursor values from the last record
 * @param cursorIdField - The ID field column for uniqueness
 * @returns Drizzle SQL WHERE condition
 */
export function buildCursorWhereClause(
  sortInstructions: SortInstruction[],
  cursorValues: Record<string, any>,
  cursorIdField: any
): SQL | undefined {
  if (!sortInstructions.length) {
    return undefined;
  }

  const idFieldName = getColumnName(cursorIdField);
  if (!(idFieldName in cursorValues)) {
    throw new Error(`Cursor missing required ID field: ${idFieldName}`);
  }

  const conditions: SQL[] = [];

  for (let i = 0; i < sortInstructions.length; i++) {
    const currentSort = sortInstructions[i];
    const currentFieldName = getCursorKey(currentSort);
    const currentValue = cursorValues[currentFieldName];

    if (currentValue === undefined) {
      throw new Error(`Cursor missing value for field: ${currentFieldName}`);
    }

    const equalityConditions: SQL[] = [];
    for (let j = 0; j < i; j++) {
      const prevSort = sortInstructions[j];
      const prevFieldName = getCursorKey(prevSort);
      const prevValue = cursorValues[prevFieldName];
      equalityConditions.push(eq(prevSort.column, prevValue));
    }

    const comparison = getComparisonOperator(
      currentSort.column,
      currentValue,
      currentSort.order
    );

    if (equalityConditions.length > 0) {
      conditions.push(and(...equalityConditions, comparison)!);
    } else {
      conditions.push(comparison);
    }
  }

  const finalEqualityConditions: SQL[] = [];
  for (const sortInstruction of sortInstructions) {
    const fieldName = getCursorKey(sortInstruction);
    const value = cursorValues[fieldName];
    finalEqualityConditions.push(eq(sortInstruction.column, value));
  }

  const lastSortOrder =
    sortInstructions[sortInstructions.length - 1]?.order || 'ASC';
  const idComparison = getComparisonOperator(
    cursorIdField,
    cursorValues[idFieldName],
    lastSortOrder
  );

  conditions.push(and(...finalEqualityConditions, idComparison)!);

  return or(...conditions);
}

/**
 * Get comparison operator based on sort order
 * @param column - Drizzle column
 * @param value - Value to compare against
 * @param order - Sort order (ASC or DESC)
 * @returns Drizzle SQL comparison
 */
function getComparisonOperator(column: any, value: any, order: string): SQL {
  const upperOrder = order.toUpperCase();

  if (upperOrder === 'ASC') {
    return gt(column, value);
  } else {
    return lt(column, value);
  }
}

/**
 * Extract the cursor key from a sort instruction
 * This must match the logic in PaginationService.extractCursorValuesFromRecord
 * @param sort - Sort instruction
 * @returns Cursor key string
 */
function getCursorKey(sort: SortInstruction): string {
  // Priority: propertyKey > sqlProperty > columnName
  if (sort.propertyKey) {
    return sort.propertyKey;
  }
  if (sort.sqlProperty && typeof sort.sqlProperty === 'string') {
    return sort.sqlProperty;
  }
  return getColumnName(sort.column);
}

/**
 * Extract column name from Drizzle column object
 * This is a helper to get the property name from the column
 * @param column - Drizzle column reference
 * @returns Column name as string
 */
function getColumnName(column: any): string {
  if (column && typeof column === 'object' && 'name' in column) {
    return column.name;
  }

  const str = String(column);
  const match = str.match(/\["(\w+)"]/);
  if (match) {
    return match[1];
  }

  throw new Error('Unable to extract column name from column reference');
}