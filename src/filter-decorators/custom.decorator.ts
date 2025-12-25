import 'reflect-metadata';
import { FilterMetadata, Builder, OperatorOptions } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

/**
 * Options for @CustomFilter decorator
 */
export interface CustomFilterOptions extends OperatorOptions {
  /**
   * Custom builder function that creates SQL conditions
   * @param value - The filter value from query parameters
   * @param baseColumn - The base column from @Prop decorator
   * @returns SQL condition for filtering
   *
   * @example
   * ```typescript
   * @Prop(users.firstName)
   * @CustomFilter({
   *   alias: 'fullName',
   *   builder: (value, baseColumn) => {
   *     // Custom condition: search in both firstName and lastName
   *     return or(
   *       ilike(users.firstName, `%${value}%`),
   *       ilike(users.lastName, `%${value}%`)
   *     );
   *   }
   * })
   * fullName?: string;
   * ```
   */
  builder: Builder;
}

/**
 * @CustomFilter decorator - allows custom SQL conditions via builder function
 * Provides maximum flexibility for complex filtering logic
 *
 * @param options - Configuration including alias and builder function
 *
 * @example
 * ```typescript
 * // Example 1: Search across multiple fields
 * @Prop(users.firstName)
 * @CustomFilter({
 *   alias: 'search',
 *   builder: (value, baseColumn) => {
 *     return or(
 *       ilike(users.firstName, `%${value}%`),
 *       ilike(users.lastName, `%${value}%`),
 *       ilike(users.email, `%${value}%`)
 *     );
 *   }
 * })
 * search?: string;
 *
 * // Example 2: Date range filtering
 * @Prop(orders.createdAt)
 * @CustomFilter({
 *   alias: 'dateRange',
 *   builder: (value, baseColumn) => {
 *     const [start, end] = value.split(',');
 *     return and(
 *       gte(orders.createdAt, start),
 *       lte(orders.createdAt, end)
 *     );
 *   }
 * })
 * dateRange?: string;
 *
 * // Example 3: Complex business logic
 * @Prop(products.price)
 * @CustomFilter({
 *   alias: 'priceCategory',
 *   builder: (value, baseColumn) => {
 *     if (value === 'cheap') return lt(products.price, 10);
 *     if (value === 'medium') return and(gte(products.price, 10), lt(products.price, 50));
 *     if (value === 'expensive') return gte(products.price, 50);
 *     throw new Error('Invalid price category');
 *   }
 * })
 * priceCategory?: string;
 * ```
 */
export function CustomFilter(
  options: CustomFilterOptions
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (!options.builder) {
      throw new Error(
        `@CustomFilter: builder function is required for property '${String(propertyKey)}'`
      );
    }

    const existing: FilterMetadata[] =
      Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

    const filterMetadata: FilterMetadata = {
      operator: 'custom',
      alias: options.alias ?? String(propertyKey),
      default: options.default,
      builder: options.builder
    };

    existing.push(filterMetadata);

    Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
  };
}

