var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import crypto from 'node:crypto';
import { getLogger } from '@nangohq/utils';
const logger = getLogger('Webhook.Linear');
function validate(integration, headerSignature, rawBody) {
    var _a;
    if (!((_a = integration.custom) === null || _a === void 0 ? void 0 : _a['webhookSecret'])) {
        return false;
    }
    const signature = crypto.createHmac('sha256', integration.custom['webhookSecret']).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(headerSignature));
}
const route = (nango, integration, headers, body, rawBody, logContextGetter) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = headers['linear-signature'];
    logger.info('received', { configId: integration.id });
    if (!validate(integration, signature, rawBody)) {
        logger.error('invalid signature', { configId: integration.id });
        return;
    }
    const parsedBody = body;
    logger.info(`valid ${parsedBody.type}`, { configId: integration.id });
    const response = yield nango.executeScriptForWebhooks(integration, parsedBody, 'type', 'organizationId', logContextGetter, 'organizationId');
    return { parsedBody, connectionIds: (response === null || response === void 0 ? void 0 : response.connectionIds) || [] };
});
export default route;
//# sourceMappingURL=linear-webhook-routing.js.map