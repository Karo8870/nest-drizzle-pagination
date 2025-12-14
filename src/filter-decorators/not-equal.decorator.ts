import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @NotEqual decorator - marks a property as filterable with equality operator
 * @param options - Optional configuration for alias and default value
 */
export const NotEqual = BuildOperator('neq', (key) => `${String(key)}Neq`);
