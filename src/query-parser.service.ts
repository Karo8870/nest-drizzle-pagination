import 'reflect-metadata';

import {
	DECORATED_PROPERTIES_METADATA,
	FILTERS_METADATA,
	PAGINATION_METADATA,
	PROP_METADATA,
	SORTABLE_METADATA
} from './reflect';
import {
	FilterInstruction,
	FilterMetadata,
	PaginatedQueryResult,
	PaginationOptions,
	PaginationType,
	PropMetadata,
	SortableMetadata,
	SortInstruction
} from './types/interfaces';
import { throwBadRequestException } from './core/bad-request.exception';

export class QueryParserService {
	validateQueryType(
		allowedType: 'cursor' | 'offset' | 'both',
		queryParams: any
	): PaginationType {
		if (allowedType === 'offset') {
			if (queryParams.cursor) {
				throwBadRequestException(
					'Cursor-based pagination is not enabled for this endpoint. Use "page" parameter instead.'
				);
			}

			return 'offset';
		}

		if (allowedType === 'cursor') {
			if (queryParams.page) {
				throwBadRequestException(
					'Offset-based pagination is not enabled for this endpoint. Remove "page" parameter to use cursor pagination.'
				);
			}

			return 'cursor';
		}

		return queryParams.page ? 'offset' : 'cursor';
	}

	parseSortArray(sortString: string | string[]) {
		if (typeof sortString === 'string') {
			return sortString
				.split(',')
				.map((s: string) => s.trim())
				.filter((s: string) => s);
		} else if (Array.isArray(sortString)) {
			return sortString;
		}

		return [];
	}

	/**
	 * Parse query parameters based on DTO metadata
	 * @param dtoClass - The DTO class with pagination decorators
	 * @param queryParams - Raw query parameters from the request
	 */
	parse(dtoClass: any, queryParams: any): PaginatedQueryResult {
		const instance = new dtoClass();
		const prototype = Object.getPrototypeOf(instance);

		const paginationOptions: PaginationOptions =
			Reflect.getMetadata(PAGINATION_METADATA, prototype) || {};

		const allowedType = paginationOptions.paginationType ?? 'both';
		let paginationType = this.validateQueryType(allowedType, queryParams);

		const filters = this.parseFilters(prototype, queryParams);

		const sorting = this.parseSorting(
			prototype,
			queryParams,
			paginationOptions
		);

		const limit = this.parseLimit(queryParams, paginationOptions);

		const result: PaginatedQueryResult = {
			filters,
			sorting,
			limit,
			paginationType,
			paginationOptions
		};

		if (paginationType === 'cursor') {
			result.cursor = queryParams.cursor;
		} else {
			const page = queryParams.page ? parseInt(queryParams.page, 10) : 1;
			result.page = page;
			result.offset = (page - 1) * limit;
		}

		return result;
	}

	/**
	 * Parse filter parameters based on @Prop and filter decorators
	 */
	private parseFilters(prototype: any, queryParams: any): FilterInstruction[] {
		const filters: FilterInstruction[] = [];

		const decoratedProps: Set<string> =
			Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, prototype) ||
			new Set();

		for (const propertyKey of decoratedProps) {
			const propMetadata: PropMetadata | undefined = Reflect.getMetadata(
				PROP_METADATA,
				prototype,
				propertyKey
			);

			if (!propMetadata) continue;

			const filterMetadataArray: FilterMetadata[] =
				Reflect.getMetadata(FILTERS_METADATA, prototype, propertyKey) || [];

			for (const filterMetadata of filterMetadataArray) {
				const { operator, alias, default: defaultValue } = filterMetadata;

				let value = queryParams[alias];

				if (value === undefined && defaultValue !== undefined) {
					value = defaultValue;
				}

				if (value !== undefined && value !== null && value !== '') {
					filters.push({
						propertyKey,
						column: propMetadata.column,
						operator,
						value
					});
				}
			}
		}

		return filters;
	}

	/**
	 * Parse sorting parameters based on @Sortable decorators
	 */
	private parseSorting(
		prototype: any,
		queryParams: any,
		paginationOptions: PaginationOptions
	): SortInstruction[] {
		const sorting: SortInstruction[] = [];

		const allowCustomSort = paginationOptions.allowCustomSort ?? true;
		const allowMultipleSort = paginationOptions.allowMultipleSort ?? true;

		if (!allowCustomSort || !queryParams.sortBy) {
			return this.getDefaultSorting(paginationOptions);
		}

		let sortByArray: string[] = this.parseSortArray(queryParams.sortBy);

		let sortOrderArray: string[] = [];
		if (queryParams.sortOrder) {
			sortOrderArray = this.parseSortArray(queryParams.sortOrder);
		}

		if (!allowMultipleSort && sortByArray.length > 1) {
			throwBadRequestException(
				`Multiple sort fields are not allowed. Received ${sortByArray.length} fields: ${sortByArray.join(', ')}. Only single field sorting is permitted.`
			);
		}

		const decoratedProps: Set<string> =
			Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, prototype) ||
			new Set();

		const sortableAliasMap = new Map<string, string>();
		const availableSortableAliases: string[] = [];

		for (const propertyKey of decoratedProps) {
			const sortableMetadata: SortableMetadata | undefined =
				Reflect.getMetadata(SORTABLE_METADATA, prototype, propertyKey);

			if (sortableMetadata?.enabled) {
				sortableAliasMap.set(sortableMetadata.alias, propertyKey);
				availableSortableAliases.push(sortableMetadata.alias);
			}
		}

		for (let i = 0; i < sortByArray.length; i++) {
			const sortByAlias = sortByArray[i];
			const order = (sortOrderArray[i] || 'ASC').toUpperCase();

			const propertyKey = sortableAliasMap.get(sortByAlias);

			if (!propertyKey) {
				throwBadRequestException(
					`'${sortByAlias}' is not a valid sortable field. Available sortable fields: ${availableSortableAliases.join(', ')}`
				);
			}

			const propMetadata: PropMetadata | undefined = Reflect.getMetadata(
				PROP_METADATA,
				prototype,
				propertyKey
			);

			if (!propMetadata) {
				throwBadRequestException(
					`Property '${propertyKey}' does not have @Prop decorator`
				);
			}

			if (order !== 'ASC' && order !== 'DESC') {
				throwBadRequestException(
					`Invalid sort order '${order}' for field '${sortByAlias}'. Must be 'ASC' or 'DESC'`
				);
			}

			sorting.push({
				propertyKey,
				column: propMetadata.column,
				order: order as 'ASC' | 'DESC'
			});
		}

		return sorting.length > 0
			? sorting
			: this.getDefaultSorting(paginationOptions);
	}

	/**
	 * Get default sorting from pagination options
	 */
	private getDefaultSorting(
		paginationOptions: PaginationOptions
	): SortInstruction[] {
		const defaultSort = paginationOptions.defaultSort || [];

		return defaultSort.map((sortDef) => ({
			propertyKey: '',
			column: sortDef.field,
			order: sortDef.order.toUpperCase() as 'ASC' | 'DESC'
		}));
	}

	/**
	 * Parse limit parameter with validation
	 */
	private parseLimit(
		queryParams: any,
		paginationOptions: PaginationOptions
	): number {
		const allowCustomLimit = paginationOptions.allowCustomLimit ?? true;
		const defaultLimit = paginationOptions.limit ?? 10;
		const maxLimit = paginationOptions.maxLimit ?? 100;

		if (!allowCustomLimit || !queryParams.limit) {
			return defaultLimit;
		}

		const requestedLimit = parseInt(queryParams.limit, 10);

		if (isNaN(requestedLimit) || requestedLimit <= 0) {
			throwBadRequestException(
				`Invalid limit value: '${queryParams.limit}'. Limit must be a positive integer`
			);
		}

		// Enforce max limit
		if (requestedLimit > maxLimit) {
			throwBadRequestException(
				`Limit value ${requestedLimit} exceeds maximum allowed limit of ${maxLimit}`
			);
		}

		return requestedLimit;
	}
}
