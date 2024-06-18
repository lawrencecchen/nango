var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { environmentService, errorManager, analytics, AnalyticsTypes, createActivityLogMessage, updateSuccess as updateSuccessActivityLog, configService, connectionService, LogActionEnum, createActivityLogMessageAndEnd, telemetry, LogTypes } from '@nangohq/shared';
import { logContextGetter } from '@nangohq/logs';
import { stringifyError } from '@nangohq/utils';
import { missesInterpolationParam } from '../utils/utils.js';
import * as WSErrBuilder from '../utils/web-socket-error.js';
import oAuthSessionService from '../services/oauth-session.service.js';
import publisher from '../clients/publisher.client.js';
import { connectionCreated as connectionCreatedHook, connectionCreationFailed as connectionCreationFailedHook } from '../hooks/hooks.js';
class AppAuthController {
    connect(req, res, _next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const installation_id = req.query['installation_id'];
            const state = req.query['state'];
            const action = req.query['setup_action'];
            // this is an instance where an organization approved an install
            // reconcile the installation id using the webhook
            if ((action === 'install' && !state) || (action === 'update' && !state)) {
                res.redirect(req.get('referer') || req.get('Referer') || req.headers.referer || 'https://github.com');
                return;
            }
            if (!state) {
                res.sendStatus(400);
                return;
            }
            const session = yield oAuthSessionService.findById(state);
            if (!session) {
                res.sendStatus(404);
                return;
            }
            else {
                yield oAuthSessionService.delete(session.id);
            }
            const environmentAndAccountLookup = yield environmentService.getAccountAndEnvironment({ environmentId: session.environmentId });
            if (!environmentAndAccountLookup) {
                res.sendStatus(404);
                return;
            }
            const { environment, account } = environmentAndAccountLookup;
            void analytics.track(AnalyticsTypes.PRE_APP_AUTH, account.id);
            const { providerConfigKey, connectionId, webSocketClientId: wsClientId } = session;
            const activityLogId = Number(session.activityLogId);
            const logCtx = yield logContextGetter.get({ id: session.activityLogId });
            try {
                if (!providerConfigKey) {
                    errorManager.errRes(res, 'missing_connection');
                    return;
                }
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
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
                    yield logCtx.error('Error during API Key auth: config not found');
                    yield logCtx.failed();
                    yield updateSuccessActivityLog(activityLogId, false);
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                const template = configService.getTemplate(config.provider);
                const tokenUrl = typeof template.token_url === 'string' ? template.token_url : (_a = template.token_url) === null || _a === void 0 ? void 0 : _a['APP'];
                if (template.auth_mode !== 'APP') {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Provider ${config.provider} does not support app creation`
                    });
                    yield logCtx.error('Provider does not support app creation', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'invalid_auth_mode');
                    yield updateSuccessActivityLog(activityLogId, false);
                    return;
                }
                if (action === 'request') {
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: 'App types do not support the request flow. Please use the github-app-oauth provider for the request flow.',
                        timestamp: Date.now(),
                        auth_mode: 'APP',
                        url: req.originalUrl
                    });
                    yield logCtx.error('App types do not support the request flow. Please use the github-app-oauth provider for the request flow.', {
                        provider: config.provider,
                        url: req.originalUrl
                    });
                    yield logCtx.failed();
                    yield updateSuccessActivityLog(activityLogId, false);
                    errorManager.errRes(res, 'wrong_auth_mode');
                    return;
                }
                const connectionConfig = {
                    installation_id,
                    app_id: config.oauth_client_id
                };
                if (missesInterpolationParam(tokenUrl, connectionConfig)) {
                    const error = WSErrBuilder.InvalidConnectionConfig(tokenUrl, JSON.stringify(connectionConfig));
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: req.originalUrl,
                        params: Object.assign({}, connectionConfig)
                    });
                    yield logCtx.error(error.message, { connectionConfig, url: req.originalUrl });
                    yield logCtx.failed();
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                if (!installation_id) {
                    yield logCtx.failed();
                    res.sendStatus(400);
                    return;
                }
                const { success, error, response: credentials } = yield connectionService.getAppCredentials(template, config, connectionConfig);
                if (!success || !credentials) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `Error during app token retrieval call: ${error === null || error === void 0 ? void 0 : error.message}`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Error during app token retrieval call', { error });
                    yield logCtx.failed();
                    yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, `App auth token retrieval request process failed ${error === null || error === void 0 ? void 0 : error.message}`, LogActionEnum.AUTH, {
                        environmentId: String(environment.id),
                        providerConfigKey: String(providerConfigKey),
                        connectionId: String(connectionId),
                        authMode: String(template.auth_mode),
                        level: 'error'
                    });
                    connectionCreationFailedHook({
                        connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                        environment,
                        account,
                        auth_mode: 'APP',
                        error: {
                            type: 'unknown',
                            description: `Error during app token retrieval call: ${error === null || error === void 0 ? void 0 : error.message}`
                        },
                        operation: 'unknown'
                    }, session.provider, activityLogId, logCtx);
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                yield updateSuccessActivityLog(activityLogId, true);
                const [updatedConnection] = yield connectionService.upsertConnection(connectionId, providerConfigKey, session.provider, credentials, connectionConfig, environment.id, account.id);
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: 'APP',
                        operation: updatedConnection.operation
                    }, session.provider, logContextGetter, activityLogId, undefined, logCtx);
                }
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: 'App connection was successful and credentials were saved',
                    timestamp: Date.now()
                });
                yield logCtx.info('App connection was successful and credentials were saved');
                yield logCtx.success();
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_SUCCESS, 'App auth token request succeeded', LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    provider: String(config.provider),
                    connectionId: String(connectionId),
                    authMode: String(template.auth_mode)
                });
                return publisher.notifySuccess(res, wsClientId, providerConfigKey, connectionId);
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                const error = WSErrBuilder.UnknownError();
                const content = error.message + '\n' + prettyError;
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content,
                    timestamp: Date.now(),
                    auth_mode: 'APP',
                    url: req.originalUrl
                });
                yield logCtx.error(error.message, { error: err, url: req.originalUrl });
                yield logCtx.failed();
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, `App auth request process failed ${content}`, LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    connectionId: String(connectionId)
                });
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: 'APP',
                    error: {
                        type: 'unknown',
                        description: content
                    },
                    operation: 'unknown'
                }, 'unknown', activityLogId, logCtx);
                return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, WSErrBuilder.UnknownError(prettyError));
            }
        });
    }
}
export default new AppAuthController();
//# sourceMappingURL=appAuth.controller.js.map