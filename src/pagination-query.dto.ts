import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { QueryParserService } from './query-parser.service';

/**
 * @PaginatedQuery parameter decorator
 * Extracts and parses query parameters based on DTO metadata
 *
 * @param dtoClass - The DTO class with @Pagination and filter decorators
 *
 * @example
 * ```typescript
 * @Get()
 * async findAll(@PaginatedQuery(FindAccountsDto) queryInstructions: PaginatedQueryResult) {
 *   console.log(queryInstructions);
 *   // ... use queryInstructions to build and execute query
 * }
 * ```
 */
export const PaginatedQuery = createParamDecorator(
	(dtoClass: any, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const queryParams = request.query;

		// Create parser instance and parse query
		const parser = new QueryParserService();
		return parser.parse(dtoClass, queryParams);
	}
);