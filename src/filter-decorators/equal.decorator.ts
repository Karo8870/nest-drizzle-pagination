import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @Equal decorator - marks a property as filterable with equality operator
 * @param options - Optional configuration for alias and default value
 */
export const Equal = BuildOperator('eq', (key) => `${String(key)}Eq`);
