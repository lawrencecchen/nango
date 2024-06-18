var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import get from 'lodash-es/get.js';
import { environmentService, connectionService, telemetry, getSyncConfigsByConfigIdForWebhook, LogActionEnum, LogTypes } from '@nangohq/shared';
import { getOrchestrator } from '../utils/utils.js';
export const internalNango = {
    getWebhooks: (environment_id, nango_config_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield getSyncConfigsByConfigIdForWebhook(environment_id, nango_config_id);
    }),
    executeScriptForWebhooks: (integration, body, webhookType, connectionIdentifier, logContextGetter, propName) => __awaiter(void 0, void 0, void 0, function* () {
        if (!get(body, connectionIdentifier)) {
            yield telemetry.log(LogTypes.INCOMING_WEBHOOK_ISSUE_WRONG_CONNECTION_IDENTIFIER, 'Incoming webhook had the wrong connection identifier', LogActionEnum.WEBHOOK, {
                environmentId: String(integration.environment_id),
                provider: integration.provider,
                providerConfigKey: integration.unique_key,
                connectionIdentifier,
                payload: JSON.stringify(body),
                level: 'error'
            });
            return { connectionIds: [] };
        }
        let connections = null;
        if (propName === 'connectionId') {
            const { success, response: connection } = yield connectionService.getConnection(get(body, connectionIdentifier), integration.unique_key, integration.environment_id);
            if (success && connection) {
                connections = [connection];
            }
        }
        else {
            connections = yield connectionService.findConnectionsByConnectionConfigValue(propName || connectionIdentifier, get(body, connectionIdentifier), integration.environment_id);
        }
        if (!connections || connections.length === 0) {
            yield telemetry.log(LogTypes.INCOMING_WEBHOOK_ISSUE_CONNECTION_NOT_FOUND, 'Incoming webhook received but no connection found for it', LogActionEnum.WEBHOOK, {
                environmentId: String(integration.environment_id),
                provider: integration.provider,
                providerConfigKey: integration.unique_key,
                propName: String(propName),
                connectionIdentifier,
                payload: JSON.stringify(body),
                level: 'error'
            });
            return { connectionIds: [] };
        }
        const syncConfigsWithWebhooks = yield internalNango.getWebhooks(integration.environment_id, integration.id);
        if (syncConfigsWithWebhooks.length <= 0) {
            return { connectionIds: connections === null || connections === void 0 ? void 0 : connections.map((connection) => connection.connection_id) };
        }
        const { account, environment } = (yield environmentService.getAccountAndEnvironment({ environmentId: integration.environment_id }));
        yield telemetry.log(LogTypes.INCOMING_WEBHOOK_RECEIVED, 'Incoming webhook received and connection found for it', LogActionEnum.WEBHOOK, {
            accountId: String(account.id),
            environmentId: String(integration.environment_id),
            provider: integration.provider,
            providerConfigKey: integration.unique_key,
            connectionIds: connections.map((connection) => connection.connection_id).join(',')
        });
        const type = get(body, webhookType);
        for (const syncConfig of syncConfigsWithWebhooks) {
            const { webhook_subscriptions } = syncConfig;
            if (!webhook_subscriptions) {
                continue;
            }
            for (const webhook of webhook_subscriptions) {
                if (type === webhook) {
                    for (const connection of connections) {
                        yield getOrchestrator().triggerWebhook({
                            account,
                            environment,
                            integration,
                            connection,
                            webhookName: webhook,
                            syncConfig,
                            input: body,
                            logContextGetter
                        });
                    }
                }
            }
        }
        return { connectionIds: connections.map((connection) => connection.connection_id) };
    })
};
//# sourceMappingURL=internal-nango.js.map