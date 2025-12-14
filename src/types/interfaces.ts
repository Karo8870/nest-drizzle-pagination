export type FilterOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like';

export type SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';

export interface FilterMetadata {
	operator: FilterOperator;
	alias: string;
	default?: any;
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
}

/**
 * Metadata stored by @Sortable decorator
 */
export interface SortableMetadata {
	enabled: boolean;
	alias: string;
}
