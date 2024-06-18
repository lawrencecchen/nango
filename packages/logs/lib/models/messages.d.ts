import type {
    MessageRow,
    OperationRow,
    SearchOperationsConnection,
    SearchOperationsIntegration,
    SearchOperationsPeriod,
    SearchOperationsState,
    SearchOperationsSync,
    SearchOperationsType
} from '@nangohq/types';
import { errors } from '@elastic/elasticsearch';
import type { SetRequired } from 'type-fest';
export interface ListOperations {
    count: number;
    items: OperationRow[];
    cursor: string | null;
}
export interface ListMessages {
    count: number;
    items: MessageRow[];
    cursorAfter: string | null;
    cursorBefore: string | null;
}
export interface ListFilters {
    items: {
        key: string;
        doc_count: number;
    }[];
}
export declare const ResponseError: typeof errors.ResponseError;
/**
 * Create one message
 */
export declare function createMessage(row: MessageRow): Promise<{
    index: string;
}>;
/**
 * List operations
 */
export declare function listOperations(opts: {
    accountId: number;
    environmentId?: number;
    limit: number;
    states?: SearchOperationsState[] | undefined;
    types?: SearchOperationsType[] | undefined;
    integrations?: SearchOperationsIntegration[] | undefined;
    connections?: SearchOperationsConnection[] | undefined;
    syncs?: SearchOperationsSync[] | undefined;
    period?: SearchOperationsPeriod | undefined;
    cursor?: string | null | undefined;
}): Promise<ListOperations>;
/**
 * Get a single operation
 */
export declare function getOperation(opts: { id: MessageRow['id']; indexName?: string | null }): Promise<MessageRow>;
/**
 * Update a row (can be a partial update)
 */
export declare function update(opts: { id: MessageRow['id']; data: SetRequired<Partial<Omit<MessageRow, 'id'>>, 'createdAt'> }): Promise<void>;
/**
 * Set an operation as currently running
 */
export declare function setRunning(opts: Pick<MessageRow, 'id' | 'createdAt'>): Promise<void>;
/**
 * Set an operation as success
 */
export declare function setSuccess(opts: Pick<MessageRow, 'id' | 'createdAt'>): Promise<void>;
/**
 * Set an operation as failed
 */
export declare function setFailed(opts: Pick<MessageRow, 'id' | 'createdAt'>): Promise<void>;
/**
 * Set an operation as failed
 */
export declare function setCancelled(opts: Pick<MessageRow, 'id' | 'createdAt'>): Promise<void>;
/**
 * Set an operation as timeout
 */
export declare function setTimeouted(opts: Pick<MessageRow, 'id' | 'createdAt'>): Promise<void>;
/**
 * List messages
 */
export declare function listMessages(opts: {
    parentId: string;
    limit: number;
    states?: SearchOperationsState[] | undefined;
    search?: string | undefined;
    cursorBefore?: string | null | undefined;
    cursorAfter?: string | null | undefined;
}): Promise<ListMessages>;
/**
 * List filters
 */
export declare function listFilters(opts: {
    accountId: number;
    environmentId: number;
    limit: number;
    category: 'integration' | 'syncConfig' | 'connection';
    search?: string | undefined;
}): Promise<ListFilters>;
export declare function setTimeoutForAll(opts?: { wait?: boolean }): Promise<void>;
