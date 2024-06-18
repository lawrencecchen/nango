/// <reference types="react" />
import type { SearchOperationsData } from '@nangohq/types';
export declare const OperationTag: React.FC<{
    message: string;
    operation: Exclude<SearchOperationsData['operation'], null>;
    highlight?: boolean;
}>;
