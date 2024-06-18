var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import db, { schema, dbNamespace } from '@nangohq/database';
import { getLogger, stringifyError, Ok, Err, axiosInstance as axios } from '@nangohq/utils';
import analytics, { AnalyticsTypes } from '../utils/analytics.js';
import { createActivityLogMessageAndEnd, updateSuccess as updateSuccessActivityLog, createActivityLogAndLogMessage } from '../services/activity/activity.service.js';
import { LogActionEnum } from '../models/Activity.js';
import providerClient from '../clients/provider.client.js';
import configService from './config.service.js';
import syncManager from './sync/manager.service.js';
import environmentService from '../services/environment.service.js';
import { getFreshOAuth2Credentials } from '../clients/oauth2.client.js';
import { NangoError } from '../utils/error.js';
import encryptionManager from '../utils/encryption.manager.js';
import telemetry, { LogTypes } from '../utils/telemetry.js';
import { interpolateStringFromObject, parseTokenExpirationDate, isTokenExpired, getRedisUrl } from '../utils/utils.js';
import { Locking } from '../utils/lock/locking.js';
import { InMemoryKVStore } from '../utils/kvstore/InMemoryStore.js';
import { RedisKVStore } from '../utils/kvstore/RedisStore.js';
import { CONNECTIONS_WITH_SCRIPTS_CAP_LIMIT } from '../constants.js';
const logger = getLogger('Connection');
const ACTIVE_LOG_TABLE = dbNamespace + 'active_logs';
class ConnectionService {
    constructor(locking) {
        this.locking = locking;
    }
    upsertConnection(connectionId, providerConfigKey, provider, parsedRawCredentials, connectionConfig, environment_id, accountId, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const storedConnection = yield this.checkIfConnectionExists(connectionId, providerConfigKey, environment_id);
            const config_id = yield configService.getIdByProviderConfigKey(environment_id, providerConfigKey);
            if (storedConnection) {
                const encryptedConnection = encryptionManager.encryptConnection({
                    connection_id: connectionId,
                    provider_config_key: providerConfigKey,
                    credentials: parsedRawCredentials,
                    connection_config: connectionConfig,
                    environment_id: environment_id,
                    config_id: config_id,
                    metadata: metadata || storedConnection.metadata || null
                });
                encryptedConnection.updated_at = new Date();
                const connection = yield db.knex
                    .from(`_nango_connections`)
                    .where({ id: storedConnection.id, deleted: false })
                    .update(encryptedConnection)
                    .returning('*');
                void analytics.track(AnalyticsTypes.CONNECTION_UPDATED, accountId, { provider });
                return [{ connection: connection[0], operation: 'override' }];
            }
            const connection = yield db.knex
                .from(`_nango_connections`)
                .insert(encryptionManager.encryptConnection({
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                config_id: config_id,
                credentials: parsedRawCredentials,
                connection_config: connectionConfig,
                environment_id: environment_id,
                metadata: metadata || null
            }))
                .returning('*');
            void analytics.track(AnalyticsTypes.CONNECTION_INSERTED, accountId, { provider });
            return [{ connection: connection[0], operation: 'creation' }];
        });
    }
    upsertApiConnection(connectionId, providerConfigKey, provider, credentials, connectionConfig, environment_id, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const storedConnection = yield this.checkIfConnectionExists(connectionId, providerConfigKey, environment_id);
            const config_id = yield configService.getIdByProviderConfigKey(environment_id, providerConfigKey); // TODO remove that
            if (storedConnection) {
                const encryptedConnection = encryptionManager.encryptConnection({
                    connection_id: connectionId,
                    config_id: config_id,
                    provider_config_key: providerConfigKey,
                    credentials,
                    connection_config: connectionConfig,
                    environment_id
                });
                encryptedConnection.updated_at = new Date();
                const connection = yield db.knex
                    .from(`_nango_connections`)
                    .where({ id: storedConnection.id, deleted: false })
                    .update(encryptedConnection)
                    .returning('*');
                void analytics.track(AnalyticsTypes.API_CONNECTION_UPDATED, accountId, { provider });
                return [{ connection: connection[0], operation: 'override' }];
            }
            const connection = yield db.knex
                .from(`_nango_connections`)
                .insert(encryptionManager.encryptApiConnection({
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                config_id: config_id,
                credentials,
                connection_config: connectionConfig,
                environment_id
            }))
                .returning('*');
            void analytics.track(AnalyticsTypes.API_CONNECTION_INSERTED, accountId, { provider });
            return [{ connection: connection[0], operation: 'creation' }];
        });
    }
    upsertUnauthConnection(connectionId, providerConfigKey, provider, environment_id, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const storedConnection = yield this.checkIfConnectionExists(connectionId, providerConfigKey, environment_id);
            const config_id = yield configService.getIdByProviderConfigKey(environment_id, providerConfigKey); // TODO remove that
            if (storedConnection) {
                const connection = yield db.knex
                    .from(`_nango_connections`)
                    .where({ id: storedConnection.id, deleted: false })
                    .update({
                    connection_id: connectionId,
                    provider_config_key: providerConfigKey,
                    config_id: config_id,
                    updated_at: new Date()
                })
                    .returning('*');
                void analytics.track(AnalyticsTypes.UNAUTH_CONNECTION_UPDATED, accountId, { provider });
                return [{ connection: connection[0], operation: 'override' }];
            }
            const connection = yield db.knex
                .from(`_nango_connections`)
                .insert({
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                credentials: {},
                connection_config: {},
                environment_id,
                config_id: config_id
            })
                .returning('*');
            void analytics.track(AnalyticsTypes.UNAUTH_CONNECTION_INSERTED, accountId, { provider });
            return [{ connection: connection[0], operation: 'creation' }];
        });
    }
    importOAuthConnection(connection_id, provider_config_key, provider, environmentId, accountId, parsedRawCredentials, connectionCreatedHook) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connection_config, metadata } = parsedRawCredentials;
            const [importedConnection] = yield this.upsertConnection(connection_id, provider_config_key, provider, parsedRawCredentials, connection_config || {}, environmentId, accountId, metadata || undefined);
            if (importedConnection) {
                void connectionCreatedHook(importedConnection);
            }
            return [importedConnection];
        });
    }
    importApiAuthConnection(connection_id, provider_config_key, provider, environmentId, accountId, credentials, connectionCreatedHook) {
        return __awaiter(this, void 0, void 0, function* () {
            const [importedConnection] = yield this.upsertApiConnection(connection_id, provider_config_key, provider, credentials, {}, environmentId, accountId);
            if (importedConnection) {
                void connectionCreatedHook(importedConnection);
            }
            return [importedConnection];
        });
    }
    getConnectionById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield schema()
                .select('id', 'connection_id', 'provider_config_key', 'environment_id', 'connection_config', 'metadata')
                .from('_nango_connections')
                .where({ id: id, deleted: false });
            if (!result || result.length == 0 || !result[0]) {
                return null;
            }
            return result[0];
        });
    }
    checkIfConnectionExists(connection_id, provider_config_key, environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield schema().select('id', 'metadata').from('_nango_connections').where({
                connection_id,
                provider_config_key,
                environment_id,
                deleted: false
            });
            if (!result || result.length == 0 || !result[0]) {
                return null;
            }
            return result[0];
        });
    }
    getConnection(connectionId, providerConfigKey, environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!environment_id) {
                const error = new NangoError('missing_environment');
                return { success: false, error, response: null };
            }
            if (!connectionId) {
                const error = new NangoError('missing_connection');
                yield telemetry.log(LogTypes.GET_CONNECTION_FAILURE, error.message, LogActionEnum.AUTH, {
                    environmentId: String(environment_id),
                    connectionId,
                    providerConfigKey,
                    level: 'error'
                });
                return { success: false, error, response: null };
            }
            if (!providerConfigKey) {
                const error = new NangoError('missing_provider_config');
                yield telemetry.log(LogTypes.GET_CONNECTION_FAILURE, error.message, LogActionEnum.AUTH, {
                    environmentId: String(environment_id),
                    connectionId,
                    providerConfigKey,
                    level: 'error'
                });
                return { success: false, error, response: null };
            }
            const result = (yield schema()
                .select('*')
                .from(`_nango_connections`)
                .where({ connection_id: connectionId, provider_config_key: providerConfigKey, environment_id, deleted: false }));
            const storedConnection = result == null || result.length == 0 ? null : result[0] || null;
            if (!storedConnection) {
                const environmentName = yield environmentService.getEnvironmentName(environment_id);
                const error = new NangoError('unknown_connection', { connectionId, providerConfigKey, environmentName });
                yield telemetry.log(LogTypes.GET_CONNECTION_FAILURE, error.message, LogActionEnum.AUTH, {
                    environmentId: String(environment_id),
                    connectionId,
                    providerConfigKey,
                    level: 'error'
                });
                return { success: false, error, response: null };
            }
            const connection = encryptionManager.decryptConnection(storedConnection);
            // Parse the token expiration date.
            if (connection != null) {
                const credentials = connection.credentials;
                if (credentials.type && credentials.type === 'OAUTH2') {
                    const creds = credentials;
                    creds.expires_at = creds.expires_at != null ? parseTokenExpirationDate(creds.expires_at) : undefined;
                    connection.credentials = creds;
                }
                if (credentials.type && credentials.type === 'APP') {
                    const creds = credentials;
                    creds.expires_at = creds.expires_at != null ? parseTokenExpirationDate(creds.expires_at) : undefined;
                    connection.credentials = creds;
                }
                if (credentials.type && credentials.type === 'OAUTH2_CC') {
                    const creds = credentials;
                    creds.expires_at = creds.expires_at != null ? parseTokenExpirationDate(creds.expires_at) : undefined;
                    connection.credentials = creds;
                }
            }
            return { success: true, error: null, response: connection };
        });
    }
    updateConnection(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex
                .from(`_nango_connections`)
                .where({
                connection_id: connection.connection_id,
                provider_config_key: connection.provider_config_key,
                environment_id: connection.environment_id,
                deleted: false
            })
                .update(encryptionManager.encryptConnection(connection));
        });
    }
    getMetadata(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.from(`_nango_connections`).select('metadata').where({
                connection_id: connection.connection_id,
                provider_config_key: connection.provider_config_key,
                environment_id: connection.environment_id,
                deleted: false
            });
            if (!result || result.length == 0 || !result[0]) {
                return {};
            }
            return result[0].metadata;
        });
    }
    getConnectionConfig(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.from(`_nango_connections`).select('connection_config').where({
                connection_id: connection.connection_id,
                provider_config_key: connection.provider_config_key,
                environment_id: connection.environment_id,
                deleted: false
            });
            if (!result || result.length == 0 || !result[0]) {
                return {};
            }
            return result[0].connection_config;
        });
    }
    getConnectionsByEnvironmentAndConfig(environment_id, providerConfigKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .from(`_nango_connections`)
                .select('id', 'connection_id', 'provider_config_key', 'environment_id', 'connection_config')
                .where({ environment_id, provider_config_key: providerConfigKey, deleted: false });
            if (!result || result.length == 0 || !result[0]) {
                return [];
            }
            return result;
        });
    }
    getOldConnections({ days, limit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const result = yield db
                .knex(`_nango_connections`)
                .join('_nango_configs', '_nango_connections.config_id', '_nango_configs.id')
                .join('_nango_environments', '_nango_connections.environment_id', '_nango_environments.id')
                .join('_nango_accounts', '_nango_environments.account_id', '_nango_accounts.id')
                .select('connection_id', 'unique_key as provider_config_key', db.knex.raw('row_to_json(_nango_environments.*) as environment'), db.knex.raw('row_to_json(_nango_accounts.*) as account'))
                .where('_nango_connections.deleted', false)
                .andWhere((builder) => builder.where('last_fetched_at', '<', dateThreshold).orWhereNull('last_fetched_at'))
                .limit(limit);
            return result || [];
        });
    }
    replaceMetadata(ids, metadata, trx) {
        return __awaiter(this, void 0, void 0, function* () {
            yield trx.from(`_nango_connections`).whereIn('id', ids).andWhere({ deleted: false }).update({ metadata });
        });
    }
    replaceConnectionConfig(connection, config) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex
                .from(`_nango_connections`)
                .where({ id: connection.id, deleted: false })
                .update({ connection_config: config });
        });
    }
    updateMetadata(connections, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                for (const connection of connections) {
                    const newMetadata = Object.assign(Object.assign({}, connection.metadata), metadata);
                    yield this.replaceMetadata([connection.id], newMetadata, trx);
                }
            }));
        });
    }
    updateConnectionConfig(connection, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingConfig = yield this.getConnectionConfig(connection);
            const newConfig = Object.assign(Object.assign({}, existingConfig), config);
            yield this.replaceConnectionConfig(connection, newConfig);
            return newConfig;
        });
    }
    findConnectionsByConnectionConfigValue(key, value, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .from(`_nango_connections`)
                .select('*')
                .where({ environment_id: environmentId })
                .whereRaw(`connection_config->>:key = :value AND deleted = false`, { key, value });
            if (!result || result.length == 0) {
                return null;
            }
            return result.map((connection) => encryptionManager.decryptConnection(connection));
        });
    }
    findConnectionsByMultipleConnectionConfigValues(keyValuePairs, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = db.knex.from(`_nango_connections`).select('*').where({ environment_id: environmentId });
            Object.entries(keyValuePairs).forEach(([key, value]) => {
                query = query.andWhereRaw(`connection_config->>:key = :value AND deleted = false`, { key, value });
            });
            const result = yield query;
            if (!result || result.length == 0) {
                return null;
            }
            return result.map((connection) => encryptionManager.decryptConnection(connection));
        });
    }
    listConnections(environment_id, connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryBuilder = db.knex
                .from(`_nango_connections`)
                .select({ id: '_nango_connections.id' }, { connection_id: '_nango_connections.connection_id' }, { provider: '_nango_connections.provider_config_key' }, { created: '_nango_connections.created_at' }, '_nango_connections.metadata', db.knex.raw(`
                  (SELECT json_build_object(
                      'activity_log_id', activity_log_id,
                      'log_id', log_id
                    )
                    FROM ${ACTIVE_LOG_TABLE}
                    WHERE _nango_connections.id = ${ACTIVE_LOG_TABLE}.connection_id
                      AND ${ACTIVE_LOG_TABLE}.active = true
                    LIMIT 1
                  ) as active_logs
                `))
                .where({
                environment_id: environment_id,
                deleted: false
            })
                .groupBy('_nango_connections.id', '_nango_connections.connection_id', '_nango_connections.provider_config_key', '_nango_connections.created_at', '_nango_connections.metadata');
            if (connectionId) {
                queryBuilder.where({
                    connection_id: connectionId
                });
            }
            return queryBuilder;
        });
    }
    getAllNames(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connections = yield this.listConnections(environment_id);
            return [...new Set(connections.map((config) => config.connection_id))];
        });
    }
    deleteConnection(connection, providerConfigKey, environment_id, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            const del = yield db.knex
                .from(`_nango_connections`)
                .where({
                connection_id: connection.connection_id,
                provider_config_key: providerConfigKey,
                environment_id,
                deleted: false
            })
                .update({ deleted: true, credentials: {}, credentials_iv: null, credentials_tag: null, deleted_at: new Date() });
            yield syncManager.softDeleteSyncsByConnection(connection, orchestrator);
            return del;
        });
    }
    getConnectionCredentials({ account, environment, connectionId, providerConfigKey, logContextGetter, instantRefresh, onRefreshSuccess, onRefreshFailed }) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (connectionId === null) {
                const error = new NangoError('missing_connection');
                return Err(error);
            }
            if (providerConfigKey === null) {
                const error = new NangoError('missing_provider_config');
                return Err(error);
            }
            const { success, error, response: connection } = yield this.getConnection(connectionId, providerConfigKey, environment.id);
            if (!success && error) {
                return Err(error);
            }
            if (connection === null || !connection.id) {
                const error = new NangoError('unknown_connection', { connectionId, providerConfigKey, environmentName: environment.name });
                return Err(error);
            }
            const config = yield configService.getProviderConfig(connection === null || connection === void 0 ? void 0 : connection.provider_config_key, environment.id);
            if (config === null || !config.id) {
                const error = new NangoError('unknown_provider_config');
                return Err(error);
            }
            const template = configService.getTemplate(config === null || config === void 0 ? void 0 : config.provider);
            if (((_a = connection === null || connection === void 0 ? void 0 : connection.credentials) === null || _a === void 0 ? void 0 : _a.type) === 'OAUTH2' || ((_b = connection === null || connection === void 0 ? void 0 : connection.credentials) === null || _b === void 0 ? void 0 : _b.type) === 'APP' || ((_c = connection === null || connection === void 0 ? void 0 : connection.credentials) === null || _c === void 0 ? void 0 : _c.type) === 'OAUTH2_CC') {
                const { success, error, response } = yield this.refreshCredentialsIfNeeded({
                    connection,
                    providerConfig: config,
                    template: template,
                    environment_id: environment.id,
                    instantRefresh
                });
                if ((!success && error) || !response) {
                    const log = {
                        level: 'error',
                        success: false,
                        action: LogActionEnum.AUTH,
                        start: Date.now(),
                        end: Date.now(),
                        timestamp: Date.now(),
                        connection_id: connectionId,
                        provider_config_key: providerConfigKey,
                        provider: config.provider,
                        session_id: '',
                        environment_id: environment.id,
                        operation_name: 'Auth'
                    };
                    const logMessage = {
                        environment_id: environment.id,
                        level: 'error',
                        content: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to refresh credentials',
                        timestamp: Date.now()
                    };
                    const activityLogId = yield createActivityLogAndLogMessage(log, logMessage);
                    const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'auth', action: 'refresh_token' }, message: 'Token refresh error' }, {
                        account,
                        environment,
                        integration: config ? { id: config.id, name: config.unique_key, provider: config.provider } : undefined,
                        connection: { id: connection.id, name: connection.connection_id }
                    });
                    yield logCtx.error('Failed to refresh credentials', error);
                    yield logCtx.failed();
                    if (activityLogId) {
                        yield onRefreshFailed({
                            connection,
                            activityLogId,
                            logCtx,
                            authError: {
                                type: error.type,
                                description: error.message
                            },
                            environment,
                            template,
                            config
                        });
                    }
                    // TODO: this leak credentials to the logs
                    const errorWithPayload = new NangoError(error.type, connection);
                    return Err(errorWithPayload);
                }
                else if (response.refreshed) {
                    yield onRefreshSuccess({
                        connection,
                        environment,
                        config
                    });
                }
                connection.credentials = response.credentials;
            }
            yield this.updateLastFetched(connection.id);
            return Ok(connection);
        });
    }
    updateLastFetched(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex.from(`_nango_connections`).where({ id, deleted: false }).update({ last_fetched_at: new Date() });
        });
    }
    // Parses and arbitrary object (e.g. a server response or a user provided auth object) into AuthCredentials.
    // Throws if values are missing/missing the input is malformed.
    parseRawCredentials(rawCredentials, authMode) {
        const rawCreds = rawCredentials;
        switch (authMode) {
            case 'OAUTH2': {
                if (!rawCreds['access_token']) {
                    throw new NangoError(`incomplete_raw_credentials`);
                }
                let expiresAt;
                if (rawCreds['expires_at']) {
                    expiresAt = parseTokenExpirationDate(rawCreds['expires_at']);
                }
                else if (rawCreds['expires_in']) {
                    expiresAt = new Date(Date.now() + Number.parseInt(rawCreds['expires_in'], 10) * 1000);
                }
                const oauth2Creds = {
                    type: 'OAUTH2',
                    access_token: rawCreds['access_token'],
                    refresh_token: rawCreds['refresh_token'],
                    expires_at: expiresAt,
                    raw: rawCreds
                };
                return oauth2Creds;
            }
            case 'OAUTH1': {
                if (!rawCreds['oauth_token'] || !rawCreds['oauth_token_secret']) {
                    throw new NangoError(`incomplete_raw_credentials`);
                }
                const oauth1Creds = {
                    type: 'OAUTH1',
                    oauth_token: rawCreds['oauth_token'],
                    oauth_token_secret: rawCreds['oauth_token_secret'],
                    raw: rawCreds
                };
                return oauth1Creds;
            }
            case 'OAUTH2_CC': {
                if (!rawCreds['token']) {
                    throw new NangoError(`incomplete_raw_credentials`);
                }
                let expiresAt;
                if (rawCreds['expires_at']) {
                    expiresAt = parseTokenExpirationDate(rawCreds['expires_at']);
                }
                else if (rawCreds['expires_in']) {
                    expiresAt = new Date(Date.now() + Number.parseInt(rawCreds['expires_in'], 10) * 1000);
                }
                const oauth2Creds = {
                    type: 'OAUTH2_CC',
                    token: rawCreds['token'],
                    client_id: '',
                    client_secret: '',
                    expires_at: expiresAt,
                    raw: rawCreds
                };
                return oauth2Creds;
            }
            default:
                throw new NangoError(`Cannot parse credentials, unknown credentials type: ${JSON.stringify(rawCreds, undefined, 2)}`);
        }
    }
    refreshCredentialsIfNeeded({ connection, providerConfig, template, environment_id, instantRefresh = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionId = connection.connection_id;
            const credentials = connection.credentials;
            const providerConfigKey = connection.provider_config_key;
            const shouldRefresh = yield this.shouldRefreshCredentials(connection, credentials, providerConfig, template, instantRefresh);
            if (shouldRefresh) {
                yield telemetry.log(LogTypes.AUTH_TOKEN_REFRESH_START, 'Token refresh is being started', LogActionEnum.AUTH, {
                    environmentId: String(environment_id),
                    connectionId,
                    providerConfigKey,
                    provider: providerConfig.provider
                });
                // We must ensure that only one refresh is running at a time accross all instances.
                // Using a simple redis entry as a lock with a TTL to ensure it is always released.
                // NOTES:
                // - This is not a distributed lock and will not work in a multi-redis environment.
                // - It could also be unsafe in case of a Redis crash.
                // We are using this for now as it is a simple solution that should work for most cases.
                const lockKey = `lock:refresh:${environment_id}:${providerConfigKey}:${connectionId}`;
                try {
                    const ttlInMs = 10000;
                    const acquitistionTimeoutMs = ttlInMs * 1.2; // giving some extra time for the lock to be released
                    yield this.locking.tryAcquire(lockKey, ttlInMs, acquitistionTimeoutMs);
                    const { success, error, response: newCredentials } = yield this.getNewCredentials(connection, providerConfig, template);
                    if (!success || !newCredentials) {
                        yield telemetry.log(LogTypes.AUTH_TOKEN_REFRESH_FAILURE, `Token refresh failed, ${error === null || error === void 0 ? void 0 : error.message}`, LogActionEnum.AUTH, {
                            environmentId: String(environment_id),
                            connectionId,
                            providerConfigKey,
                            provider: providerConfig.provider,
                            level: 'error'
                        });
                        return { success, error, response: null };
                    }
                    connection.credentials = newCredentials;
                    yield this.updateConnection(connection);
                    yield telemetry.log(LogTypes.AUTH_TOKEN_REFRESH_SUCCESS, 'Token refresh was successful', LogActionEnum.AUTH, {
                        environmentId: String(environment_id),
                        connectionId,
                        providerConfigKey,
                        provider: providerConfig.provider
                    });
                    return { success: true, error: null, response: { refreshed: shouldRefresh, credentials: newCredentials } };
                }
                catch (e) {
                    const errorMessage = e.message || 'Unknown error';
                    const errorDetails = {
                        message: errorMessage,
                        name: e.name || 'Error',
                        stack: e.stack || 'No stack trace'
                    };
                    const errorString = JSON.stringify(errorDetails);
                    yield telemetry.log(LogTypes.AUTH_TOKEN_REFRESH_FAILURE, `Token refresh failed, ${errorString}`, LogActionEnum.AUTH, {
                        environmentId: String(environment_id),
                        connectionId,
                        providerConfigKey,
                        provider: providerConfig.provider,
                        level: 'error'
                    });
                    const error = new NangoError('refresh_token_external_error', errorDetails);
                    return { success: false, error, response: null };
                }
                finally {
                    this.locking.release(lockKey);
                }
            }
            return { success: true, error: null, response: { refreshed: shouldRefresh, credentials } };
        });
    }
    getAppStoreCredentials(template, connectionConfig, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateTokenUrl = typeof template.token_url === 'string' ? template.token_url : template.token_url['APP_STORE'];
            const tokenUrl = interpolateStringFromObject(templateTokenUrl, { connectionConfig });
            const now = Math.floor(Date.now() / 1000);
            const expiration = now + 15 * 60;
            const payload = {
                iat: now,
                exp: expiration,
                iss: connectionConfig['issuerId']
            };
            if (template.authorization_params && template.authorization_params['audience']) {
                payload['aud'] = template.authorization_params['audience'];
            }
            if (connectionConfig['scope']) {
                payload['scope'] = connectionConfig['scope'];
            }
            const { success, error, response: rawCredentials } = yield this.getJWTCredentials(privateKey, tokenUrl, payload, null, {
                header: {
                    alg: 'ES256',
                    kid: connectionConfig['privateKeyId'],
                    typ: 'JWT'
                }
            });
            if (!success || !rawCredentials) {
                return { success, error, response: null };
            }
            const credentials = {
                type: 'APP_STORE',
                access_token: rawCredentials === null || rawCredentials === void 0 ? void 0 : rawCredentials.token,
                private_key: Buffer.from(privateKey).toString('base64'),
                expires_at: rawCredentials === null || rawCredentials === void 0 ? void 0 : rawCredentials.expires_at,
                raw: rawCredentials
            };
            return { success: true, error: null, response: credentials };
        });
    }
    getAppCredentialsAndFinishConnection(connectionId, integration, template, connectionConfig, activityLogId, logCtx, connectionCreatedHook) {
        return __awaiter(this, void 0, void 0, function* () {
            const { success, error, response: credentials } = yield this.getAppCredentials(template, integration, connectionConfig);
            if (!success || !credentials) {
                logger.error(error);
                return;
            }
            const accountId = yield environmentService.getAccountIdFromEnvironment(integration.environment_id);
            const [updatedConnection] = yield this.upsertConnection(connectionId, integration.unique_key, integration.provider, credentials, connectionConfig, integration.environment_id, accountId);
            if (updatedConnection) {
                void connectionCreatedHook(updatedConnection);
            }
            yield createActivityLogMessageAndEnd({
                level: 'info',
                environment_id: integration.environment_id,
                activity_log_id: Number(activityLogId),
                content: 'App connection was approved and credentials were saved',
                timestamp: Date.now()
            });
            yield logCtx.info('App connection was approved and credentials were saved');
            yield updateSuccessActivityLog(Number(activityLogId), true);
        });
    }
    getAppCredentials(template, config, connectionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateTokenUrl = typeof template.token_url === 'string' ? template.token_url : template.token_url['APP'];
            const tokenUrl = interpolateStringFromObject(templateTokenUrl, { connectionConfig });
            const privateKeyBase64 = (config === null || config === void 0 ? void 0 : config.custom) ? config.custom['private_key'] : config.oauth_client_secret;
            const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
            const headers = {
                Accept: 'application/vnd.github.v3+json'
            };
            const now = Math.floor(Date.now() / 1000);
            const expiration = now + 10 * 60;
            const payload = {
                iat: now,
                exp: expiration,
                iss: ((config === null || config === void 0 ? void 0 : config.custom) ? config.custom['app_id'] : config.oauth_client_id)
            };
            const { success, error, response: rawCredentials } = yield this.getJWTCredentials(privateKey, tokenUrl, payload, headers, { algorithm: 'RS256' });
            if (!success || !rawCredentials) {
                return { success, error, response: null };
            }
            const credentials = {
                type: 'APP',
                access_token: rawCredentials === null || rawCredentials === void 0 ? void 0 : rawCredentials.token,
                expires_at: rawCredentials === null || rawCredentials === void 0 ? void 0 : rawCredentials.expires_at,
                raw: rawCredentials
            };
            return { success: true, error: null, response: credentials };
        });
    }
    getOauthClientCredentials(template, client_id, client_secret) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = template.authorization_url;
            let authorizationParams = '';
            if (template.authorization_params && Object.keys(template.authorization_params).length > 0) {
                authorizationParams = new URLSearchParams(template.authorization_params).toString();
            }
            try {
                const params = new URLSearchParams();
                params.append('client_id', client_id);
                params.append('client_secret', client_secret);
                if (authorizationParams) {
                    const authorizationParamsEntries = new URLSearchParams(authorizationParams).entries();
                    for (const [key, value] of authorizationParamsEntries) {
                        params.append(key, value);
                    }
                }
                const fullUrl = `${url}?${params}`;
                const response = yield axios.post(fullUrl);
                const { data } = response;
                if (!data || !data.success) {
                    return { success: false, error: new NangoError('invalid_client_credentials'), response: null };
                }
                const parsedCreds = this.parseRawCredentials(data.data, 'OAUTH2_CC');
                parsedCreds.client_id = client_id;
                parsedCreds.client_secret = client_secret;
                return { success: true, error: null, response: parsedCreds };
            }
            catch (e) {
                const errorPayload = {
                    message: e.message || 'Unknown error',
                    name: e.name || 'Error'
                };
                logger.error(`Error fetching client credentials ${stringifyError(e)}`);
                const error = new NangoError('client_credentials_fetch_error', errorPayload);
                return { success: false, error, response: null };
            }
        });
    }
    shouldCapUsage({ providerConfigKey, environmentId, type }) {
        return __awaiter(this, void 0, void 0, function* () {
            const connections = yield this.getConnectionsByEnvironmentAndConfig(environmentId, providerConfigKey);
            if (!connections) {
                return false;
            }
            if (connections.length > CONNECTIONS_WITH_SCRIPTS_CAP_LIMIT) {
                logger.info(`Reached cap for providerConfigKey: ${providerConfigKey} and environmentId: ${environmentId}`);
                if (type === 'deploy') {
                    void analytics.trackByEnvironmentId(AnalyticsTypes.RESOURCE_CAPPED_SCRIPT_DEPLOY_IS_DISABLED, environmentId);
                }
                else {
                    void analytics.trackByEnvironmentId(AnalyticsTypes.RESOURCE_CAPPED_SCRIPT_ACTIVATE, environmentId);
                }
                return true;
            }
            return false;
        });
    }
    getJWTCredentials(privateKey, url, payload, additionalApiHeaders, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasLineBreak = /^-----BEGIN RSA PRIVATE KEY-----\n/.test(privateKey);
            if (!hasLineBreak) {
                privateKey = privateKey.replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN RSA PRIVATE KEY-----\n');
                privateKey = privateKey.replace('-----END RSA PRIVATE KEY-----', '\n-----END RSA PRIVATE KEY-----');
            }
            try {
                const token = jwt.sign(payload, privateKey, options);
                const headers = {
                    Authorization: `Bearer ${token}`
                };
                if (additionalApiHeaders) {
                    Object.assign(headers, additionalApiHeaders);
                }
                const tokenResponse = yield axios.post(url, {}, {
                    headers
                });
                return { success: true, error: null, response: tokenResponse.data };
            }
            catch (e) {
                const errorPayload = {
                    message: e.message || 'Unknown error',
                    name: e.name || 'Error'
                };
                const error = new NangoError('refresh_token_external_error', errorPayload);
                return { success: false, error, response: null };
            }
        });
    }
    shouldRefreshCredentials(connection, credentials, providerConfig, template, instantRefresh) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshCondition = instantRefresh ||
                (providerClient.shouldIntrospectToken(providerConfig.provider) && (yield providerClient.introspectedTokenExpired(providerConfig, connection)));
            let tokenExpirationCondition = refreshCondition || (credentials.expires_at && isTokenExpired(credentials.expires_at, template.token_expiration_buffer || 15 * 60));
            if ((template.auth_mode === 'OAUTH2' || (credentials === null || credentials === void 0 ? void 0 : credentials.type) === 'OAUTH2') && providerConfig.provider !== 'facebook') {
                tokenExpirationCondition = Boolean(credentials.refresh_token && tokenExpirationCondition);
            }
            return Boolean(tokenExpirationCondition);
        });
    }
    getNewCredentials(connection, providerConfig, template) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (providerClient.shouldUseProviderClient(providerConfig.provider)) {
                const rawCreds = yield providerClient.refreshToken(template, providerConfig, connection);
                const parsedCreds = this.parseRawCredentials(rawCreds, 'OAUTH2');
                return { success: true, error: null, response: parsedCreds };
            }
            else if (template.auth_mode === 'OAUTH2_CC') {
                const { client_id, client_secret } = connection.credentials;
                const { success, error, response: credentials } = yield this.getOauthClientCredentials(template, client_id, client_secret);
                if (!success || !credentials) {
                    return { success, error, response: null };
                }
                return { success: true, error: null, response: credentials };
            }
            else if (template.auth_mode === 'APP_STORE') {
                const { private_key } = connection.credentials;
                const { success, error, response: credentials } = yield this.getAppStoreCredentials(template, connection.connection_config, private_key);
                if (!success || !credentials) {
                    return { success, error, response: null };
                }
                return { success: true, error: null, response: credentials };
            }
            else if (template.auth_mode === 'APP' || (template.auth_mode === 'CUSTOM' && ((_a = connection === null || connection === void 0 ? void 0 : connection.credentials) === null || _a === void 0 ? void 0 : _a.type) !== 'OAUTH2')) {
                const { success, error, response: credentials } = yield this.getAppCredentials(template, providerConfig, connection.connection_config);
                if (!success || !credentials) {
                    return { success, error, response: null };
                }
                return { success: true, error: null, response: credentials };
            }
            else {
                const { success, error, response: creds } = yield getFreshOAuth2Credentials(connection, providerConfig, template);
                return { success, error, response: success ? creds : null };
            }
        });
    }
}
const locking = await (() => __awaiter(void 0, void 0, void 0, function* () {
    let store;
    const url = getRedisUrl();
    if (url) {
        store = new RedisKVStore(url);
        yield store.connect();
    }
    else {
        store = new InMemoryKVStore();
    }
    return new Locking(store);
}))();
export default new ConnectionService(locking);
//# sourceMappingURL=connection.service.js.map