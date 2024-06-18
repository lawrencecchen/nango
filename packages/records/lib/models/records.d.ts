import type { Result } from '@nangohq/utils';

import type { FormattedRecord, GetRecordsResponse, LastAction, UpsertSummary } from '../types.js';
export declare function getRecords({
    connectionId,
    model,
    modifiedAfter,
    limit,
    filter,
    cursor
}: {
    connectionId: number;
    model: string;
    modifiedAfter?: string;
    limit?: number | string;
    filter?: LastAction;
    cursor?: string;
}): Promise<Result<GetRecordsResponse>>;
export declare function upsert({
    records,
    connectionId,
    model,
    softDelete
}: {
    records: FormattedRecord[];
    connectionId: number;
    model: string;
    softDelete?: boolean;
}): Promise<Result<UpsertSummary>>;
export declare function update({
    records,
    connectionId,
    model
}: {
    records: FormattedRecord[];
    connectionId: number;
    model: string;
}): Promise<Result<UpsertSummary>>;
export declare function deleteRecordsBySyncId({ syncId, limit }: { syncId: string; limit?: number }): Promise<{
    totalDeletedRecords: number;
}>;
export declare function markNonCurrentGenerationRecordsAsDeleted({
    connectionId,
    model,
    syncId,
    generation
}: {
    connectionId: number;
    model: string;
    syncId: string;
    generation: number;
}): Promise<string[]>;
