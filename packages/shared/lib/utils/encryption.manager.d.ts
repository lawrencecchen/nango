/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import crypto from 'crypto';
import { Encryption } from '@nangohq/utils';
import type { EnvironmentVariable } from '@nangohq/types';

import type { Config as ProviderConfig } from '../models/Provider.js';
import type { DBConfig } from '../models/Generic.js';
import type { Environment } from '../models/Environment.js';
import type { Connection, ApiConnection, StoredConnection } from '../models/Connection.js';
export declare const pbkdf2: (arg1: crypto.BinaryLike, arg2: crypto.BinaryLike, arg3: number, arg4: number, arg5: string) => Promise<Buffer>;
export declare const ENCRYPTION_KEY: string;
export declare class EncryptionManager extends Encryption {
    private keySalt;
    shouldEncrypt(): boolean;
    encryptEnvironment(environment: Environment): Promise<Environment>;
    decryptEnvironment(environment: Environment | null): Environment | null;
    encryptApiConnection(connection: ApiConnection): StoredConnection;
    encryptConnection(connection: Connection): StoredConnection;
    decryptConnection(connection: StoredConnection | null): Connection | null;
    encryptEnvironmentVariables(environmentVariables: EnvironmentVariable[]): EnvironmentVariable[];
    decryptEnvironmentVariables(environmentVariables: EnvironmentVariable[] | null): EnvironmentVariable[] | null;
    encryptProviderConfig(config: ProviderConfig): ProviderConfig;
    decryptProviderConfig(config: ProviderConfig | null): ProviderConfig | null;
    private saveDbConfig;
    private hashEncryptionKey;
    /**
     * Determine the Database encryption status
     */
    encryptionStatus(dbConfig?: DBConfig): Promise<'disabled' | 'not_started' | 'require_rotation' | 'require_decryption' | 'done' | 'incomplete'>;
    encryptDatabaseIfNeeded(): Promise<void>;
    private encryptDatabase;
}
declare const _default: EncryptionManager;
export default _default;
