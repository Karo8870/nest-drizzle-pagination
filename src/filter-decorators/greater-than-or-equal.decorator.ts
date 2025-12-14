import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @GreaterThanOrEqual decorator - marks a property as filterable with greater than or equal operator
 * @param options - Optional configuration for alias and default value
 */
export const GreaterThanOrEqual = BuildOperator(
	'gte',
	(key) => `${String(key)}Gte`
);
