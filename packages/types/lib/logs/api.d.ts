import type { Endpoint } from '../api.ts.js';
import type { MessageOperation, MessageRow, MessageState, OperationRow } from './messages.ts.js';
declare type Concat<T extends MessageOperation> =
    | T[keyof T]
    | (T extends {
          action: string;
      }
          ? `${T['type']}:${T['action']}`
          : never);
export declare type SearchOperations = Endpoint<{
    Method: 'POST';
    Path: '/api/v1/logs/operations';
    Querystring: {
        env: string;
    };
    Body: {
        limit?: number;
        states?: SearchOperationsState[];
        types?: SearchOperationsType[];
        integrations?: SearchOperationsIntegration[] | undefined;
        connections?: SearchOperationsConnection[] | undefined;
        syncs?: SearchOperationsSync[] | undefined;
        period?: SearchOperationsPeriod | undefined;
        cursor?: string | null | undefined;
    };
    Success: {
        data: OperationRow[];
        pagination: {
            total: number;
            cursor: string | null;
        };
    };
}>;
export declare type SearchOperationsState = 'all' | MessageState;
export declare type SearchOperationsType = 'all' | Concat<MessageOperation>;
export declare type SearchOperationsIntegration = 'all' | string;
export declare type SearchOperationsConnection = 'all' | string;
export declare type SearchOperationsSync = 'all' | string;
export interface SearchOperationsPeriod {
    from: string;
    to: string;
}
export declare type SearchOperationsData = SearchOperations['Success']['data'][0];
export declare type GetOperation = Endpoint<{
    Method: 'GET';
    Path: `/api/v1/logs/operations/:operationId`;
    Querystring: {
        env: string;
    };
    Params: {
        operationId: string;
    };
    Success: {
        data: OperationRow;
    };
}>;
export declare type SearchMessages = Endpoint<{
    Method: 'POST';
    Path: '/api/v1/logs/messages';
    Querystring: {
        env: string;
    };
    Body: {
        operationId: string;
        limit?: number;
        states?: SearchOperationsState[];
        search?: string | undefined;
        cursorBefore?: string | null | undefined;
        cursorAfter?: string | null | undefined;
    };
    Success: {
        data: MessageRow[];
        pagination: {
            total: number;
            cursorBefore: string | null;
            cursorAfter: string | null;
        };
    };
}>;
export declare type SearchMessagesData = SearchMessages['Success']['data'][0];
export declare type SearchFilters = Endpoint<{
    Method: 'POST';
    Path: '/api/v1/logs/filters';
    Querystring: {
        env: string;
    };
    Body: {
        category: 'integration' | 'syncConfig' | 'connection';
        search?: string | undefined;
    };
    Success: {
        data: {
            key: string;
            doc_count: number;
        }[];
    };
}>;
export declare type SearchFiltersData = SearchMessages['Success']['data'][0];
export {};
