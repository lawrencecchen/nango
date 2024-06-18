import type { Connection } from '@nangohq/models/Connection.js';
import type { SyncDeploymentResult, IncomingFlowConfig, ReportedSyncJobStatus } from '@nangohq/models/Sync.js';
import type { ServiceResponse } from '@nangohq/models/Generic.js';
import { SyncStatus, ScheduleStatus, SyncCommand } from '@nangohq/models/Sync.js';
import type { LogContext, LogContextGetter } from '@nangohq/logs';
import type { Environment } from '@nangohq/models/Environment.js';

import type { RecordsServiceInterface } from '../../clients/sync.client.js';
import type { Orchestrator } from '../../clients/orchestrator.js';
export declare const syncCommandToOperation: {
    readonly PAUSE: 'pause';
    readonly UNPAUSE: 'unpause';
    readonly RUN: 'request_run';
    readonly RUN_FULL: 'request_run_full';
    readonly CANCEL: 'cancel';
};
interface CreateSyncArgs {
    connections: Connection[];
    providerConfigKey: string;
    environmentId: number;
    sync: IncomingFlowConfig;
    syncName: string;
}
export declare class SyncManagerService {
    createSyncForConnection(nangoConnectionId: number, logContextGetter: LogContextGetter, orchestrator: Orchestrator): Promise<void>;
    createSyncForConnections(
        connections: Connection[],
        syncName: string,
        providerConfigKey: string,
        environmentId: number,
        sync: IncomingFlowConfig,
        logContextGetter: LogContextGetter,
        orchestrator: Orchestrator,
        debug?: boolean,
        activityLogId?: number,
        logCtx?: LogContext
    ): Promise<boolean>;
    createSyncs(
        syncArgs: CreateSyncArgs[],
        logContextGetter: LogContextGetter,
        orchestrator: Orchestrator,
        debug?: boolean,
        activityLogId?: number,
        logCtx?: LogContext
    ): Promise<boolean>;
    /**
     * Delete
     * @desc delete a sync and all the related objects
     * 1) sync config files
     * 2) sync config
     */
    deleteConfig(syncConfigId: number, environmentId: number): Promise<void>;
    softDeleteSync(syncId: string, environmentId: number, orchestrator: Orchestrator): Promise<void>;
    softDeleteSyncsByConnection(connection: Connection, orchestrator: Orchestrator): Promise<void>;
    deleteSyncsByProviderConfig(environmentId: number, providerConfigKey: string, orchestrator: Orchestrator): Promise<void>;
    runSyncCommand({
        recordsService,
        orchestrator,
        environment,
        providerConfigKey,
        syncNames,
        command,
        logContextGetter,
        connectionId,
        initiator
    }: {
        recordsService: RecordsServiceInterface;
        orchestrator: Orchestrator;
        environment: Environment;
        providerConfigKey: string;
        syncNames: string[];
        command: SyncCommand;
        logContextGetter: LogContextGetter;
        connectionId?: string;
        initiator: string;
    }): Promise<ServiceResponse<boolean>>;
    getSyncStatus(
        environmentId: number,
        providerConfigKey: string,
        syncNames: string[],
        orchestrator: Orchestrator,
        connectionId?: string,
        includeJobStatus?: boolean,
        optionalConnection?: Connection | null
    ): Promise<ServiceResponse<ReportedSyncJobStatus[] | void>>;
    /**
     * Classify Sync Status
     * @desc categornize the different scenarios of sync status
     * 1. If the schedule is paused and the job is not running, then the sync is paused
     * 2. If the schedule is paused and the job is not running then the sync is stopped (last return case)
     * 3. If the schedule is running but the last job is null then it is an error
     * 4. If the job status is stopped then it is an error
     * 5. If the job status is running then it is running
     * 6. If the job status is success then it is success
     */
    legacyClassifySyncStatus(jobStatus: SyncStatus, scheduleStatus: ScheduleStatus): SyncStatus;
    classifySyncStatus(jobStatus: SyncStatus, scheduleState: 'STARTED' | 'PAUSED' | 'DELETED'): SyncStatus;
    /**
     * Trigger If Connections Exist
     * @desc for the recently deploy flows, create the sync and trigger it if there are connections
     */
    triggerIfConnectionsExist(
        flows: SyncDeploymentResult[],
        environmentId: number,
        logContextGetter: LogContextGetter,
        orchestrator: Orchestrator
    ): Promise<void>;
    private syncStatus;
    private legacySyncStatus;
}
declare const _default: SyncManagerService;
export default _default;
