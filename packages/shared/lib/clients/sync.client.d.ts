import { Client } from '@temporalio/client';
import type { LogContext, LogContextGetter } from '@nangohq/logs';
import type { Result } from '@nangohq/utils';

import type { NangoConnection } from '../models/Connection.js';
import type { Config as ProviderConfig } from '../models/Provider.js';
import type { NangoIntegrationData } from '../models/NangoConfig.js';
import type { Sync, SyncWithSchedule } from '../models/Sync.js';
import { SyncCommand } from '../models/Sync.js';
export interface RecordsServiceInterface {
    deleteRecordsBySyncId({ syncId }: { syncId: string }): Promise<{
        totalDeletedRecords: number;
    }>;
}
declare class SyncClient {
    private static instance;
    private client;
    private namespace;
    private constructor();
    static getInstance(): Promise<SyncClient | null>;
    private static create;
    getClient: () => Client | null;
    /**
     * Start Continuous
     * @desc get the connection information and the provider information
     * and kick off an initial sync and also a incremental sync. Also look
     * up any sync configs to call any integration snippet that was setup
     */
    startContinuous(
        nangoConnection: NangoConnection,
        sync: Sync,
        providerConfig: ProviderConfig,
        syncName: string,
        syncData: NangoIntegrationData,
        logContextGetter: LogContextGetter,
        shouldLog: boolean,
        debug?: boolean
    ): Promise<void>;
    deleteSyncSchedule(id: string, environmentId: number): Promise<boolean>;
    describeSchedule(schedule_id: string): Promise<false | import('@temporalio/proto').temporal.api.workflowservice.v1.DescribeScheduleResponse>;
    formatFutureRun(nextRun: number): Date | string;
    runSyncCommand({
        scheduleId,
        syncId,
        command,
        activityLogId,
        environmentId,
        providerConfigKey,
        connectionId,
        syncName,
        nangoConnectionId,
        logCtx,
        recordsService,
        initiator
    }: {
        scheduleId: string;
        syncId: string;
        command: SyncCommand;
        activityLogId: number;
        environmentId: number;
        providerConfigKey: string;
        connectionId: string;
        syncName: string;
        nangoConnectionId?: number | undefined;
        logCtx: LogContext;
        recordsService: RecordsServiceInterface;
        initiator: string;
    }): Promise<Result<boolean>>;
    cancelSync(syncId: string): Promise<Result<boolean>>;
    triggerSyncs(syncs: SyncWithSchedule[], environmentId: number): Promise<void>;
    updateSyncSchedule(
        schedule_id: string,
        interval: string,
        offset: number,
        environmentId: number,
        syncName?: string,
        activityLogId?: number,
        logCtx?: LogContext
    ): Promise<void>;
    triggerInitialSync({
        syncId,
        jobId,
        syncName,
        nangoConnection,
        debug
    }: {
        syncId: string;
        jobId?: string;
        syncName: string;
        nangoConnection: NangoConnection;
        debug?: boolean;
    }): Promise<boolean>;
}
export default SyncClient;
