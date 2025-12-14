import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @LessThanOrEqual decorator - marks a property as filterable with less than or equal operator
 * @param options - Optional configuration for alias and default value
 */
export const Equal = BuildOperator('lte', (key) => `${String(key)}Lte`);
