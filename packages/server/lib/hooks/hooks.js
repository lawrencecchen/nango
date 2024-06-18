var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import { CONNECTIONS_WITH_SCRIPTS_CAP_LIMIT, NangoError, SpanTypes, proxyService, getSyncConfigsWithConnections, analytics, errorNotificationService, SlackService, externalWebhookService, AnalyticsTypes, syncManager } from '@nangohq/shared';
import { getLogger, Ok, Err, isHosted } from '@nangohq/utils';
import { logContextGetter } from '@nangohq/logs';
import { sendAuth as sendAuthWebhook } from '@nangohq/webhooks';
import postConnection from './connection/post-connection.js';
import { externalPostConnection } from './connection/external-post-connection.js';
import { getOrchestrator, getOrchestratorClient } from '../utils/utils.js';
const logger = getLogger('hooks');
const orchestrator = getOrchestrator();
export const connectionCreationStartCapCheck = ({ providerConfigKey, environmentId, creationType }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!providerConfigKey) {
        return false;
    }
    const scriptConfigs = yield getSyncConfigsWithConnections(providerConfigKey, environmentId);
    if (scriptConfigs.length > 0) {
        for (const script of scriptConfigs) {
            const { connections } = script;
            if (connections && connections.length >= CONNECTIONS_WITH_SCRIPTS_CAP_LIMIT) {
                logger.info(`Reached cap for providerConfigKey: ${providerConfigKey} and environmentId: ${environmentId}`);
                const analyticsType = creationType === 'create' ? AnalyticsTypes.RESOURCE_CAPPED_CONNECTION_CREATED : AnalyticsTypes.RESOURCE_CAPPED_CONNECTION_IMPORTED;
                void analytics.trackByEnvironmentId(analyticsType, environmentId);
                return true;
            }
        }
    }
    return false;
});
export const connectionCreated = (createdConnectionPayload, provider, logContextGetter, activityLogId, options = { initiateSync: true, runPostConnectionScript: true }, logCtx) => __awaiter(void 0, void 0, void 0, function* () {
    const { connection, environment, auth_mode } = createdConnectionPayload;
    if (options.initiateSync === true && !isHosted) {
        yield syncManager.createSyncForConnection(connection.id, logContextGetter, orchestrator);
    }
    if (options.runPostConnectionScript === true) {
        yield postConnection(createdConnectionPayload, provider, logContextGetter);
        yield externalPostConnection(createdConnectionPayload, provider, logContextGetter);
    }
    const webhookSettings = yield externalWebhookService.get(environment.id);
    void sendAuthWebhook({
        connection,
        environment,
        webhookSettings,
        auth_mode,
        success: true,
        operation: 'creation',
        provider,
        type: 'auth',
        activityLogId,
        logCtx
    });
});
export const connectionCreationFailed = (failedConnectionPayload, provider, activityLogId, logCtx) => __awaiter(void 0, void 0, void 0, function* () {
    const { connection, environment, auth_mode, error } = failedConnectionPayload;
    if (error) {
        const webhookSettings = yield externalWebhookService.get(environment.id);
        void sendAuthWebhook({
            connection,
            environment,
            webhookSettings,
            auth_mode,
            success: false,
            error,
            operation: 'creation',
            provider,
            type: 'auth',
            activityLogId,
            logCtx
        });
    }
});
export const connectionRefreshSuccess = ({ connection, environment, config }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!connection.id) {
        return;
    }
    yield errorNotificationService.auth.clear({
        connection_id: connection.id
    });
    const slackNotificationService = new SlackService({ orchestratorClient: getOrchestratorClient(), logContextGetter });
    void slackNotificationService.removeFailingConnection(connection, connection.connection_id, 'auth', null, environment.id, config.provider);
});
export const connectionRefreshFailed = ({ connection, activityLogId, logCtx, authError, environment, template, config }) => __awaiter(void 0, void 0, void 0, function* () {
    yield errorNotificationService.auth.create({
        type: 'auth',
        action: 'token_refresh',
        connection_id: connection.id,
        activity_log_id: activityLogId,
        log_id: logCtx.id,
        active: true
    });
    const webhookSettings = yield externalWebhookService.get(environment.id);
    void sendAuthWebhook({
        connection,
        environment,
        webhookSettings,
        auth_mode: template.auth_mode,
        operation: 'refresh',
        error: authError,
        success: false,
        provider: config.provider,
        type: 'auth',
        activityLogId,
        logCtx
    });
    const slackNotificationService = new SlackService({ orchestratorClient: getOrchestratorClient(), logContextGetter });
    void slackNotificationService.reportFailure(connection, connection.connection_id, 'auth', activityLogId, environment.id, config.provider);
});
export const connectionTest = (provider, template, credentials, connectionId, providerConfigKey, environment_id, connection_config, tracer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const providerVerification = (_a = template === null || template === void 0 ? void 0 : template.proxy) === null || _a === void 0 ? void 0 : _a.verification;
    if (!providerVerification) {
        return Ok(true);
    }
    const active = tracer.scope().active();
    const span = tracer.startSpan(SpanTypes.CONNECTION_TEST, {
        childOf: active,
        tags: {
            'nango.provider': provider,
            'nango.providerConfigKey': providerConfigKey,
            'nango.connectionId': connectionId
        }
    });
    const { method, endpoint, base_url_override: baseUrlOverride, headers } = providerVerification;
    const connection = {
        id: -1,
        provider_config_key: providerConfigKey,
        connection_id: connectionId,
        credentials,
        connection_config,
        environment_id
    };
    const configBody = {
        endpoint,
        method: method === null || method === void 0 ? void 0 : method.toUpperCase(),
        template,
        token: credentials,
        provider: provider,
        providerConfigKey,
        connectionId,
        headers: {
            'Content-Type': 'application/json'
        },
        connection
    };
    if (headers) {
        configBody.headers = headers;
    }
    if (baseUrlOverride) {
        configBody.baseUrlOverride = baseUrlOverride;
    }
    const internalConfig = {
        provider,
        connection
    };
    try {
        const { response } = yield proxyService.route(configBody, internalConfig);
        if (axios.isAxiosError(response)) {
            span.setTag('nango.error', response);
            const error = new NangoError('connection_test_failed', response, (_b = response.response) === null || _b === void 0 ? void 0 : _b.status);
            return Err(error);
        }
        if (!response) {
            const error = new NangoError('connection_test_failed');
            span.setTag('nango.error', response);
            return Err(error);
        }
        if (response.status && ((response === null || response === void 0 ? void 0 : response.status) < 200 || (response === null || response === void 0 ? void 0 : response.status) > 300)) {
            const error = new NangoError('connection_test_failed');
            span.setTag('nango.error', response);
            return Err(error);
        }
        return Ok(true);
    }
    catch (e) {
        const error = new NangoError('connection_test_failed');
        span.setTag('nango.error', e);
        return Err(error);
    }
    finally {
        span.finish();
    }
});
//# sourceMappingURL=hooks.js.map