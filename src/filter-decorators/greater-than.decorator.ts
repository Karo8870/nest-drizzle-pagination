import 'reflect-metadata';
import { FilterMetadata, OperatorOptions } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

/**
 * @GreaterThan decorator - marks a property as filterable with greater than operator
 * @param options - Optional configuration for alias and default value
 */
export function GreaterThan(options: OperatorOptions = {}): PropertyDecorator {
	return (target: Object, propertyKey: string | symbol) => {
		const existing: FilterMetadata[] =
			Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

		const filterMetadata: FilterMetadata = {
			operator: 'gt',
			alias: options.alias ?? `${String(propertyKey)}Gt`,
			default: options.default
		};

		existing.push(filterMetadata);

		Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
	};
}
