import 'reflect-metadata';
import { FilterMetadata, Builder, OperatorOptions } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

/**
 * Options for @ManyToManyFilter decorator
 */
export interface ManyToManyFilterOptions extends OperatorOptions {
  /**
   * Join table for the many-to-many relation
   */
  table: any;
  /**
   * Function that builds the where conditions for the exists subquery
   * @param value - The filter value from query parameters
   * @param baseColumn - The base column from @Prop decorator (e.g., users.id)
   * @returns SQL condition (typically an and() clause) for the exists subquery where clause
   *
   * @example
   * ```typescript
   * @Prop(users.id)
   * @ManyToManyFilter({
   *   table: propertyOwnership,
   *   builder: (value, baseColumn) => {
   *     return and(
   *       eq(propertyOwnership.userID, baseColumn),
   *       eq(propertyOwnership.propertyID, value)
   *     );
   *   }
   * })
   * propertyId?: number;
   * ```
   */
  builder: Builder;
}

/**
 * @ManyToManyFilter decorator - marks a property as filterable with exists subquery
 * Used for filtering by many-to-many relations
 *
 * @param options - Configuration including table and builder function
 *
 * @example
 * ```typescript
 * @Prop(users.id)
 * @ManyToManyFilter({
 *   alias: 'hasProperty',
 *   table: propertyOwnership,
 *   builder: (value, baseColumn) => {
 *     return and(
 *       eq(propertyOwnership.userID, baseColumn),
 *       eq(propertyOwnership.propertyID, value)
 *     );
 *   }
 * })
 * propertyId?: number;
 * ```
 */
export function ManyToManyFilter(
  options: ManyToManyFilterOptions
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (!options.builder) {
      throw new Error(
        `@ManyToManyFilter: builder function is required for property '${String(propertyKey)}'`
      );
    }
    if (!options.table) {
      throw new Error(
        `@ManyToManyFilter: table is required for property '${String(propertyKey)}'`
      );
    }

    const existing: FilterMetadata[] =
      Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

    const filterMetadata: FilterMetadata = {
      operator: 'exists',
      alias: options.alias ?? String(propertyKey),
      default: options.default,
      builder: options.builder,
      table: options.table
    };

    existing.push(filterMetadata);

    Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
  };
}

