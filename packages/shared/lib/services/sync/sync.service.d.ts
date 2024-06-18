import type { IncomingFlowConfig, SyncAndActionDifferences, Sync, SyncWithSchedule } from '@nangohq/models/Sync.js';
import { SyncStatus } from '@nangohq/models/Sync.js';
import type { ActiveLogIds } from '@nangohq/types';
import type { LogContext, LogContextGetter } from '@nangohq/logs';

import type { Orchestrator } from '../../clients/orchestrator.js';
/**
 * Sync Service
 * @description
 *  A Sync is active Nango Sync on the connection level that has:
 *  - collection of sync jobs (initial or incremental)
 *  - sync schedule
 *  - bunch of sync data records
 *
 *  A Sync config is a separate entity that is not necessarily active on the
 *  provider level that has no direction to a sync
 *  A Sync job can connect a sync and a sync config as it has both a `sync_id`
 * and `sync_config_id`
 *
 */
export declare const getById: (id: string) => Promise<Sync | null>;
export declare const createSync: (nangoConnectionId: number, name: string) => Promise<Sync | null>;
export declare const getLastSyncDate: (id: string) => Promise<Date | null>;
export declare const clearLastSyncDate: (id: string) => Promise<void>;
export declare function setFrequency(id: string, frequency: string | null): Promise<void>;
/**
 * Set Last Sync Date
 */
export declare const setLastSyncDate: (id: string, date: Date) => Promise<boolean>;
/**
 * Get Last Sync Date
 * @desc this is the very end of the sync process so we know when the sync job
 * is completely finished
 */
export declare const getJobLastSyncDate: (sync_id: string) => Promise<Date | null>;
export declare const getSyncByIdAndName: (nangoConnectionId: number, name: string) => Promise<Sync | null>;
export declare const getSyncsFlat: (nangoConnection: Connection) => Promise<SyncWithSchedule[]>;
export declare const getSyncsFlatWithNames: (nangoConnection: Connection, syncNames: string[]) => Promise<SyncWithSchedule[]>;
/**
 * Get Syncs
 * @description get the sync related to the connection
 * the latest sync and its result and the next sync based on the schedule
 */
export declare const getSyncs: (
    nangoConnection: Connection,
    orchestrator: Orchestrator
) => Promise<
    (Sync & {
        status: SyncStatus;
        active_logs: ActiveLogIds;
    })[]
>;
export declare const getSyncsByConnectionId: (nangoConnectionId: number) => Promise<Sync[] | null>;
declare type SyncWithConnectionId = Sync & {
    connection_id: string;
};
export declare const getSyncsByProviderConfigKey: (environment_id: number, providerConfigKey: string) => Promise<SyncWithConnectionId[]>;
export declare const getSyncsByProviderConfigAndSyncName: (environment_id: number, providerConfigKey: string, syncName: string) => Promise<Sync[]>;
export declare const getSyncNamesByConnectionId: (nangoConnectionId: number) => Promise<string[]>;
export declare const getSyncsByProviderConfigAndSyncNames: (environment_id: number, providerConfigKey: string, syncNames: string[]) => Promise<Sync[]>;
/**
 * Verify Ownership
 * @desc verify that the incoming account id matches with the provided nango connection id
 */
export declare const verifyOwnership: (nangoConnectionId: number, environment_id: number, syncId: string) => Promise<boolean>;
export declare const isSyncValid: (connection_id: string, provider_config_key: string, environment_id: number, sync_id: string) => Promise<boolean>;
export declare const softDeleteSync: (syncId: string) => Promise<string>;
export declare const findSyncByConnections: (connectionIds: number[], sync_name: string) => Promise<Sync[]>;
export declare const getSyncsBySyncConfigId: (environmentId: number, syncConfigId: number) => Promise<Sync[]>;
export declare const getSyncsByConnectionIdsAndEnvironmentIdAndSyncName: (connectionIds: string[], environmentId: number, syncName: string) => Promise<Sync[]>;
export declare const getAndReconcileDifferences: ({
    environmentId,
    flows,
    performAction,
    activityLogId,
    debug,
    singleDeployMode,
    logCtx,
    logContextGetter,
    orchestrator
}: {
    environmentId: number;
    flows: IncomingFlowConfig[];
    performAction: boolean;
    activityLogId: number | null;
    debug?: boolean | undefined;
    singleDeployMode?: boolean | undefined;
    logCtx?: LogContext;
    logContextGetter: LogContextGetter;
    orchestrator: Orchestrator;
}) => Promise<SyncAndActionDifferences | null>;
export interface PausableSyncs {
    id: string;
    name: string;
    config_id: number;
    provider_unique_key: string;
    provider: string;
    environment_id: number;
    environment_name: string;
    account_id: number;
    account_name: string;
    sync_config_id: number;
    connection_unique_id: number;
    connection_id: string;
    unique_key: string;
    schedule_id: string;
}
export declare function findPausableDemoSyncs(): Promise<PausableSyncs[]>;
export declare function findRecentlyDeletedSync(): Promise<
    {
        id: string;
    }[]
>;
export declare function trackFetch(nango_connection_id: number): Promise<void>;
export {};
