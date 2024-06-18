var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { deliver, shouldSend } from './utils.js';
export const forwardWebhook = ({ integration, account, environment, webhookSettings, connectionIds, payload, webhookOriginalHeaders, logContextGetter }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!webhookSettings) {
        return;
    }
    if (!shouldSend({ success: true, type: 'forward', webhookSettings, operation: 'incoming_webhook' })) {
        return;
    }
    const logCtx = yield logContextGetter.create({
        operation: { type: 'webhook', action: 'outgoing' },
        message: 'Forwarding Webhook',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }, {
        account,
        environment,
        integration: { id: integration.id, name: integration.unique_key, provider: integration.provider }
    });
    const body = {
        from: integration.provider,
        providerConfigKey: integration.unique_key,
        type: 'forward',
        payload: payload
    };
    const webhooks = [
        { url: webhookSettings.primary_url, type: 'webhook url' },
        { url: webhookSettings.secondary_url, type: 'secondary webhook url' }
    ].filter((webhook) => webhook.url);
    if (!connectionIds || connectionIds.length === 0) {
        const result = yield deliver({
            webhooks,
            body: payload,
            webhookType: 'forward',
            activityLogId: null,
            environment,
            logCtx
        });
        result ? yield logCtx.success() : yield logCtx.failed();
        return;
    }
    let success = true;
    for (const connectionId of connectionIds) {
        const result = yield deliver({
            webhooks,
            body: Object.assign(Object.assign({}, body), { connectionId }),
            webhookType: 'forward',
            activityLogId: null,
            environment,
            logCtx,
            incomingHeaders: webhookOriginalHeaders
        });
        if (!result) {
            success = false;
        }
    }
    success ? yield logCtx.success() : yield logCtx.failed();
});
//# sourceMappingURL=forward.js.map