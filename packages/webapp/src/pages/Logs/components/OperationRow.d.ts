/// <reference types="react" />
import type { Row } from '@tanstack/react-table';
import type { SearchOperationsData } from '@nangohq/types';
export declare const OperationRow: React.FC<{
    row: Row<SearchOperationsData>;
    onSelectOperation: (open: boolean, operationId: string) => void;
}>;
