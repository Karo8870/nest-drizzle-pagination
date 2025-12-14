import 'reflect-metadata';
import { FilterMetadata, OperatorOptions } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

/**
 * @LessThanOrEqual decorator - marks a property as filterable with less than or equal operator
 * @param options - Optional configuration for alias and default value
 */
export function LessThanOrEqual(options: OperatorOptions = {}): PropertyDecorator {
	return (target: Object, propertyKey: string | symbol) => {
		const existing: FilterMetadata[] =
			Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

		const filterMetadata: FilterMetadata = {
			operator: 'lte',
			alias: options.alias ?? `${String(propertyKey)}Lte`,
			default: options.default
		};

		existing.push(filterMetadata);

		Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
	};
}
