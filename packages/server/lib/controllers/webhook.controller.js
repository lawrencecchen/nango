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
import { featureFlags, environmentService } from '@nangohq/shared';
import { metrics } from '@nangohq/utils';
import { logContextGetter } from '@nangohq/logs';
import routeWebhook from '../webhook/webhook.manager.js';
class WebhookController {
    receive(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const active = tracer.scope().active();
            const span = tracer.startSpan('server.sync.receiveWebhook', {
                childOf: active
            });
            const { environmentUuid, providerConfigKey } = req.params;
            const headers = req.headers;
            try {
                if (!environmentUuid || !providerConfigKey) {
                    return;
                }
                const isGloballyEnabled = yield featureFlags.isEnabled('external-webhooks', 'global', true, true);
                if (!isGloballyEnabled) {
                    res.status(404).send();
                    return;
                }
                const accountUUID = yield environmentService.getAccountUUIDFromEnvironmentUUID(environmentUuid);
                if (!accountUUID) {
                    res.status(404).send();
                    return;
                }
                span.setTag('nango.accountUUID', accountUUID);
                span.setTag('nango.environmentUUID', environmentUuid);
                span.setTag('nango.providerConfigKey', providerConfigKey);
                const areWebhooksEnabled = yield featureFlags.isEnabled('external-webhooks', accountUUID, true, true);
                let responsePayload = null;
                if (areWebhooksEnabled) {
                    const startTime = Date.now();
                    responsePayload = yield routeWebhook(environmentUuid, providerConfigKey, headers, req.body, req.rawBody, logContextGetter);
                    const endTime = Date.now();
                    const totalRunTime = (endTime - startTime) / 1000;
                    metrics.duration(metrics.Types.WEBHOOK_TRACK_RUNTIME, totalRunTime);
                }
                else {
                    res.status(404).send();
                    return;
                }
                if (!responsePayload) {
                    res.status(200).send();
                    return;
                }
                else {
                    res.status(200).send(responsePayload);
                    return;
                }
            }
            catch (err) {
                span.setTag('nango.error', err);
                next(err);
            }
            finally {
                span.finish();
            }
        });
    }
}
export default new WebhookController();
//# sourceMappingURL=webhook.controller.js.map