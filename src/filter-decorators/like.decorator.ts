import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @Like decorator - marks a property as filterable with LIKE/contains operator
 * @param options - Optional configuration for alias and default value
 */
export const Equal = BuildOperator('like', (key) => `${String(key)}Like`);
