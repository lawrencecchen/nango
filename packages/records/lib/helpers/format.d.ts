import type { Result } from '@nangohq/utils';

import type { FormattedRecord, UnencryptedRecordData } from '../types.js';
export declare const formatRecords: ({
    data,
    connectionId,
    model,
    syncId,
    syncJobId,
    softDelete
}: {
    data: UnencryptedRecordData[];
    connectionId: number;
    model: string;
    syncId: string;
    syncJobId: number;
    softDelete?: boolean;
}) => Result<FormattedRecord[]>;
