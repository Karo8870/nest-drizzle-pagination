# Nest Drizzle Pagination

**nest-drizzle-pagination** is a powerful NestJS library that provides flexible, decorator-based pagination, filtering, and sorting capabilities for Drizzle ORM.

## Quick Navigation

- [Introduction](https://graphzz.vercel.app/docs/nest-drizzle-pagination/introduction) - Overview and key features
- [Installation](https://graphzz.vercel.app/docs/nest-drizzle-pagination/installation) - Setup instructions
- [Quick Start](https://graphzz.vercel.app/docs/nest-drizzle-pagination/quick-start) - Get started in minutes
- [Core Concepts](https://graphzz.vercel.app/docs/nest-drizzle-pagination/core-concepts) - Understanding the library
- [Pagination Types](https://graphzz.vercel.app/docs/nest-drizzle-pagination/pagination-types) - Offset vs Cursor pagination
- [Decorators Reference](https://graphzz.vercel.app/docs/nest-drizzle-pagination/decorators) - Complete decorator guide
- [Filtering](https://graphzz.vercel.app/docs/nest-drizzle-pagination/filtering) - Filter operators and examples
- [Sorting](https://graphzz.vercel.app/docs/nest-drizzle-pagination/sorting) - Single and multi-field sorting
- [Advanced Features](https://graphzz.vercel.app/docs/nest-drizzle-pagination/advanced-features) - Many-to-many, custom filters, and more
- [API Reference](https://graphzz.vercel.app/docs/nest-drizzle-pagination/api-reference) - Services, types, and interfaces
- [Complete Examples](https://graphzz.vercel.app/docs/nest-drizzle-pagination/examples) - Real-world usage examples
- [Best Practices](https://graphzz.vercel.app/docs/nest-drizzle-pagination/best-practices) - Recommended patterns
- [Troubleshooting](https://graphzz.vercel.app/docs/nest-drizzle-pagination/troubleshooting) - Common issues and solutions

## Key Features

- **Dual Pagination Support**: Both offset-based (page/limit) and cursor-based (keyset) pagination
- **Declarative API**: Use decorators to define pagination, filtering, and sorting behavior
- **Type-Safe**: Full TypeScript support with type inference
- **Flexible Filtering**: Multiple filter operators per property with custom aliases
- **Advanced Sorting**: Single or multiple field sorting with computed column support
- **Many-to-Many Filtering**: Built-in support for filtering by many-to-many relations
- **Conditional Filtering**: Switch-based filters that apply different conditions based on query values
- **Custom Filters**: Full control with custom SQL builder functions
- **Auto-Detection**: Automatically detects pagination type based on query parameters
- **Validation**: Built-in validation with helpful error messages

## Installation

```bash
npm install nest-drizzle-pagination
```

## Quick Example

```typescript
@Pagination({
  paginationType: 'both',
  cursorIdField: users.id,
  limit: 10,
  maxLimit: 100
})
export class FindUsersDto extends BasePaginationDto {
  @Prop(users.firstName)
  @Sortable()
  @Equal()
  @Like()
  firstName?: string;
}
```

```typescript
@Get()
async findAll(@PaginatedQuery(FindUsersDto) query: PaginatedQueryResult) {
  const baseQuery = db.select().from(users);
  return await this.paginationService.execute(baseQuery, query);
}
```
