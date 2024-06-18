import type { Action, SyncConfigWithProvider, SyncConfig, SlimSync } from '../@nangohq/models/Sync.js';
import type { NangoConnection } from '../@nangohq/models/Connection.js';
import type { Config as ProviderConfig } from '../@nangohq/models/Provider.js';
import type { NangoConfig, StandardNangoConfig } from '../@nangohq/models/NangoConfig.js';
export declare function getSyncConfig(nangoConnection: NangoConnection, syncName?: string, isAction?: boolean): Promise<NangoConfig | null>;
export declare function getAllSyncsAndActions(environment_id: number): Promise<StandardNangoConfig[]>;
export declare function getSyncConfigsByParams(environment_id: number, providerConfigKey: string, isAction?: boolean): Promise<SyncConfig[] | null>;
export declare function getSyncConfigsByConfigId(environment_id: number, nango_config_id: number, isAction?: boolean): Promise<SyncConfig[] | null>;
export declare function getFlowConfigsByParams(environment_id: number, providerConfigKey: string): Promise<SyncConfig[]>;
export declare function getSyncAndActionConfigsBySyncNameAndConfigId(environment_id: number, nango_config_id: number, sync_name: string): Promise<SyncConfig[]>;
export declare function getActionConfigByNameAndProviderConfigKey(environment_id: number, name: string, unique_key: string): Promise<boolean>;
export declare function getActionsByProviderConfigKey(environment_id: number, unique_key: string): Promise<Action[]>;
export declare function getUniqueSyncsByProviderConfig(environment_id: number, unique_key: string): Promise<SyncConfig[]>;
export declare function getSyncAndActionConfigByParams(environment_id: number, sync_name: string, providerConfigKey: string): Promise<SyncConfig | null>;
export declare function getSyncConfigByParams(
    environment_id: number,
    sync_name: string,
    providerConfigKey: string,
    isAction?: boolean
): Promise<SyncConfig | null>;
export declare function deleteSyncConfig(id: number): Promise<void>;
export declare function disableScriptConfig(id: number): Promise<void>;
export declare function enableScriptConfig(id: number): Promise<void>;
export declare function deleteByConfigId(nango_config_id: number): Promise<void>;
export declare function deleteSyncFilesForConfig(id: number, environmentId: number): Promise<void>;
export declare function getActiveCustomSyncConfigsByEnvironmentId(environment_id: number): Promise<SyncConfigWithProvider[]>;
export declare function getSyncConfigsWithConnectionsByEnvironmentId(environment_id: number): Promise<(SyncConfig & ProviderConfig)[]>;
export declare function getSyncConfigsWithConnections(
    providerConfigKey: string,
    environment_id: number
): Promise<
    {
        connections: {
            connection_id: string;
        }[];
        provider: string;
        unique_key: string;
    }[]
>;
/**
 * Get Sync Configs By Provider Key
 * @desc grab all the sync configs by a provider key
 */
export declare function getSyncConfigsByProviderConfigKey(environment_id: number, providerConfigKey: string): Promise<SlimSync[]>;
export declare function getSyncConfigByJobId(job_id: number): Promise<SyncConfig | null>;
export declare function getAttributes(provider_config_key: string, sync_name: string): Promise<object | null>;
export declare function getProviderConfigBySyncAndAccount(sync_name: string, environment_id: number): Promise<string | null>;
export declare function increment(input: number | string): number | string;
export declare function getPublicConfig(environment_id: number): Promise<SyncConfig[]>;
export declare function getNangoConfigIdAndLocationFromId(id: number): Promise<{
    nango_config_id: number;
    file_location: string;
} | null>;
export declare function updateFrequency(sync_config_id: number, runs: string): Promise<void>;
export declare function getConfigWithEndpointsByProviderConfigKey(environment_id: number, provider_config_key: string): Promise<StandardNangoConfig | null>;
export declare function getConfigWithEndpointsByProviderConfigKeyAndName(
    environment_id: number,
    provider_config_key: string,
    name: string
): Promise<StandardNangoConfig | null>;
export declare function getAllSyncAndActionNames(environmentId: number): Promise<string[]>;
export declare function getSyncConfigsByConfigIdForWebhook(environment_id: number, nango_config_id: number): Promise<SyncConfig[]>;
export declare function getSyncConfigRaw(opts: { environmentId: number; config_id: number; name: string; isAction: boolean }): Promise<SyncConfig | null>;
