import 'reflect-metadata';
import { SORTABLE_METADATA } from './reflect';
import { SortableMetadata, SortableOptions } from './types/interfaces';

/**
 * @Sortable decorator - marks a property as sortable
 * Allows the field to be used in dynamic sortBy requests
 * @param options - Optional configuration for alias
 *
 * @example
 * ```typescript
 * @Prop(users.createdAt)
 * @Sortable() // Uses 'createdAt' in sortBy
 * createdAt?: string;
 *
 * @Prop(users.createdAt)
 * @Sortable({ alias: 'created' }) // Uses 'created' in sortBy
 * createdAt?: string;
 * ```
 */
export function Sortable(options: SortableOptions = {}): PropertyDecorator {
	return (target: Object, propertyKey: string | symbol) => {
		const metadata: SortableMetadata = {
			enabled: true,
			alias: options.alias ?? String(propertyKey)
		};

		Reflect.defineMetadata(SORTABLE_METADATA, metadata, target, propertyKey);
	};
}

/**
 * Alias for @Sortable decorator
 */
export const CanSortBy = Sortable;
