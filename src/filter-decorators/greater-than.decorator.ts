import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @GreaterThan decorator - marks a property as filterable with greater than operator
 * @param options - Optional configuration for alias and default value
 */
export const Equal = BuildOperator('gt', (key) => `${String(key)}Gt`);
