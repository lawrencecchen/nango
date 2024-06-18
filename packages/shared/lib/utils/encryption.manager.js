var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import utils from 'node:util';
import crypto from 'crypto';
import { getLogger, Encryption } from '@nangohq/utils';
import db from '@nangohq/database';
import { hashSecretKey } from '../services/environment.service.js';
const logger = getLogger('Encryption.Manager');
export const pbkdf2 = utils.promisify(crypto.pbkdf2);
export const ENCRYPTION_KEY = process.env['NANGO_ENCRYPTION_KEY'] || '';
export class EncryptionManager extends Encryption {
    constructor() {
        super(...arguments);
        this.keySalt = 'X89FHEGqR3yNK0+v7rPWxQ==';
    }
    shouldEncrypt() {
        return Boolean((this === null || this === void 0 ? void 0 : this.key) && this.key.length > 0);
    }
    encryptEnvironment(environment) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.shouldEncrypt()) {
                return environment;
            }
            const encryptedEnvironment = Object.assign({}, environment);
            const [encryptedClientSecret, iv, authTag] = this.encrypt(environment.secret_key);
            encryptedEnvironment.secret_key_hashed = yield hashSecretKey(environment.secret_key);
            encryptedEnvironment.secret_key = encryptedClientSecret;
            encryptedEnvironment.secret_key_iv = iv;
            encryptedEnvironment.secret_key_tag = authTag;
            if (encryptedEnvironment.pending_secret_key) {
                const [encryptedPendingClientSecret, pendingIv, pendingAuthTag] = this.encrypt(encryptedEnvironment.pending_secret_key);
                encryptedEnvironment.pending_secret_key = encryptedPendingClientSecret;
                encryptedEnvironment.pending_secret_key_iv = pendingIv;
                encryptedEnvironment.pending_secret_key_tag = pendingAuthTag;
            }
            return encryptedEnvironment;
        });
    }
    decryptEnvironment(environment) {
        // Check if the individual row is encrypted.
        if (environment == null || environment.secret_key_iv == null || environment.secret_key_tag == null) {
            return environment;
        }
        const decryptedEnvironment = Object.assign({}, environment);
        decryptedEnvironment.secret_key = this.decrypt(environment.secret_key, environment.secret_key_iv, environment.secret_key_tag);
        if (decryptedEnvironment.pending_secret_key) {
            decryptedEnvironment.pending_secret_key = this.decrypt(environment.pending_secret_key, environment.pending_secret_key_iv, environment.pending_secret_key_tag);
        }
        return decryptedEnvironment;
    }
    encryptApiConnection(connection) {
        if (!this.shouldEncrypt()) {
            return connection;
        }
        const storedConnection = Object.assign({}, connection);
        const [encryptedClientSecret, iv, authTag] = this.encrypt(JSON.stringify(connection.credentials));
        const encryptedCreds = { encrypted_credentials: encryptedClientSecret };
        storedConnection.credentials = encryptedCreds;
        storedConnection.credentials_iv = iv;
        storedConnection.credentials_tag = authTag;
        return storedConnection;
    }
    encryptConnection(connection) {
        if (!this.shouldEncrypt()) {
            return connection;
        }
        const storedConnection = Object.assign({}, connection);
        const [encryptedClientSecret, iv, authTag] = this.encrypt(JSON.stringify(connection.credentials));
        const encryptedCreds = { encrypted_credentials: encryptedClientSecret };
        storedConnection.credentials = encryptedCreds;
        storedConnection.credentials_iv = iv;
        storedConnection.credentials_tag = authTag;
        return storedConnection;
    }
    decryptConnection(connection) {
        // Check if the individual row is encrypted.
        if (connection == null || connection.credentials_iv == null || connection.credentials_tag == null) {
            return connection;
        }
        const decryptedConnection = Object.assign({}, connection);
        decryptedConnection.credentials = JSON.parse(this.decrypt(connection.credentials['encrypted_credentials'], connection.credentials_iv, connection.credentials_tag));
        return decryptedConnection;
    }
    encryptEnvironmentVariables(environmentVariables) {
        if (!this.shouldEncrypt()) {
            return environmentVariables;
        }
        const encryptedEnvironmentVariables = Object.assign([], environmentVariables);
        for (const environmentVariable of encryptedEnvironmentVariables) {
            const [encryptedValue, iv, authTag] = this.encrypt(environmentVariable.value);
            environmentVariable.value = encryptedValue;
            environmentVariable.value_iv = iv;
            environmentVariable.value_tag = authTag;
        }
        return encryptedEnvironmentVariables;
    }
    decryptEnvironmentVariables(environmentVariables) {
        if (environmentVariables === null) {
            return environmentVariables;
        }
        const decryptedEnvironmentVariables = Object.assign([], environmentVariables);
        for (const environmentVariable of decryptedEnvironmentVariables) {
            if (environmentVariable.value_iv == null || environmentVariable.value_tag == null) {
                continue;
            }
            environmentVariable.value = this.decrypt(environmentVariable.value, environmentVariable.value_iv, environmentVariable.value_tag);
        }
        return decryptedEnvironmentVariables;
    }
    encryptProviderConfig(config) {
        if (!this.shouldEncrypt()) {
            return config;
        }
        const encryptedConfig = Object.assign({}, config);
        if (!config.oauth_client_secret) {
            return config;
        }
        const [encryptedClientSecret, iv, authTag] = this.encrypt(config.oauth_client_secret);
        encryptedConfig.oauth_client_secret = encryptedClientSecret;
        encryptedConfig.oauth_client_secret_iv = iv;
        encryptedConfig.oauth_client_secret_tag = authTag;
        if (config.custom) {
            const [encryptedValue, iv, authTag] = this.encrypt(JSON.stringify(config.custom));
            encryptedConfig.custom = { encryptedValue, iv: iv, authTag: authTag };
        }
        return encryptedConfig;
    }
    decryptProviderConfig(config) {
        // Check if the individual row is encrypted.
        if (config == null || config.oauth_client_secret_iv == null || config.oauth_client_secret_tag == null) {
            return config;
        }
        const decryptedConfig = Object.assign({}, config);
        decryptedConfig.oauth_client_secret = this.decrypt(config.oauth_client_secret, config.oauth_client_secret_iv, config.oauth_client_secret_tag);
        if (decryptedConfig.custom && config.custom) {
            decryptedConfig.custom = JSON.parse(this.decrypt(config.custom['encryptedValue'], config.custom['iv'], config.custom['authTag']));
        }
        return decryptedConfig;
    }
    saveDbConfig(dbConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex.from(`_nango_db_config`).del();
            yield db.knex.from(`_nango_db_config`).insert(dbConfig);
        });
    }
    hashEncryptionKey(key, salt) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyBuffer = yield pbkdf2(key, salt, 310000, 32, 'sha256');
            return keyBuffer.toString(this.encoding);
        });
    }
    /**
     * Determine the Database encryption status
     */
    encryptionStatus(dbConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!dbConfig) {
                if (!this.key) {
                    return 'disabled';
                }
                else {
                    return 'not_started';
                }
            }
            else if (!this.key) {
                return 'require_decryption';
            }
            const previousEncryptionKeyHash = dbConfig.encryption_key_hash;
            const encryptionKeyHash = yield this.hashEncryptionKey(this.key, this.keySalt);
            if (previousEncryptionKeyHash !== encryptionKeyHash) {
                return 'require_rotation';
            }
            return dbConfig.encryption_complete ? 'done' : 'incomplete';
        });
    }
    encryptDatabaseIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbConfig = yield db.knex.select('*').from('_nango_db_config').first();
            const status = yield this.encryptionStatus(dbConfig);
            const encryptionKeyHash = this.key ? yield this.hashEncryptionKey(this.key, this.keySalt) : null;
            if (status === 'disabled') {
                return;
            }
            if (status === 'done') {
                return;
            }
            if (status === 'require_rotation') {
                throw new Error('Rotation of NANGO_ENCRYPTION_KEY is not supported.');
            }
            if (status === 'require_decryption') {
                throw new Error('A previously set NANGO_ENCRYPTION_KEY has been removed from your environment variables.');
            }
            if (status === 'not_started') {
                logger.info('🔐 Encryption key has been set. Encrypting database...');
                yield this.saveDbConfig({ encryption_key_hash: encryptionKeyHash, encryption_complete: false });
            }
            if (status === 'incomplete') {
                logger.info('🔐 Previously started database encryption is incomplete. Continuing encryption of database...');
            }
            yield this.encryptDatabase();
            yield this.saveDbConfig({ encryption_key_hash: encryptionKeyHash, encryption_complete: true });
        });
    }
    encryptDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('🔐⚙️ Starting encryption of database...');
            const environments = yield db.knex.select('*').from(`_nango_environments`);
            for (let environment of environments) {
                if (environment.secret_key_iv && environment.secret_key_tag) {
                    continue;
                }
                environment = yield this.encryptEnvironment(environment);
                yield db.knex.from(`_nango_environments`).where({ id: environment.id }).update(environment);
            }
            const connections = yield db.knex.select('*').from(`_nango_connections`);
            for (const connection of connections) {
                if (connection.credentials_iv && connection.credentials_tag) {
                    continue;
                }
                const storedConnection = this.encryptConnection(connection);
                yield db.knex.from(`_nango_connections`).where({ id: storedConnection.id }).update(storedConnection);
            }
            const providerConfigs = yield db.knex.select('*').from(`_nango_configs`);
            for (let providerConfig of providerConfigs) {
                if (providerConfig.oauth_client_secret_iv && providerConfig.oauth_client_secret_tag) {
                    continue;
                }
                providerConfig = this.encryptProviderConfig(providerConfig);
                yield db.knex.from(`_nango_configs`).where({ id: providerConfig.id }).update(providerConfig);
            }
            const environmentVariables = yield db.knex.select('*').from(`_nango_environment_variables`);
            for (const environmentVariable of environmentVariables) {
                if (environmentVariable.value_iv && environmentVariable.value_tag) {
                    continue;
                }
                const [encryptedValue, iv, authTag] = this.encrypt(environmentVariable.value);
                environmentVariable.value = encryptedValue;
                environmentVariable.value_iv = iv;
                environmentVariable.value_tag = authTag;
                yield db.knex
                    .from(`_nango_environment_variables`)
                    .where({ id: environmentVariable.id })
                    .update(environmentVariable);
            }
            logger.info('🔐✅ Encryption of database complete!');
        });
    }
}
export default new EncryptionManager(ENCRYPTION_KEY);
//# sourceMappingURL=encryption.manager.js.map