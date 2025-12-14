import 'reflect-metadata';
import { FilterMetadata, OperatorOptions } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

export function Equal(options: OperatorOptions = {}): PropertyDecorator {
	return (target: Object, propertyKey: string | symbol) => {
		const existing: FilterMetadata[] =
			Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

		const filterMetadata: FilterMetadata = {
			operator: 'eq',
			alias: options.alias ?? `${String(propertyKey)}Eq`,
			default: options.default
		};

		existing.push(filterMetadata);

		Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
	};
}
