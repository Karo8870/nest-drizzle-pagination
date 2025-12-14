/**
 * Base class for paginated DTOs
 * Provides common pagination query parameters
 */
export class BasePaginationDto {
	/**
	 * Cursor for cursor-based pagination
	 */
	cursor?: string;

	/**
	 * Page number for offset-based pagination (default: 1)
	 */
	page?: number;

	/**
	 * Number of items per page (overrides default limit if allowCustomLimit=true)
	 */
	limit?: number;

	/**
	 * Fields to sort by (overrides defaultSort if allowCustomSort=true)
	 * Comma-separated for multiple fields: "firstName,lastName"
	 */
	sortBy?: string;

	/**
	 * Sort order for each sortBy field (ASC or DESC)
	 * Comma-separated for multiple orders: "ASC,DESC"
	 */
	sortOrder?: string;
}
