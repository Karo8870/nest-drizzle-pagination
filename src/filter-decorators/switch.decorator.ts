import 'reflect-metadata';
import { SQL } from 'drizzle-orm';
import { FilterMetadata, OperatorOptions } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

/**
 * Options for @SwitchFilter decorator
 */
export interface SwitchFilterOptions extends OperatorOptions {
  /**
   * Mapping of query parameter values to SQL condition functions
   * Each key represents a possible value from the query parameter
   * Each value is a function that takes the column and returns a SQL condition
   *
   * @example
   * ```typescript
   * @Prop(accounts.balance)
   * @SwitchFilter({
   *   alias: 'type',
   *   conditions: {
   *     'positive': (col) => gt(col, 0),
   *     'negative': (col) => lt(col, 0),
   *     'zero': (col) => eq(col, 0)
   *   }
   * })
   * type?: string;
   * ```
   */
  conditions: Record<string, (column: any) => SQL>;
}

/**
 * @SwitchFilter decorator - applies different SQL conditions based on query parameter value
 * Useful for conditional filtering where the filter logic changes based on the input value
 *
 * @param options - Configuration including conditions mapping
 *
 * @example
 * ```typescript
 * // Filter by balance type
 * @Prop(accounts.balance)
 * @SwitchFilter({
 *   alias: 'balanceType',
 *   conditions: {
 *     'positive': (col) => gt(col, 0),
 *     'negative': (col) => lt(col, 0),
 *     'zero': (col) => eq(col, 0)
 *   }
 * })
 * balanceType?: string;
 *
 * // Filter by status with complex conditions
 * @Prop(orders.status)
 * @SwitchFilter({
 *   alias: 'orderFilter',
 *   conditions: {
 *     'active': (col) => or(eq(col, 'pending'), eq(col, 'processing')),
 *     'completed': (col) => eq(col, 'completed'),
 *     'cancelled': (col) => eq(col, 'cancelled')
 *   }
 * })
 * orderFilter?: string;
 *
 * // Usage in query:
 * // ?balanceType=positive  -> applies gt(accounts.balance, 0)
 * // ?balanceType=negative  -> applies lt(accounts.balance, 0)
 * // ?orderFilter=active    -> applies or(eq(orders.status, 'pending'), eq(orders.status, 'processing'))
 * ```
 */
export function SwitchFilter(options: SwitchFilterOptions): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (!options.conditions || Object.keys(options.conditions).length === 0) {
      throw new Error(
        `@SwitchFilter: conditions object is required and must not be empty for property '${String(propertyKey)}'`
      );
    }

    // Validate that all condition values are functions
    for (const [key, conditionFn] of Object.entries(options.conditions)) {
      if (typeof conditionFn !== 'function') {
        throw new Error(
          `@SwitchFilter: condition for key '${key}' must be a function, got ${typeof conditionFn}`
        );
      }
    }

    const existing: FilterMetadata[] =
      Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

    const filterMetadata: FilterMetadata = {
      operator: 'switch',
      alias: options.alias ?? String(propertyKey),
      default: options.default,
      conditions: options.conditions
    };

    existing.push(filterMetadata);

    Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
  };
}
