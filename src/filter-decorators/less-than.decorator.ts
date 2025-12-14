import 'reflect-metadata';
import { BuildOperator } from '../core/build-operator';

/**
 * @LessThan decorator - marks a property as filterable with less than operator
 * @param options - Optional configuration for alias and default value
 */
export const LessThan = BuildOperator('lt', (key) => `${String(key)}Lt`);
