var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createActivityLog, errorManager, analytics, AnalyticsTypes, createActivityLogMessage, updateSuccess as updateSuccessActivityLog, updateProvider as updateProviderActivityLog, configService, connectionService, createActivityLogMessageAndEnd, hmacService, ErrorSourceEnum, LogActionEnum } from '@nangohq/shared';
import { defaultOperationExpiration, logContextGetter } from '@nangohq/logs';
import { stringifyError } from '@nangohq/utils';
import { connectionCreated as connectionCreatedHook, connectionCreationFailed as connectionCreationFailedHook } from '../hooks/hooks.js';
class AppStoreAuthController {
    auth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { environment, account } = res.locals;
            const { providerConfigKey } = req.params;
            const connectionId = req.query['connection_id'];
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
                    message: 'Create connection via App Store',
                    expiresAt: defaultOperationExpiration.auth()
                }, { account, environment });
                void analytics.track(AnalyticsTypes.PRE_APP_STORE_AUTH, account.id);
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
                        content: `Error during App store auth: config not found`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Invalid HMAC');
                    yield logCtx.failed();
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                const template = configService.getTemplate(config.provider);
                if (template.auth_mode !== 'APP_STORE') {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Provider ${config.provider} does not support App store auth`
                    });
                    yield logCtx.error('Provider does not support API key auth', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'invalid_auth_mode');
                    return;
                }
                yield updateProviderActivityLog(activityLogId, String(config.provider));
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                if (!req.body.privateKeyId) {
                    errorManager.errRes(res, 'missing_private_key_id');
                    return;
                }
                if (!req.body.privateKey) {
                    errorManager.errRes(res, 'missing_private_key');
                    return;
                }
                if (!req.body.issuerId) {
                    errorManager.errRes(res, 'missing_issuer_id');
                    return;
                }
                const { privateKeyId, privateKey, issuerId, scope } = req.body;
                const connectionConfig = {
                    privateKeyId,
                    issuerId,
                    scope
                };
                const { success, error, response: credentials } = yield connectionService.getAppStoreCredentials(template, connectionConfig, privateKey);
                if (!success || !credentials) {
                    connectionCreationFailedHook({
                        connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                        environment,
                        account,
                        auth_mode: 'APP_STORE',
                        error: {
                            type: 'credential_fetch_failure',
                            description: `Error during App store credentials auth: ${error === null || error === void 0 ? void 0 : error.message}`
                        },
                        operation: 'unknown'
                    }, config.provider, activityLogId, logCtx);
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `App store auth creation was successful`,
                    timestamp: Date.now()
                });
                yield logCtx.info('App Store auth creation was successful');
                yield logCtx.success();
                yield updateSuccessActivityLog(activityLogId, true);
                const [updatedConnection] = yield connectionService.upsertConnection(connectionId, providerConfigKey, config.provider, credentials, connectionConfig, environment.id, account.id);
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: 'APP_STORE',
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
                    content: `Error during App store auth: ${prettyError}`,
                    timestamp: Date.now()
                });
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: 'APP_STORE',
                    error: {
                        type: 'unknown',
                        description: `Error during App store auth: ${prettyError}`
                    },
                    operation: 'unknown'
                }, 'unknown', activityLogId, logCtx);
                if (logCtx) {
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
export default new AppStoreAuthController();
//# sourceMappingURL=appStoreAuth.controller.js.map