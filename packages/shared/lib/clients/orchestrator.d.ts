import type { LogContext, LogContextGetter } from '@nangohq/logs';
import type { Result } from '@nangohq/utils';
import type {
    ExecuteReturn,
    ExecuteActionProps,
    ExecuteWebhookProps,
    ExecutePostConnectionProps,
    ExecuteSyncProps,
    VoidReturn,
    OrchestratorTask,
    RecurringProps,
    SchedulesReturn,
    OrchestratorSchedule
} from '@nangohq/nango-orchestrator';

import { NangoError } from '../utils/error.js';
import type { NangoConnection } from '../models/Connection.js';
import type { Config as ProviderConfig } from '../models/Provider.js';
import type { Account } from '../models/Admin.js';
import type { Environment } from '../models/Environment.js';
import type { NangoIntegrationData, Sync, SyncConfig } from '../models/index.js';
import { SyncCommand } from '../models/index.js';
export interface RecordsServiceInterface {
    deleteRecordsBySyncId({ syncId }: { syncId: string }): Promise<{
        totalDeletedRecords: number;
    }>;
}
export interface OrchestratorClientInterface {
    recurring(props: RecurringProps): Promise<
        Result<{
            scheduleId: string;
        }>
    >;
    executeAction(props: ExecuteActionProps): Promise<ExecuteReturn>;
    executeWebhook(props: ExecuteWebhookProps): Promise<ExecuteReturn>;
    executePostConnection(props: ExecutePostConnectionProps): Promise<ExecuteReturn>;
    executeSync(props: ExecuteSyncProps): Promise<VoidReturn>;
    pauseSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn>;
    unpauseSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn>;
    deleteSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn>;
    updateSyncFrequency({ scheduleName, frequencyMs }: { scheduleName: string; frequencyMs: number }): Promise<VoidReturn>;
    cancel({ taskId, reason }: { taskId: string; reason: string }): Promise<Result<OrchestratorTask>>;
    searchSchedules({ scheduleNames, limit }: { scheduleNames: string[]; limit: number }): Promise<SchedulesReturn>;
}
export declare class Orchestrator {
    private client;
    constructor(client: OrchestratorClientInterface);
    searchSchedules(
        props: {
            syncId: string;
            environmentId: number;
        }[]
    ): Promise<Result<Map<string, OrchestratorSchedule>>>;
    triggerAction<T = any>({
        connection,
        actionName,
        input,
        activityLogId,
        environment_id,
        logCtx
    }: {
        connection: NangoConnection;
        actionName: string;
        input: object;
        activityLogId: number;
        environment_id: number;
        logCtx: LogContext;
    }): Promise<Result<T, NangoError>>;
    triggerWebhook<T = any>({
        account,
        environment,
        integration,
        connection,
        webhookName,
        syncConfig,
        input,
        logContextGetter
    }: {
        account: Account;
        environment: Environment;
        integration: ProviderConfig;
        connection: NangoConnection;
        webhookName: string;
        syncConfig: SyncConfig;
        input: object;
        logContextGetter: LogContextGetter;
    }): Promise<Result<T, NangoError>>;
    triggerPostConnectionScript<T = any>({
        connection,
        name,
        fileLocation,
        activityLogId,
        logCtx
    }: {
        connection: NangoConnection;
        name: string;
        fileLocation: string;
        activityLogId: number;
        logCtx: LogContext;
    }): Promise<Result<T, NangoError>>;
    updateSyncFrequency({
        syncId,
        interval,
        syncName,
        environmentId,
        activityLogId,
        logCtx
    }: {
        syncId: string;
        interval: string;
        syncName: string;
        environmentId: number;
        activityLogId?: number;
        logCtx?: LogContext;
    }): Promise<Result<void>>;
    runSyncCommand({
        syncId,
        command,
        activityLogId,
        environmentId,
        logCtx,
        recordsService,
        initiator
    }: {
        syncId: string;
        command: SyncCommand;
        activityLogId: number;
        environmentId: number;
        logCtx: LogContext;
        recordsService: RecordsServiceInterface;
        initiator: string;
    }): Promise<Result<void>>;
    runSyncCommandHelper(props: {
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
    }): Promise<Result<void>>;
    deleteSync({ syncId, environmentId }: { syncId: string; environmentId: number }): Promise<Result<void>>;
    scheduleSync({
        nangoConnection,
        sync,
        providerConfig,
        syncName,
        syncData,
        logContextGetter,
        debug,
        shouldLog
    }: {
        nangoConnection: NangoConnection;
        sync: Sync;
        providerConfig: ProviderConfig;
        syncName: string;
        syncData: NangoIntegrationData;
        logContextGetter: LogContextGetter;
        debug?: boolean;
        shouldLog: boolean;
    }): Promise<Result<void>>;
    scheduleSyncHelper(
        nangoConnection: NangoConnection,
        sync: Sync,
        providerConfig: ProviderConfig,
        syncName: string,
        syncData: NangoIntegrationData,
        logContextGetter: LogContextGetter,
        debug?: boolean
    ): Promise<Result<void>>;
    private cleanInterval;
}
