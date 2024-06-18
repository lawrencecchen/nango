/// <reference types="react" />
import type { ColumnDef } from '@tanstack/react-table';
import type { SearchOperationsData } from '@nangohq/types';
export declare const columns: ColumnDef<SearchOperationsData>[];
export declare const SearchInOperation: React.FC<{
    operationId: string;
    isLive: boolean;
}>;
