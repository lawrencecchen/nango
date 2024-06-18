import type { AppStoreCredentials, AuthCredentials, ApiKeyCredentials, BasicApiCredentials, AppCredentials, UnauthCredentials } from './Auth.js.js';
import type { Account } from './Admin.js.js';
import type { Environment } from './Environment.js.js';
import type { TimestampsAndDeleted } from './Generic.js.js';
import type { AuthModeType, Metadata, ActiveLogIds, AuthOperationType } from '@nangohq/types';

export type ConnectionConfig = Record<string, any>;

export interface BaseConnection extends TimestampsAndDeleted {
    id?: number;
    config_id?: number;
    provider_config_key: string; // TO deprecate
    connection_id: string;
    connection_config: ConnectionConfig;
    environment_id: number;
    metadata?: Metadata | null;
    credentials_iv?: string | null;
    credentials_tag?: string | null;
    last_fetched_at?: Date | null;
}

export interface StoredConnection extends BaseConnection {
    credentials: Record<string, any>;
}

export interface Connection extends BaseConnection {
    credentials: AuthCredentials | ApiKeyCredentials | BasicApiCredentials | AppCredentials | AppStoreCredentials | UnauthCredentials;
}

export interface RecentlyCreatedConnection {
    connection: StoredConnection;
    auth_mode: AuthModeType;
    error?: FailedConnectionError;
    operation: AuthOperationType;
    environment: Environment;
    account: Account;
}

export interface FailedConnectionError {
    type: string;
    description: string;
}

export interface RecentlyFailedConnection {
    connection: Pick<StoredConnection, 'connection_id' | 'provider_config_key'>;
    auth_mode: AuthModeType;
    error?: FailedConnectionError;
    operation: AuthOperationType;
    environment: Environment;
    account: Account;
}

export interface ApiConnection {
    id?: number;
    connection_id: string;
    provider_config_key: string;
    config_id?: number;
    environment_id: number;
    connection_config: ConnectionConfig;
    credentials_iv?: string | null;
    credentials_tag?: string | null;
    credentials: BasicApiCredentials | ApiKeyCredentials;
}

export interface NangoConnection {
    id?: number;
    connection_id: string;
    provider_config_key: string;
    environment_id: number;
    connection_config?: ConnectionConfig;

    // TODO legacy while the migration is in progress
    /**
     * @deprecated
     */
    account_id?: number;
}

export interface ConnectionList {
    id: number;
    connection_id: string;
    provider_config_key: string;
    provider: string;
    created: string;
    metadata?: Metadata | null;
    active_logs?: ActiveLogIds | null;
}
