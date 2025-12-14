import 'reflect-metadata';
import { PaginationOptions } from './types/interfaces';
import { PAGINATION_METADATA } from './reflect';

/**
 * @Pagination class decorator - defines default pagination and sorting behavior for a DTO
 * @param options - Pagination configuration options
 *
 * @example
 * ```typescript
 * // Offset-only pagination
 * @Pagination({
 *   paginationType: 'offset',
 *   limit: 10,
 *   maxLimit: 100
 * })
 * export class FindUsersDto extends BasePaginatedDto { }
 *
 * // Cursor-only pagination
 * @Pagination({
 *   paginationType: 'cursor',
 *   cursorIdField: users.id,
 *   limit: 20
 * })
 * export class FindPostsDto extends BasePaginatedDto { }
 *
 * // Both types allowed (default)
 * @Pagination({
 *   paginationType: 'both', // optional, this is the default
 *   cursorIdField: users.id,
 *   limit: 10
 * })
 * export class FindAccountsDto extends BasePaginatedDto { }
 * ```
 */
export function Pagination(
	options: PaginationOptions = {
		paginationType: 'offset'
	}
): ClassDecorator {
	return (target: Function) => {
		// Validate options
		if (options.limit && options.maxLimit && options.limit > options.maxLimit) {
			throw new Error(
				`@Pagination: limit (${options.limit}) cannot be greater than maxLimit (${options.maxLimit})`
			);
		}

		if (options.maxLimit && options.maxLimit <= 0) {
			throw new Error(
				`@Pagination: maxLimit must be greater than 0, got ${options.maxLimit}`
			);
		}

		if (options.limit && options.limit <= 0) {
			throw new Error(
				`@Pagination: limit must be greater than 0, got ${options.limit}`
			);
		}

		if (options.defaultSort && !Array.isArray(options.defaultSort)) {
			throw new Error(
				`@Pagination: defaultSort must be an array of { field, order }, got ${typeof options.defaultSort}`
			);
		}

		const paginationType = options.paginationType ?? 'both';
		if (!['offset', 'cursor', 'both'].includes(paginationType)) {
			throw new Error(
				`@Pagination: paginationType must be 'offset', 'cursor', or 'both', got '${paginationType}'`
			);
		}

		if (
			(options.paginationType === 'cursor' ||
				options.paginationType === 'both') &&
			!options.cursorIdField
		) {
			throw new Error(
				`@Pagination: cursorIdField is required when paginationType is '${paginationType}'`
			);
		}

		const finalOptions: PaginationOptions = {
			limit: options.limit ?? 10,
			defaultSort: options.defaultSort ?? [],
			allowCustomSort: options.allowCustomSort ?? true,
			allowCustomLimit: options.allowCustomLimit ?? true,
			allowMultipleSort: options.allowMultipleSort ?? true,
			maxLimit: options.maxLimit ?? 100,
			cursorIdField:
				options.paginationType === 'cursor' || options.paginationType === 'both'
					? options.cursorIdField
					: undefined,
			paginationType: options.paginationType
		};

		Reflect.defineMetadata(PAGINATION_METADATA, finalOptions, target.prototype);
	};
}
