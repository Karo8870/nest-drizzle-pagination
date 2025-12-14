export type FilterOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like';

export interface FilterMetadata {
    operator: FilterOperator;
    alias: string;
    default?: any;
}

export interface OperatorOptions {
    alias?: string;
    default?: any;
}