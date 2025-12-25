import 'reflect-metadata';
import { SORTABLE_METADATA } from './reflect';
import { SortableMetadata, SortableOptions } from './types/interfaces';

/**
 * @Sortable decorator - marks a property as sortable
 * Allows the field to be used in dynamic sortBy requests
 * @param options - Optional configuration for alias and sqlProperty
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
 *
 * @Prop(userFullName)
 * @Sortable({ sqlProperty: 'name' }) // Extracts 'name' from record for cursor
 * name?: string;
 *
 * @Prop(userFullName)
 * @Sortable({ sqlProperty: (rec) => rec.name }) // Uses function to extract value
 * name?: string;
 * ```
 */
export function Sortable(options: SortableOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const alias = options.alias ?? String(propertyKey);
    const metadata: SortableMetadata = {
      enabled: true,
      alias,
      sqlProperty: options.sqlProperty ?? alias
    };

    Reflect.defineMetadata(SORTABLE_METADATA, metadata, target, propertyKey);
  };
}

/**
 * Alias for @Sortable decorator
 */
export const CanSortBy = Sortable;
