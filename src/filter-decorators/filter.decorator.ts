import 'reflect-metadata';
import { FilterMetadata, FilterOperator } from '../types/interfaces';
import { FILTERS_METADATA } from '../reflect';

/**
 * Mapping of filter operator strings to their aliases suffix and operator type
 */
const FILTER_OPERATOR_CONFIG: Record<
	string,
	{ operator: FilterOperator; suffix: string }
> = {
	eq: { operator: 'eq', suffix: 'Eq' },
	equal: { operator: 'eq', suffix: 'Eq' },
	like: { operator: 'like', suffix: 'Like' },
	gt: { operator: 'gt', suffix: 'Gt' },
	gte: { operator: 'gte', suffix: 'Gte' },
	lt: { operator: 'lt', suffix: 'Lt' },
	lte: { operator: 'lte', suffix: 'Lte' }
};

/**
 * @Filter decorator - quick way to add multiple filter operators at once
 * @param operators - One or more filter operator strings ('eq', 'like', 'gt', 'lt', etc.)
 *
 * @example
 * ```typescript
 * @Prop(users.firstName)
 * @Filter('eq', 'like')
 * firstName?: string;
 *
 * // Equivalent to:
 * // @Equal()
 * // @Like()
 * ```
 */
export function Filter(...operators: string[]): PropertyDecorator {
	return (target: Object, propertyKey: string | symbol) => {
		const existing: FilterMetadata[] =
			Reflect.getMetadata(FILTERS_METADATA, target, propertyKey) || [];

		for (const operatorStr of operators) {
			const config = FILTER_OPERATOR_CONFIG[operatorStr.toLowerCase()];

			if (!config) {
				throw new Error(
					`Invalid filter operator '${operatorStr}'. Valid operators are: ${Object.keys(
						FILTER_OPERATOR_CONFIG
					).join(', ')}`
				);
			}

			const filterMetadata: FilterMetadata = {
				operator: config.operator,
				alias: config.suffix
					? `${String(propertyKey)}${config.suffix}`
					: String(propertyKey),
				default: undefined
			};

			existing.push(filterMetadata);
		}

		Reflect.defineMetadata(FILTERS_METADATA, existing, target, propertyKey);
	};
}
