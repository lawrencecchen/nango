import type { Knex } from '@nangohq/database';
import type { Metadata, ActiveLogIds, Template as ProviderTemplate, AuthModeType } from '@nangohq/types';
import type { Result } from '@nangohq/utils';
import type { LogContext, LogContextGetter } from '@nangohq/logs';

import type { Config as ProviderConfig, AuthCredentials, Account, Environment } from '../models/index.js';
import { NangoError } from '../utils/error.js';
import type { ConnectionConfig, Connection, NangoConnection } from '../models/Connection.js';
import type { ServiceResponse } from '../models/Generic.js';
import type {
    AppCredentials,
    AppStoreCredentials,
    OAuth2ClientCredentials,
    ImportedCredentials,
    ApiKeyCredentials,
    BasicApiCredentials,
    ConnectionUpsertResponse
} from '../models/Auth.js';
import { Locking } from '../utils/lock/locking.js';
import type { Orchestrator } from '../clients/orchestrator.js';
declare type KeyValuePairs = Record<string, string | boolean>;
declare class ConnectionService {
    private locking;
    constructor(locking: Locking);
    upsertConnection(
        connectionId: string,
        providerConfigKey: string,
        provider: string,
        parsedRawCredentials: AuthCredentials,
        connectionConfig: ConnectionConfig,
        environment_id: number,
        accountId: number,
        metadata?: Metadata
    ): Promise<ConnectionUpsertResponse[]>;
    upsertApiConnection(
        connectionId: string,
        providerConfigKey: string,
        provider: string,
        credentials: ApiKeyCredentials | BasicApiCredentials,
        connectionConfig: Record<string, string>,
        environment_id: number,
        accountId: number
    ): Promise<ConnectionUpsertResponse[]>;
    upsertUnauthConnection(
        connectionId: string,
        providerConfigKey: string,
        provider: string,
        environment_id: number,
        accountId: number
    ): Promise<ConnectionUpsertResponse[]>;
    importOAuthConnection(
        connection_id: string,
        provider_config_key: string,
        provider: string,
        environmentId: number,
        accountId: number,
        parsedRawCredentials: ImportedCredentials,
        connectionCreatedHook: (res: ConnectionUpsertResponse) => Promise<void>
    ): Promise<ConnectionUpsertResponse[]>;
    importApiAuthConnection(
        connection_id: string,
        provider_config_key: string,
        provider: string,
        environmentId: number,
        accountId: number,
        credentials: BasicApiCredentials | ApiKeyCredentials,
        connectionCreatedHook: (res: ConnectionUpsertResponse) => Promise<void>
    ): Promise<ConnectionUpsertResponse[]>;
    getConnectionById(
        id: number
    ): Promise<Pick<Connection, 'id' | 'connection_id' | 'provider_config_key' | 'environment_id' | 'connection_config' | 'metadata'> | null>;
    checkIfConnectionExists(
        connection_id: string,
        provider_config_key: string,
        environment_id: number
    ): Promise<null | {
        id: number;
        metadata: Metadata;
    }>;
    getConnection(connectionId: string, providerConfigKey: string, environment_id: number): Promise<ServiceResponse<Connection>>;
    updateConnection(connection: Connection): Promise<void>;
    getMetadata(connection: Connection): Promise<Record<string, string>>;
    getConnectionConfig(connection: Pick<Connection, 'connection_id' | 'provider_config_key' | 'environment_id'>): Promise<ConnectionConfig>;
    getConnectionsByEnvironmentAndConfig(environment_id: number, providerConfigKey: string): Promise<NangoConnection[]>;
    getOldConnections({ days, limit }: { days: number; limit: number }): Promise<
        {
            connection_id: string;
            provider_config_key: string;
            account: Account;
            environment: Environment;
        }[]
    >;
    replaceMetadata(ids: number[], metadata: Metadata, trx: Knex.Transaction): Promise<void>;
    replaceConnectionConfig(connection: Connection, config: ConnectionConfig): Promise<void>;
    updateMetadata(connections: Connection[], metadata: Metadata): Promise<void>;
    updateConnectionConfig(connection: Connection, config: ConnectionConfig): Promise<ConnectionConfig>;
    findConnectionsByConnectionConfigValue(key: string, value: string, environmentId: number): Promise<Connection[] | null>;
    findConnectionsByMultipleConnectionConfigValues(keyValuePairs: KeyValuePairs, environmentId: number): Promise<Connection[] | null>;
    listConnections(
        environment_id: number,
        connectionId?: string
    ): Promise<
        {
            id: number;
            connection_id: string;
            provider: string;
            created: string;
            metadata: Metadata;
            active_logs: ActiveLogIds;
        }[]
    >;
    getAllNames(environment_id: number): Promise<string[]>;
    deleteConnection(connection: Connection, providerConfigKey: string, environment_id: number, orchestrator: Orchestrator): Promise<number>;
    getConnectionCredentials({
        account,
        environment,
        connectionId,
        providerConfigKey,
        logContextGetter,
        instantRefresh,
        onRefreshSuccess,
        onRefreshFailed
    }: {
        account: Account;
        environment: Environment;
        connectionId: string;
        providerConfigKey: string;
        logContextGetter: LogContextGetter;
        instantRefresh: boolean;
        onRefreshSuccess: (args: { connection: Connection; environment: Environment; config: ProviderConfig }) => Promise<void>;
        onRefreshFailed: (args: {
            connection: Connection;
            activityLogId: number;
            logCtx: LogContext;
            authError: {
                type: string;
                description: string;
            };
            environment: Environment;
            template: ProviderTemplate;
            config: ProviderConfig;
        }) => Promise<void>;
    }): Promise<Result<Connection, NangoError>>;
    updateLastFetched(id: number): Promise<void>;
    parseRawCredentials(rawCredentials: object, authMode: AuthModeType): AuthCredentials;
    private refreshCredentialsIfNeeded;
    getAppStoreCredentials(
        template: ProviderTemplate,
        connectionConfig: Connection['connection_config'],
        privateKey: string
    ): Promise<ServiceResponse<AppStoreCredentials>>;
    getAppCredentialsAndFinishConnection(
        connectionId: string,
        integration: ProviderConfig,
        template: ProviderTemplate,
        connectionConfig: ConnectionConfig,
        activityLogId: number,
        logCtx: LogContext,
        connectionCreatedHook: (res: ConnectionUpsertResponse) => Promise<void>
    ): Promise<void>;
    getAppCredentials(
        template: ProviderTemplate,
        config: ProviderConfig,
        connectionConfig: Connection['connection_config']
    ): Promise<ServiceResponse<AppCredentials>>;
    getOauthClientCredentials(template: ProviderTemplate, client_id: string, client_secret: string): Promise<ServiceResponse<OAuth2ClientCredentials>>;
    shouldCapUsage({
        providerConfigKey,
        environmentId,
        type
    }: {
        providerConfigKey: string;
        environmentId: number;
        type: 'activate' | 'deploy';
    }): Promise<boolean>;
    private getJWTCredentials;
    private shouldRefreshCredentials;
    private getNewCredentials;
}
declare const _default: ConnectionService;
export default _default;
