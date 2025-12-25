import { Injectable } from '@nestjs/common';
import { and, asc, desc, SQL, SQLWrapper } from 'drizzle-orm';

import {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
  PaginatedQueryResult,
  SortInstruction
} from './types/interfaces';
import { throwBadRequestException } from './core/bad-request.exception';
import { decodeCursor, encodeCursor } from './cursor.utils';
import { applyFilterOperator } from './apply-filter-operator';
import { buildCursorWhereClause } from './cursor-where-builder';

@Injectable()
export class PaginationService {
  /**
   * Main execute method that delegates to offset or cursor pagination
   * @param baseQuery - Base Drizzle query builder
   * @param queryInstructions - Parsed query instructions from DTO
   * @param extraConditions - Other conditions appended via and
   * @returns Paginated response
   */
  async execute<T = any>(
    baseQuery: any,
    queryInstructions: PaginatedQueryResult,
    extraConditions: SQL<unknown>[] = []
  ): Promise<OffsetPaginatedResponse<T> | CursorPaginatedResponse<T>> {
    const { paginationType, paginationOptions } = queryInstructions;

    const allowedType = paginationOptions.paginationType ?? 'both';

    if (allowedType === 'offset' && paginationType === 'cursor') {
      throwBadRequestException(
        'Cursor-based pagination is not enabled for this endpoint. Use "page" parameter instead.'
      );
    }

    if (allowedType === 'cursor' && paginationType === 'offset') {
      throwBadRequestException(
        'Offset-based pagination is not enabled for this endpoint. Remove "page" parameter to use cursor pagination.'
      );
    }

    if (paginationOptions.paginationType === 'cursor') {
      const cursorIdField = paginationOptions.cursorIdField;

      if (!cursorIdField) {
        throwBadRequestException(
          'Cursor pagination requires cursorIdField to be defined in @Pagination decorator'
        );
      }

      return this.executeCursor<T>(
        baseQuery,
        queryInstructions,
        cursorIdField,
        // extractCursorValues,
        extraConditions
      );
    } else {
      return this.executeOffset<T>(
        baseQuery,
        queryInstructions,
        extraConditions
      );
    }
  }

  /**
   * Execute offset-based pagination
   * @param baseQuery - Base Drizzle query builder
   * @param queryInstructions - Parsed query instructions
   * @param extraConditions
   * @returns Offset paginated response
   */
  async executeOffset<T = any>(
    baseQuery: any,
    queryInstructions: PaginatedQueryResult,
    extraConditions: SQL<unknown>[]
  ): Promise<OffsetPaginatedResponse<T>> {
    const { filters, sorting, limit, offset, page } = queryInstructions;

    let query = baseQuery;

    if (filters.length > 0) {
      const filterConditions = filters.map((filter) =>
        applyFilterOperator(
          filter.column,
          filter.operator,
          filter.value,
          filter.builder,
          filter.table,
          filter.conditions
        )
      );

      if (extraConditions) {
        query = query.where(and(...filterConditions, ...extraConditions));
      } else {
        query = query.where(and(...filterConditions));
      }
    }

    if (sorting.length > 0) {
      const orderByColumns = sorting.map((sort) => {
        return sort.order.toUpperCase() === 'DESC'
          ? desc(sort.column)
          : asc(sort.column);
      });
      query = query.orderBy(...orderByColumns);
    }

    if (offset !== undefined) {
      query = query.offset(offset);
    }
    query = query.limit(limit);

    const data = await query;

    return {
      values: data,
      page: page || 1,
      limit
    };
  }

  /**
   * Execute cursor-based pagination
   * @param query - Base Drizzle query builder
   * @param queryInstructions - Parsed query instructions
   * @param extraConditions
   * @param cursorIdField - ID field for cursor uniqueness
   * @returns Cursor paginated response
   */
  async executeCursor<T = any>(
    query: any,
    queryInstructions: PaginatedQueryResult,
    cursorIdField: any,
    extraConditions: SQL<unknown>[]
  ): Promise<CursorPaginatedResponse<T>> {
    const { filters, sorting, limit, cursor } = queryInstructions;

    let filterConditions = filters.map((filter) =>
      applyFilterOperator(
        filter.column,
        filter.operator,
        filter.value,
        filter.builder,
        filter.table,
        filter.conditions
      )
    );

    const sortingWithId = this.ensureIdInSorting(sorting, cursorIdField);

    let cursorWhere: SQL<unknown> | SQLWrapper | undefined;

    if (cursor) {
      const cursorValues = decodeCursor(cursor);
      cursorWhere = buildCursorWhereClause(
        sortingWithId,
        cursorValues,
        cursorIdField
      );
    }

    if (cursorWhere) {
      query = query.where(
        and(cursorWhere, ...filterConditions, ...extraConditions)
      );
    } else {
      query = query.where(and(...filterConditions, ...extraConditions));
    }

    const orderByColumns = sortingWithId.map((sort) => {
      return sort.order.toUpperCase() === 'DESC'
        ? desc(sort.column)
        : asc(sort.column);
    });
    query = query.orderBy(...orderByColumns);

    query = query.limit(limit + 1);

    console.log(query.toSQL());

    const results = await query;

    const hasMore = results.length > limit;

    const data = hasMore ? results.slice(0, limit) : results;

    let nextCursor: string | null = null;
    if (hasMore && data.length > 0) {
      const lastRecord = data[data.length - 1];
      const cursorValues = this.extractCursorValuesFromRecord(
        lastRecord,
        sortingWithId
      );
      nextCursor = encodeCursor(cursorValues);
    }

    return {
      values: data as T[],
      cursor: nextCursor
    };
  }

  /**
   * Extract cursor values from a record using sqlProperty from sort instructions
   * @param record - The last record from the query result
   * @param sortInstructions - Array of sort instructions with sqlProperty
   * @returns Object with extracted cursor values
   */
  private extractCursorValuesFromRecord(
    record: any,
    sortInstructions: SortInstruction[]
  ): Record<string, any> {
    const values: Record<string, any> = {};

    for (const sort of sortInstructions) {
      // Get the key to use in the cursor (must match buildCursorWhereClause logic)
      const cursorKey = this.getCursorKey(sort);

      // Extract the value from the record
      if (sort.sqlProperty) {
        if (typeof sort.sqlProperty === 'function') {
          // sqlProperty is a function - call it with the record
          values[cursorKey] = sort.sqlProperty(record);
        } else {
          // sqlProperty is a string - use it as the field name
          if (!(sort.sqlProperty in record)) {
            throw new Error(
              `Field '${sort.sqlProperty}' not found in record for cursor generation`
            );
          }
          values[cursorKey] = record[sort.sqlProperty];
        }
      } else {
        // No sqlProperty - use cursorKey directly as the field name
        if (!(cursorKey in record)) {
          throw new Error(
            `Field '${cursorKey}' not found in record for cursor generation`
          );
        }
        values[cursorKey] = record[cursorKey];
      }
    }

    return values;
  }

  /**
   * Get the cursor key from a sort instruction
   * This must match the logic in buildCursorWhereClause
   * @param sort - Sort instruction
   * @returns Cursor key string
   */
  private getCursorKey(sort: SortInstruction): string {
    // Priority: propertyKey > sqlProperty > columnName
    if (sort.propertyKey) {
      return sort.propertyKey;
    }
    if (sort.sqlProperty && typeof sort.sqlProperty === 'string') {
      return sort.sqlProperty;
    }
    return this.getColumnName(sort.column);
  }

  /**
   * Ensure ID field is included in sorting for cursor uniqueness
   * @param sorting - Original sort instructions
   * @param cursorIdField - ID field to append
   * @returns Sort instructions with ID field
   */
  private ensureIdInSorting(
    sorting: SortInstruction[],
    cursorIdField: any
  ): SortInstruction[] {
    const idFieldName = this.getColumnName(cursorIdField);

    const hasId = sorting.some(
      (sort) => this.getColumnName(sort.column) === idFieldName
    );

    if (hasId) {
      return sorting;
    }

    return [
      ...sorting,
      {
        propertyKey: idFieldName,
        column: cursorIdField,
        order: 'ASC'
      }
    ];
  }

  /**
   * Extract column name from Drizzle column object
   * @param column - Drizzle column reference
   * @returns Column name as string
   */
  private getColumnName(column: any): string {
    if (column && typeof column === 'object' && 'name' in column) {
      return column.name;
    }

    const str = String(column);
    const match = str.match(/\["(\w+)"]/);
    if (match) {
      return match[1];
    }

    return '';
  }
}
