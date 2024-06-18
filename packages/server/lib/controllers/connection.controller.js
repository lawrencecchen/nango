var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import { configService, connectionService, errorManager, analytics, AnalyticsTypes, NangoError, accountService, SlackService } from '@nangohq/shared';
import { metrics } from '@nangohq/utils';
import { logContextGetter } from '@nangohq/logs';
import { NANGO_ADMIN_UUID } from './account.controller.js';
import { connectionCreated as connectionCreatedHook, connectionCreationStartCapCheck as connectionCreationStartCapCheckHook, connectionRefreshSuccess as connectionRefreshSuccessHook, connectionRefreshFailed as connectionRefreshFailedHook } from '../hooks/hooks.js';
import { getOrchestrator, getOrchestratorClient } from '../utils/utils.js';
const orchestrator = getOrchestrator();
class ConnectionController {
    /**
     * CLI/SDK/API
     */
    getConnectionCreds(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment, account } = res.locals;
                const connectionId = req.params['connectionId'];
                const providerConfigKey = req.query['provider_config_key'];
                const returnRefreshToken = req.query['refresh_token'] === 'true';
                const instantRefresh = req.query['force_refresh'] === 'true';
                const isSync = req.get('Nango-Is-Sync') === 'true';
                if (!isSync) {
                    metrics.increment(metrics.Types.GET_CONNECTION, 1, { accountId: account.id });
                }
                const credentialResponse = yield connectionService.getConnectionCredentials({
                    account,
                    environment,
                    connectionId,
                    providerConfigKey,
                    logContextGetter,
                    instantRefresh,
                    onRefreshSuccess: connectionRefreshSuccessHook,
                    onRefreshFailed: connectionRefreshFailedHook
                });
                if (credentialResponse.isErr()) {
                    errorManager.errResFromNangoErr(res, credentialResponse.error);
                    return;
                }
                const { value: connection } = credentialResponse;
                if (connection && connection.credentials && connection.credentials.type === 'OAUTH2' && !returnRefreshToken) {
                    if (connection.credentials.refresh_token) {
                        delete connection.credentials.refresh_token;
                    }
                    if (connection.credentials.raw && connection.credentials.raw['refresh_token']) {
                        const rawCreds = Object.assign({}, connection.credentials.raw); // Properties from 'raw' are not mutable so we need to create a new object.
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete rawCreds['refresh_token'];
                        connection.credentials.raw = rawCreds;
                    }
                }
                res.status(200).send(connection);
            }
            catch (err) {
                next(err);
            }
        });
    }
    listConnections(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const accountId = res.locals['account'].id;
                const isWeb = res.locals['authType'] === 'session' || res.locals['authType'] === 'none';
                const { connectionId } = req.query;
                const connections = yield connectionService.listConnections(environmentId, connectionId);
                if (!isWeb) {
                    void analytics.track(AnalyticsTypes.CONNECTION_LIST_FETCHED, accountId);
                }
                const configs = yield configService.listProviderConfigs(environmentId);
                if (configs == null) {
                    res.status(200).send({ connections: [] });
                    return;
                }
                const uniqueKeyToProvider = {};
                const providerConfigKeys = configs.map((config) => config.unique_key);
                providerConfigKeys.forEach((key, i) => (uniqueKeyToProvider[key] = configs[i].provider));
                const result = connections.map((connection) => {
                    const list = {
                        id: connection.id,
                        connection_id: connection.connection_id,
                        provider_config_key: connection.provider,
                        provider: uniqueKeyToProvider[connection.provider],
                        created: connection.created,
                        metadata: connection.metadata
                    };
                    if (isWeb) {
                        list.active_logs = connection.active_logs;
                    }
                    return list;
                });
                res.status(200).send({
                    connections: result.sort(function (a, b) {
                        return new Date(b.created).getTime() - new Date(a.created).getTime();
                    })
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteConnection(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environment = res.locals['environment'];
                const connectionId = req.params['connectionId'];
                const providerConfigKey = req.query['provider_config_key'];
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environment.id);
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (connection == null) {
                    const error = new NangoError('unknown_connection', { connectionId, providerConfigKey, environmentName: environment.name });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                yield connectionService.deleteConnection(connection, providerConfigKey, environment.id, orchestrator);
                res.status(204).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteAdminConnection(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environment = res.locals['environment'];
                const connectionId = req.params['connectionId'];
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
                }
                const integration_key = process.env['NANGO_SLACK_INTEGRATION_KEY'] || 'slack';
                const nangoAdminUUID = NANGO_ADMIN_UUID;
                const env = 'prod';
                const info = yield accountService.getAccountAndEnvironmentIdByUUID(nangoAdminUUID, env);
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, integration_key, info === null || info === void 0 ? void 0 : info.environmentId);
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (connection == null) {
                    const error = new NangoError('unknown_connection', { connectionId, providerConfigKey: integration_key, environmentName: environment.name });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                yield connectionService.deleteConnection(connection, integration_key, info === null || info === void 0 ? void 0 : info.environmentId, orchestrator);
                const slackNotificationService = new SlackService({ orchestratorClient: getOrchestratorClient(), logContextGetter });
                yield slackNotificationService.closeAllOpenNotifications(environment.id);
                res.status(204).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    listProviders(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const providers = Object.entries(configService.getTemplates())
                    .map((providerProperties) => {
                    const [provider, properties] = providerProperties;
                    return {
                        name: provider,
                        defaultScopes: properties.default_scopes,
                        authMode: properties.auth_mode,
                        categories: properties.categories
                    };
                })
                    .sort((a, b) => a.name.localeCompare(b.name));
                res.status(200).send(providers);
            }
            catch (err) {
                next(err);
            }
        });
    }
    setMetadataLegacy(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environment = res.locals['environment'];
                const connectionId = req.params['connectionId'] || req.get('Connection-Id');
                const providerConfigKey = req.query['provider_config_key'] || req.get('Provider-Config-Key');
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environment.id);
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (!connection || !connection.id) {
                    const error = new NangoError('unknown_connection', { connectionId, providerConfigKey, environmentName: environment.name });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                yield db.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                    yield connectionService.replaceMetadata([connection.id], req.body, trx);
                }));
                res.status(201).send(req.body);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateMetadataLegacy(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environment = res.locals['environment'];
                const connectionId = req.params['connectionId'] || req.get('Connection-Id');
                const providerConfigKey = req.query['provider_config_key'] || req.get('Provider-Config-Key');
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environment.id);
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (!connection) {
                    const error = new NangoError('unknown_connection', { connectionId, providerConfigKey, environmentName: environment.name });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                yield connectionService.updateMetadata([connection], req.body);
                res.status(200).send(req.body);
            }
            catch (err) {
                next(err);
            }
        });
    }
    createConnection(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment, account } = res.locals;
                const { connection_id, provider_config_key } = req.body;
                if (!connection_id) {
                    errorManager.errRes(res, 'missing_connection');
                    return;
                }
                if (!provider_config_key) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                const provider = yield configService.getProviderName(provider_config_key);
                if (!provider) {
                    const error = new NangoError('unknown_provider_config', { providerConfigKey: provider_config_key, environmentName: environment.name });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (account.is_capped && provider_config_key) {
                    const isCapped = yield connectionCreationStartCapCheckHook({
                        providerConfigKey: provider_config_key,
                        environmentId: environment.id,
                        creationType: 'import'
                    });
                    if (isCapped) {
                        errorManager.errRes(res, 'resource_capped');
                        return;
                    }
                }
                const template = configService.getTemplate(provider);
                let oAuthCredentials;
                let updatedConnection = {};
                let runHook = false;
                if (template.auth_mode === 'OAUTH2') {
                    const { access_token, refresh_token, expires_at, expires_in, metadata, connection_config, no_expiration: noExpiration } = req.body;
                    const { expires_at: parsedExpiresAt } = connectionService.parseRawCredentials({ access_token, refresh_token, expires_at, expires_in }, template.auth_mode);
                    if (!access_token) {
                        errorManager.errRes(res, 'missing_access_token');
                        return;
                    }
                    if (!parsedExpiresAt && noExpiration !== true) {
                        errorManager.errRes(res, 'missing_expires_at');
                        return;
                    }
                    if (parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
                        errorManager.errRes(res, 'invalid_expires_at');
                        return;
                    }
                    oAuthCredentials = {
                        type: template.auth_mode,
                        access_token,
                        refresh_token,
                        expires_at: expires_at || parsedExpiresAt,
                        expires_in,
                        metadata,
                        connection_config,
                        raw: req.body.raw || req.body
                    };
                    if (req.body['oauth_client_id_override']) {
                        oAuthCredentials.config_override = {
                            client_id: req.body['oauth_client_id_override']
                        };
                    }
                    if (req.body['oauth_client_secret_override']) {
                        oAuthCredentials.config_override = Object.assign(Object.assign({}, oAuthCredentials.config_override), { client_secret: req.body['oauth_client_secret_override'] });
                    }
                    if (connection_config) {
                        oAuthCredentials.connection_config = Object.assign(Object.assign({}, oAuthCredentials.connection_config), req.body['connection_config']);
                        if (connection_config['oauth_scopes_override']) {
                            const scopesOverride = connection_config['oauth_scopes_override'];
                            oAuthCredentials.connection_config = Object.assign(Object.assign({}, oAuthCredentials.connection_config), { oauth_scopes_override: !Array.isArray(scopesOverride) ? scopesOverride.split(',') : scopesOverride });
                        }
                    }
                    const connCreatedHook = (res) => __awaiter(this, void 0, void 0, function* () {
                        void connectionCreatedHook({
                            connection: res.connection,
                            environment,
                            account,
                            auth_mode: 'OAUTH2',
                            operation: res.operation
                        }, provider, logContextGetter, null);
                    });
                    const [imported] = yield connectionService.importOAuthConnection(connection_id, provider_config_key, provider, environment.id, account.id, oAuthCredentials, connCreatedHook);
                    if (imported) {
                        updatedConnection = imported;
                    }
                }
                else if (template.auth_mode === 'OAUTH1') {
                    const { oauth_token, oauth_token_secret } = req.body;
                    if (!oauth_token) {
                        errorManager.errRes(res, 'missing_oauth_token');
                        return;
                    }
                    if (!oauth_token_secret) {
                        errorManager.errRes(res, 'missing_oauth_token_secret');
                        return;
                    }
                    oAuthCredentials = {
                        type: template.auth_mode,
                        oauth_token,
                        oauth_token_secret,
                        raw: req.body.raw || req.body
                    };
                    const connCreatedHook = (res) => __awaiter(this, void 0, void 0, function* () {
                        void connectionCreatedHook({
                            connection: res.connection,
                            environment,
                            account,
                            auth_mode: 'OAUTH2',
                            operation: res.operation
                        }, provider, logContextGetter, null);
                    });
                    const [imported] = yield connectionService.importOAuthConnection(connection_id, provider_config_key, provider, environment.id, account.id, oAuthCredentials, connCreatedHook);
                    if (imported) {
                        updatedConnection = imported;
                    }
                }
                else if (template.auth_mode === 'BASIC') {
                    const { username, password } = req.body;
                    if (!username) {
                        errorManager.errRes(res, 'missing_basic_username');
                        return;
                    }
                    const credentials = {
                        type: template.auth_mode,
                        username,
                        password
                    };
                    const connCreatedHook = (res) => __awaiter(this, void 0, void 0, function* () {
                        void connectionCreatedHook({
                            connection: res.connection,
                            environment,
                            account,
                            auth_mode: 'API_KEY',
                            operation: res.operation
                        }, provider, logContextGetter, null);
                    });
                    const [imported] = yield connectionService.importApiAuthConnection(connection_id, provider_config_key, provider, environment.id, account.id, credentials, connCreatedHook);
                    if (imported) {
                        updatedConnection = imported;
                    }
                }
                else if (template.auth_mode === 'API_KEY') {
                    const { api_key: apiKey } = req.body;
                    if (!apiKey) {
                        errorManager.errRes(res, 'missing_api_key');
                        return;
                    }
                    const credentials = {
                        type: template.auth_mode,
                        apiKey
                    };
                    const connCreatedHook = (res) => __awaiter(this, void 0, void 0, function* () {
                        void connectionCreatedHook({
                            connection: res.connection,
                            environment,
                            account,
                            auth_mode: 'API_KEY',
                            operation: res.operation
                        }, provider, logContextGetter, null);
                    });
                    const [imported] = yield connectionService.importApiAuthConnection(connection_id, provider_config_key, provider, environment.id, account.id, credentials, connCreatedHook);
                    if (imported) {
                        updatedConnection = imported;
                    }
                }
                else if (template.auth_mode === 'APP') {
                    const { app_id, installation_id } = req.body;
                    if (!app_id) {
                        errorManager.errRes(res, 'missing_app_id');
                        return;
                    }
                    if (!installation_id) {
                        errorManager.errRes(res, 'missing_installation_id');
                        return;
                    }
                    const connectionConfig = {
                        installation_id,
                        app_id
                    };
                    const config = yield configService.getProviderConfig(provider_config_key, environment.id);
                    if (!config) {
                        errorManager.errRes(res, 'unknown_provider_config');
                        return;
                    }
                    const { success, error, response: credentials } = yield connectionService.getAppCredentials(template, config, connectionConfig);
                    if (!success || !credentials) {
                        errorManager.errResFromNangoErr(res, error);
                        return;
                    }
                    const [imported] = yield connectionService.upsertConnection(connection_id, provider_config_key, provider, credentials, connectionConfig, environment.id, account.id);
                    if (imported) {
                        updatedConnection = imported;
                        runHook = true;
                    }
                }
                else if (template.auth_mode === 'NONE') {
                    const [imported] = yield connectionService.upsertUnauthConnection(connection_id, provider_config_key, provider, environment.id, account.id);
                    if (imported) {
                        updatedConnection = imported;
                        runHook = true;
                    }
                }
                else {
                    errorManager.errRes(res, 'unknown_oauth_type');
                    return;
                }
                if (updatedConnection && updatedConnection.connection.id && runHook) {
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: template.auth_mode,
                        operation: updatedConnection.operation || 'unknown'
                    }, provider, logContextGetter, null);
                }
                res.status(201).send(req.body);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
export default new ConnectionController();
//# sourceMappingURL=connection.controller.js.map