import type { NangoConnection } from '@nangohq/models/Connection.js';
import type { Job as SyncJob } from '@nangohq/models/Sync.js';
export declare const createSyncJob: (
    sync_id: string,
    type: SyncType,
    status: SyncStatus,
    job_id: string,
    nangoConnection: NangoConnection | null,
    run_id?: string
) => Promise<Pick<SyncJob, 'id'> | null>;
export declare const updateRunId: (id: number, run_id: string) => Promise<void>;
export declare const getLatestSyncJob: (sync_id: string) => Promise<SyncJob | null>;
export declare const updateSyncJobStatus: (id: number, status: SyncStatus) => Promise<void>;
export declare const updateLatestJobSyncStatus: (sync_id: string, status: SyncStatus) => Promise<void>;
/**
 * Update Sync Job Result
 * @desc grab any existing results and add them to the current
 */
export declare const updateSyncJobResult: (id: number, result: SyncResultByModel, model: string) => Promise<SyncJob>;
export declare const addSyncConfigToJob: (id: number, sync_config_id: number) => Promise<void>;
export declare const isSyncJobRunning: (sync_id: string) => Promise<Pick<SyncJob, 'id' | 'job_id' | 'run_id'> | null>;
export declare const isInitialSyncStillRunning: (sync_id: string) => Promise<boolean>;
export declare function softDeleteJobs({ syncId, limit }: { syncId: string; limit: number }): Promise<number>;
