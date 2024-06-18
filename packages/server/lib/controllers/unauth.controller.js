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
import { logContextGetter } from '@nangohq/logs';
import { stringifyError } from '@nangohq/utils';
import { connectionCreated as connectionCreatedHook, connectionCreationFailed as connectionCreationFailedHook } from '../hooks/hooks.js';
class UnAuthController {
    create(req, res, next) {
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
                logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'auth', action: 'create_connection' }, message: 'Create connection via Unauthenticated' }, { account, environment });
                void analytics.track(AnalyticsTypes.PRE_UNAUTH, account.id);
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
                if (template.auth_mode !== 'NONE') {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Provider ${config.provider} does not support unauth creation`
                    });
                    yield logCtx.error('Provider does not support Unauthenticated', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'invalid_auth_mode');
                    return;
                }
                yield updateProviderActivityLog(activityLogId, String(config.provider));
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Unauthenticated connection creation was successful`,
                    timestamp: Date.now()
                });
                yield logCtx.info('Unauthenticated connection creation was successful');
                yield logCtx.success();
                yield updateSuccessActivityLog(activityLogId, true);
                const [updatedConnection] = yield connectionService.upsertUnauthConnection(connectionId, providerConfigKey, config.provider, environment.id, account.id);
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: 'NONE',
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
                    content: `Error during Unauth create: ${prettyError}`,
                    timestamp: Date.now()
                });
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: 'NONE',
                    error: {
                        type: 'unknown',
                        description: `Error during Unauth create: ${prettyError}`
                    },
                    operation: 'unknown'
                }, 'unknown', activityLogId, logCtx);
                if (logCtx) {
                    yield logCtx.error('Error during Unauthenticated connection creation', { error: err });
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
export default new UnAuthController();
//# sourceMappingURL=unauth.controller.js.map