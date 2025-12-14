import 'reflect-metadata';
import {
	FilterMetadata,
	PaginationOptions,
	PropMetadata,
	SortableMetadata
} from './types/interfaces';
import {
	DECORATED_PROPERTIES_METADATA,
	FILTERS_METADATA,
	PAGINATION_METADATA,
	PROP_METADATA,
	SORTABLE_METADATA
} from './reflect';

export interface PropertyMetadataInfo {
	propertyKey: string;
	column: any;
	sortable: boolean;
	sortableAlias?: string;
	filters: Array<{
		operator: string;
		alias: string;
		default?: any;
	}>;
}

export interface DtoMetadataInfo {
	paginationOptions: PaginationOptions;
	properties: PropertyMetadataInfo[];
	availableFilters: string[];
	sortableFields: string[];
}

export class IntrospectionService {
	/**
	 * Get all metadata from a paginated DTO class
	 * @param dtoClass - The DTO class to introspect
	 * @returns Complete metadata information
	 */
	introspect(dtoClass: any): DtoMetadataInfo {
		const instance = new dtoClass();
		const prototype = Object.getPrototypeOf(instance);

		const paginationOptions: PaginationOptions =
			Reflect.getMetadata(PAGINATION_METADATA, prototype) || {};

		const decoratedProps: Set<string> =
			Reflect.getMetadata(DECORATED_PROPERTIES_METADATA, prototype) ||
			new Set();

		const properties: PropertyMetadataInfo[] = [];
		const availableFilters: string[] = [];
		const sortableFields: string[] = [];

		for (const propertyKey of decoratedProps) {
			const propMetadata: PropMetadata | undefined = Reflect.getMetadata(
				PROP_METADATA,
				prototype,
				propertyKey
			);

			if (!propMetadata) continue;

			const filterMetadataArray: FilterMetadata[] =
				Reflect.getMetadata(FILTERS_METADATA, prototype, propertyKey) || [];

			const sortableMetadata: SortableMetadata | undefined =
				Reflect.getMetadata(SORTABLE_METADATA, prototype, propertyKey);

			const isSortable = sortableMetadata?.enabled || false;
			const sortableAlias = sortableMetadata?.alias;

			const filters = filterMetadataArray.map((f) => {
				availableFilters.push(f.alias);
				return {
					operator: f.operator,
					alias: f.alias,
					default: f.default
				};
			});

			if (isSortable && sortableAlias) {
				sortableFields.push(sortableAlias);
			}

			properties.push({
				propertyKey,
				column: propMetadata.column,
				sortable: isSortable,
				sortableAlias,
				filters
			});
		}

		return {
			paginationOptions,
			properties,
			availableFilters,
			sortableFields
		};
	}

	/**
	 * Print a human-readable summary of DTO metadata
	 * @param dtoClass - The DTO class to introspect
	 */
	printSummary(dtoClass: any): void {
		const metadata = this.introspect(dtoClass);

		console.log('\n=== DTO Metadata Summary ===\n');

		console.log('📄 Pagination Options:');
		let allowedType = metadata.paginationOptions.paginationType ?? 'both';
		console.log(`  Pagination Type: ${allowedType}`);
		console.log(`  Default Limit: ${metadata.paginationOptions.limit || 10}`);
		console.log(`  Max Limit: ${metadata.paginationOptions.maxLimit || 100}`);
		console.log(
			`  Allow Custom Sort: ${metadata.paginationOptions.allowCustomSort ?? true}`
		);
		console.log(
			`  Allow Custom Limit: ${metadata.paginationOptions.allowCustomLimit ?? true}`
		);
		console.log(
			`  Allow Multiple Sort: ${metadata.paginationOptions.allowMultipleSort ?? true}`
		);

		if (
			metadata.paginationOptions.defaultSort &&
			metadata.paginationOptions.defaultSort.length > 0
		) {
			console.log('  Default Sort:');
			for (const sort of metadata.paginationOptions.defaultSort) {
				console.log(`    - ${sort.order}`);
			}
		}

		console.log('\n🔍 Filterable/Sortable Properties:');
		for (const prop of metadata.properties) {
			console.log(`\n  ${prop.propertyKey}:`);
			if (prop.sortable && prop.sortableAlias) {
				const aliasNote =
					prop.sortableAlias !== prop.propertyKey
						? ` (alias: ${prop.sortableAlias})`
						: '';
				console.log(`    Sortable: ✓${aliasNote}`);
			} else {
				console.log(`    Sortable: ✗`);
			}
			if (prop.filters.length > 0) {
				console.log('    Filters:');
				for (const filter of prop.filters) {
					const defaultStr = filter.default
						? ` (default: ${filter.default})`
						: '';
					console.log(
						`      - ${filter.operator} → ?${filter.alias}=${defaultStr}`
					);
				}
			}
		}

		console.log('\n📊 Quick Reference:');
		console.log(
			`  Available filter params: ${metadata.availableFilters.join(', ')}`
		);
		console.log(`  Sortable fields: ${metadata.sortableFields.join(', ')}`);

		console.log('\n🔗 Example Queries:');

		allowedType = metadata.paginationOptions.paginationType ?? 'both';

		if (allowedType === 'offset' || allowedType === 'both') {
			console.log('\n  Offset-based Pagination:');
			console.log('    Page 1: ?page=1&limit=20');
			console.log('    Page 2: ?page=2&limit=20');
			console.log('    Response: { data: [...], page: 1, limit: 20 }');
		}

		if (allowedType === 'cursor' || allowedType === 'both') {
			console.log('\n  Cursor-based Pagination:');
			console.log('    Step 1 - First page (no cursor):');
			console.log('      Request:  ?limit=20');
			console.log(
				'      Response: { data: [...], nextCursor: "eyJpZCI6MjB9" }'
			);
			console.log('');
			console.log(
				'    Step 2 - Next page (use nextCursor from previous response):'
			);
			console.log('      Request:  ?cursor=eyJpZCI6MjB9&limit=20');
			console.log(
				'      Response: { data: [...], nextCursor: "eyJpZCI6NDB9" }'
			);
			console.log('');
			console.log(
				'    Step 3 - Continue until nextCursor is null (last page):'
			);
			console.log('      Request:  ?cursor=eyJpZCI6NDB9&limit=20');
			console.log('      Response: { data: [...], nextCursor: null }');
			console.log('');
			console.log(
				'    Note: Cursor contains encoded sort values for consistent pagination'
			);
		}

		if (allowedType === 'both') {
			console.log('\n  Choosing Pagination Type:');
			console.log('    - Include "page" param → Uses offset pagination');
			console.log('    - Omit "page" param → Uses cursor pagination');
		}

		if (metadata.sortableFields.length > 0) {
			console.log('\n  Sorting:');
			const firstSortable = metadata.sortableFields[0];
			console.log(`    Single field: ?sortBy=${firstSortable}&sortOrder=ASC`);
			console.log(
				`    Default order: ?sortBy=${firstSortable} (defaults to ASC)`
			);

			if (
				metadata.paginationOptions.allowMultipleSort &&
				metadata.sortableFields.length > 1
			) {
				const secondSortable = metadata.sortableFields[1];
				console.log(
					`    Multiple fields: ?sortBy=${firstSortable},${secondSortable}&sortOrder=ASC,DESC`
				);
			}
		}

		if (metadata.properties.length > 0) {
			console.log('\n  Filtering:');

			let examplesShown = 0;
			for (const prop of metadata.properties) {
				if (prop.filters.length > 0 && examplesShown < 3) {
					const filter = prop.filters[0];
					const exampleValue = this.getExampleValue(filter.operator);
					console.log(
						`    ${prop.propertyKey} (${filter.operator}): ?${filter.alias}=${exampleValue}`
					);
					examplesShown++;
				}
			}
		}

		const filterExamples: string[] = [];
		const sortExamples: string[] = [];

		let filterCount = 0;
		for (const prop of metadata.properties) {
			if (prop.filters.length > 0 && filterCount < 2) {
				const filter = prop.filters[0];
				const exampleValue = this.getExampleValue(filter.operator);
				filterExamples.push(`${filter.alias}=${exampleValue}`);
				filterCount++;
			}
		}

		if (metadata.sortableFields.length > 0) {
			if (
				metadata.paginationOptions.allowMultipleSort &&
				metadata.sortableFields.length > 1
			) {
				sortExamples.push(
					`sortBy=${metadata.sortableFields[0]},${metadata.sortableFields[1]}`
				);
				sortExamples.push('sortOrder=ASC,DESC');
			} else {
				sortExamples.push(`sortBy=${metadata.sortableFields[0]}`);
				sortExamples.push('sortOrder=DESC');
			}
		}

		if (allowedType === 'offset' || allowedType === 'both') {
			console.log('\n  Combined Example (Offset + Filters + Sort):');
			const allParams = [
				'page=1',
				'limit=20',
				...filterExamples,
				...sortExamples
			];
			console.log(`    ?${allParams.join('&')}`);
		}

		if (allowedType === 'cursor' || allowedType === 'both') {
			console.log('\n  Combined Example (Cursor + Filters + Sort):');
			const cursorParams = ['limit=20', ...filterExamples, ...sortExamples];
			console.log(`    First page:  ?${cursorParams.join('&')}`);
			console.log(
				`    Next pages:  ?cursor=<nextCursor>&${cursorParams.join('&')}`
			);
		}

		console.log('\n============================\n');
	}

	/**
	 * Get an example value for a filter operator
	 */
	private getExampleValue(operator: string): string {
		switch (operator) {
			case 'eq':
				return 'value';
			case 'like':
				return 'search';
			case 'gt':
			case 'gte':
				return '10';
			case 'lt':
			case 'lte':
				return '100';
			default:
				return 'value';
		}
	}
}
