var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { externalWebhookService, configService, environmentService, telemetry, LogTypes, LogActionEnum } from '@nangohq/shared';
import { getLogger } from '@nangohq/utils';
import { forwardWebhook } from '@nangohq/webhooks';
import { internalNango } from './internal-nango.js';
import * as webhookHandlers from './index.js';
const logger = getLogger('Webhook.Manager');
const handlers = webhookHandlers;
function execute(environmentUuid, providerConfigKey, headers, body, rawBody, logContextGetter) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!body) {
            return;
        }
        const integration = yield configService.getProviderConfigByUuid(providerConfigKey, environmentUuid);
        if (!integration) {
            return;
        }
        const environmentAndAccountLookup = yield environmentService.getAccountAndEnvironment({ environmentUuid: environmentUuid });
        if (!environmentAndAccountLookup) {
            return;
        }
        const { environment, account } = environmentAndAccountLookup;
        const handler = handlers[`${integration.provider.replace(/-/g, '')}Webhook`];
        if (!handler) {
            return;
        }
        let res = undefined;
        try {
            res = yield handler(internalNango, integration, headers, body, rawBody, logContextGetter);
        }
        catch (e) {
            logger.error(`error processing incoming webhook for ${providerConfigKey} - `, e);
            yield telemetry.log(LogTypes.INCOMING_WEBHOOK_FAILED_PROCESSING, 'Incoming webhook failed processing', LogActionEnum.WEBHOOK, {
                accountId: String(account.id),
                environmentId: String(integration.environment_id),
                provider: integration.provider,
                providerConfigKey: integration.unique_key,
                payload: JSON.stringify(body),
                error: String(e),
                level: 'error'
            });
        }
        const webhookBodyToForward = (res === null || res === void 0 ? void 0 : res.parsedBody) || body;
        const connectionIds = (res === null || res === void 0 ? void 0 : res.connectionIds) || [];
        const webhookSettings = yield externalWebhookService.get(environment.id);
        yield forwardWebhook({
            integration,
            account,
            environment,
            webhookSettings,
            connectionIds,
            payload: webhookBodyToForward,
            webhookOriginalHeaders: headers,
            logContextGetter
        });
        yield telemetry.log(LogTypes.INCOMING_WEBHOOK_PROCESSED_SUCCESSFULLY, 'Incoming webhook was processed successfully', LogActionEnum.WEBHOOK, {
            accountId: String(account.id),
            environmentId: String(integration.environment_id),
            provider: integration.provider,
            providerConfigKey: integration.unique_key,
            payload: JSON.stringify(webhookBodyToForward)
        });
        return res ? res.acknowledgementResponse : null;
    });
}
export default execute;
//# sourceMappingURL=webhook.manager.js.map