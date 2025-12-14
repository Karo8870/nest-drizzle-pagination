import 'reflect-metadata';
import {
	FilterMetadata,
	FilterOperator,
	OperatorOptions
} from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

export function BuildOperator(
	operator: FilterOperator,
	alias: (key: string | symbol) => string
) {
	return (options: OperatorOptions = {}): PropertyDecorator => {
		return (target: Object, propertyKey: string | symbol) => {
			const existing: FilterMetadata[] =
				Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

			const filterMetadata: FilterMetadata = {
				operator: operator,
				alias: options.alias ?? alias(propertyKey),
				default: options.default
			};

			existing.push(filterMetadata);

			Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
		};
	};
}
