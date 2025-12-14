import 'reflect-metadata';
import { FILTERS_METADATA } from '../reflect';
import { FilterMetadata, OperatorOptions } from '../types/interfaces';

/**
 * @Like decorator - marks a property as filterable with LIKE/contains operator
 * @param options - Optional configuration for alias and default value
 */
export function Like(options: OperatorOptions = {}): PropertyDecorator {
	return (target: Object, propertyKey: string | symbol) => {
		const existing: FilterMetadata[] =
			Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

		const filterMetadata: FilterMetadata = {
			operator: 'like',
			alias: options.alias ?? `${String(propertyKey)}Like`,
			default: options.default
		};

		existing.push(filterMetadata);

		Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
	};
}
