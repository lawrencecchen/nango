var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import tracer from 'dd-trace';
import { createActivityLog, errorManager, analytics, AnalyticsTypes, createActivityLogMessage, updateSuccess as updateSuccessActivityLog, updateProvider as updateProviderActivityLog, configService, connectionService, createActivityLogMessageAndEnd, getConnectionConfig, hmacService, ErrorSourceEnum, LogActionEnum } from '@nangohq/shared';
import { defaultOperationExpiration, logContextGetter } from '@nangohq/logs';
import { stringifyError } from '@nangohq/utils';
import { connectionCreated as connectionCreatedHook, connectionCreationFailed as connectionCreationFailedHook, connectionTest as connectionTestHook } from '../hooks/hooks.js';
class ApiAuthController {
    apiKey(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { account, environment } = res.locals;
            const { providerConfigKey } = req.params;
            const connectionId = req.query['connection_id'];
            const connectionConfig = req.query['params'] != null ? getConnectionConfig(req.query['params']) : {};
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.AUTH,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                environment_id: environment.id
            };
            const activityLogId = yield createActivityLog(log);
            let logCtx;
            try {
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'auth', action: 'create_connection' },
                    message: 'Create connection via API Key',
                    expiresAt: defaultOperationExpiration.auth()
                }, { account, environment });
                void analytics.track(AnalyticsTypes.PRE_API_KEY_AUTH, account.id);
                if (!providerConfigKey) {
                    errorManager.errRes(res, 'missing_connection');
                    return;
                }
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
                }
                const hmacEnabled = yield hmacService.isEnabled(environment.id);
                if (hmacEnabled) {
                    const hmac = req.query['hmac'];
                    if (!hmac) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Missing HMAC in query params'
                        });
                        yield logCtx.error('Missing HMAC in query params');
                        yield logCtx.failed();
                        errorManager.errRes(res, 'missing_hmac');
                        return;
                    }
                    const verified = yield hmacService.verify(hmac, environment.id, providerConfigKey, connectionId);
                    if (!verified) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Invalid HMAC'
                        });
                        yield logCtx.error('Invalid HMAC');
                        yield logCtx.failed();
                        errorManager.errRes(res, 'invalid_hmac');
                        return;
                    }
                }
                const config = yield configService.getProviderConfig(providerConfigKey, environment.id);
                if (config == null) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `Error during API Key auth: config not found`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Unknown provider config');
                    yield logCtx.failed();
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                const template = configService.getTemplate(config.provider);
                if (template.auth_mode !== 'API_KEY') {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Provider ${config.provider} does not support API key auth`
                    });
                    yield logCtx.error('Provider does not support API key auth', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'invalid_auth_mode');
                    return;
                }
                yield updateProviderActivityLog(activityLogId, String(config.provider));
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                if (!req.body.apiKey) {
                    errorManager.errRes(res, 'missing_api_key');
                    return;
                }
                const { apiKey } = req.body;
                const credentials = {
                    type: 'API_KEY',
                    apiKey
                };
                const connectionResponse = yield connectionTestHook(config.provider, template, credentials, connectionId, providerConfigKey, environment.id, connectionConfig, tracer);
                if (connectionResponse.isErr()) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `The credentials provided were not valid for the ${config.provider} provider`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Provided credentials are invalid', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errResFromNangoErr(res, connectionResponse.error);
                    return;
                }
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `API key auth creation was successful`,
                    timestamp: Date.now()
                });
                yield logCtx.info('API key auth creation was successful');
                yield logCtx.success();
                yield updateSuccessActivityLog(activityLogId, true);
                const [updatedConnection] = yield connectionService.upsertApiConnection(connectionId, providerConfigKey, config.provider, credentials, connectionConfig, environment.id, account.id);
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: 'API_KEY',
                        operation: updatedConnection.operation
                    }, config.provider, logContextGetter, activityLogId, undefined, logCtx);
                }
                res.status(200).send({ providerConfigKey: providerConfigKey, connectionId: connectionId });
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Error during API key auth: ${prettyError}`,
                    timestamp: Date.now()
                });
                if (logCtx) {
                    connectionCreationFailedHook({
                        connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                        environment,
                        account,
                        auth_mode: 'API_KEY',
                        error: {
                            type: 'unknown',
                            description: `Error during API key auth: ${prettyError}`
                        },
                        operation: 'unknown'
                    }, 'unknown', activityLogId, logCtx);
                    yield logCtx.error('Error during API key auth', { error: err });
                    yield logCtx.failed();
                }
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: environment.id,
                    metadata: {
                        providerConfigKey,
                        connectionId
                    }
                });
                next(err);
            }
        });
    }
    basic(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { account, environment } = res.locals;
            const { providerConfigKey } = req.params;
            const connectionId = req.query['connection_id'];
            const connectionConfig = req.query['params'] != null ? getConnectionConfig(req.query['params']) : {};
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.AUTH,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                environment_id: environment.id
            };
            const activityLogId = yield createActivityLog(log);
            let logCtx;
            try {
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'auth', action: 'create_connection' },
                    message: 'Create connection via Basic Auth',
                    expiresAt: defaultOperationExpiration.auth()
                }, { account, environment });
                void analytics.track(AnalyticsTypes.PRE_BASIC_API_KEY_AUTH, account.id);
                if (!providerConfigKey) {
                    errorManager.errRes(res, 'missing_connection');
                    return;
                }
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
                }
                const hmacEnabled = yield hmacService.isEnabled(environment.id);
                if (hmacEnabled) {
                    const hmac = req.query['hmac'];
                    if (!hmac) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Missing HMAC in query params'
                        });
                        yield logCtx.error('Missing HMAC in query params');
                        yield logCtx.failed();
                        errorManager.errRes(res, 'missing_hmac');
                        return;
                    }
                    const verified = yield hmacService.verify(hmac, environment.id, providerConfigKey, connectionId);
                    if (!verified) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Invalid HMAC'
                        });
                        yield logCtx.error('Invalid HMAC');
                        yield logCtx.failed();
                        errorManager.errRes(res, 'invalid_hmac');
                        return;
                    }
                }
                const { username = '', password = '' } = req.body;
                const config = yield configService.getProviderConfig(providerConfigKey, environment.id);
                if (config == null) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `Error during basic API auth: config not found`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Unknown provider config');
                    yield logCtx.failed();
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                const template = configService.getTemplate(config.provider);
                if (template.auth_mode !== 'BASIC') {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Provider ${config.provider} does not support Basic API auth`
                    });
                    yield logCtx.error('Provider does not support Basic API auth', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'invalid_auth_mode');
                    return;
                }
                const credentials = {
                    type: 'BASIC',
                    username,
                    password
                };
                const connectionResponse = yield connectionTestHook(config.provider, template, credentials, connectionId, providerConfigKey, environment.id, connectionConfig, tracer);
                if (connectionResponse.isErr()) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `The credentials provided were not valid for the ${config.provider} provider`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Provided credentials are invalid', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errResFromNangoErr(res, connectionResponse.error);
                    return;
                }
                yield updateProviderActivityLog(activityLogId, String(config.provider));
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Basic API key auth creation was successful with the username ${username}`,
                    timestamp: Date.now()
                });
                yield updateSuccessActivityLog(activityLogId, true);
                yield logCtx.info('Basic API key auth creation was successful', { username });
                yield logCtx.success();
                const [updatedConnection] = yield connectionService.upsertApiConnection(connectionId, providerConfigKey, config.provider, credentials, connectionConfig, environment.id, account.id);
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: 'BASIC',
                        operation: updatedConnection.operation
                    }, config.provider, logContextGetter, activityLogId, undefined, logCtx);
                }
                res.status(200).send({ providerConfigKey: providerConfigKey, connectionId: connectionId });
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Error during basic API auth: ${prettyError}`,
                    timestamp: Date.now()
                });
                if (logCtx) {
                    connectionCreationFailedHook({
                        connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                        environment,
                        account,
                        auth_mode: 'API_KEY',
                        error: {
                            type: 'unknown',
                            description: `Error during basic API key auth: ${prettyError}`
                        },
                        operation: 'unknown'
                    }, 'unknown', activityLogId, logCtx);
                    yield logCtx.error('Error during API key auth', { error: err });
                    yield logCtx.failed();
                }
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: environment.id,
                    metadata: {
                        providerConfigKey,
                        connectionId
                    }
                });
                next(err);
            }
        });
    }
}
export default new ApiAuthController();
//# sourceMappingURL=apiAuth.controller.js.map