import { SQL } from 'drizzle-orm';

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'like'
  | 'exists'
  | 'switch'
  | 'custom';

export type SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';

export type PaginationType = 'cursor' | 'offset';

export interface FilterMetadata {
  operator: FilterOperator;
  alias: string;
  default?: any;
  /**
   * Builder function for 'exists' and 'custom' operators
   * - For 'exists': builds WHERE conditions for subquery
   * - For 'custom': builds custom SQL conditions
   */
  builder?: Builder;
  /**
   * Join table for 'exists' operator (many-to-many relations)
   * Only used when operator is 'exists'
   */
  table?: any;
  /**
   * Conditions mapping for 'switch' operator
   * Maps query parameter values to SQL condition functions
   * Only used when operator is 'switch'
   */
  conditions?: Record<string, (column: any) => SQL>;
}

export interface OperatorOptions {
  alias?: string;
  default?: any;
}

/**
 * Sort definition for defaultSort
 */
export interface SortDefinition {
  field: any; // Drizzle column or expression
  order: SortOrder;
  sqlProperty?: string;
}

/**
 * Options for the @Pagination class decorator
 */
export interface BasePaginationOptions {
  limit?: number;
  defaultSort?: SortDefinition[];
  allowCustomSort?: boolean;
  allowCustomLimit?: boolean;
  allowMultipleSort?: boolean;
  maxLimit?: number;
}

export interface OffsetPaginationOptions extends BasePaginationOptions {
  paginationType: 'offset'; // Default: offset mode
}

export interface CursorPaginationOptions extends BasePaginationOptions {
  paginationType: 'cursor' | 'both';
  cursorIdField: any; // Required when cursor pagination is enabled
}

export type PaginationOptions =
  | OffsetPaginationOptions
  | CursorPaginationOptions;

export interface PropMetadata {
  column: any;
}

/**
 * Options for @Sortable decorator
 */
export interface SortableOptions {
  alias?: string;
  /**
   * Property name or function to extract the sort value from the query result record
   * Used for cursor pagination to determine which field to use from the last record
   * Defaults to the alias if not provided
   * @param record - The last record from the query result
   * @returns The value to use for cursor encoding
   *
   * @example
   * ```typescript
   * // Using property name
   * @Sortable({ sqlProperty: 'name' })
   *
   * // Using function
   * @Sortable({ sqlProperty: (rec) => rec.name })
   * ```
   */
  sqlProperty?: string | ((record: any) => any);
}

/**
 * Metadata stored by @Sortable decorator
 */
export interface SortableMetadata {
  enabled: boolean;
  alias: string;
  sqlProperty?: string | ((record: any) => any);
}

/**
 * Parsed filter instruction
 */
export interface FilterInstruction {
  propertyKey: string;
  column: any;
  operator: FilterOperator;
  value: any;
  /**
   * Builder function for 'exists' and 'custom' operators
   * - For 'exists': builds WHERE conditions for subquery
   * - For 'custom': builds custom SQL conditions
   */
  builder?: Builder;
  /**
   * Database instance for 'exists' operator (many-to-many relations)
   * Only present when operator is 'exists'
   */
  table?: any;
  /**
   * Conditions mapping for 'switch' operator
   * Only present when operator is 'switch'
   */
  conditions?: Record<string, (column: any) => SQL>;
}

/**
 * Parsed sort instruction
 */
export interface SortInstruction {
  propertyKey: string;
  column: any;
  order: SortOrder;
  /**
   * Property name or function to extract the sort value from the query result record
   * Used for cursor pagination
   */
  sqlProperty?: string | ((record: any) => any);
}

/**
 * Result of parsing query parameters based on DTO metadata
 */
export interface PaginatedQueryResult {
  filters: FilterInstruction[];
  sorting: SortInstruction[];
  limit: number;
  offset?: number;
  page?: number;
  cursor?: string;
  paginationType: PaginationType;
  paginationOptions: PaginationOptions;
}

/**
 * Response for offset-based pagination
 */
export interface OffsetPaginatedResponse<T> {
  values: T[];
  page: number;
  limit: number;
}

/**
 * Response for cursor-based pagination
 */
export interface CursorPaginatedResponse<T> {
  values: T[];
  cursor: string | null;
}

export type Builder = (value: any, baseColumn: any) => SQL;
