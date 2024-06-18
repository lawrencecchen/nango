var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getLogger } from '@nangohq/utils';
import crypto from 'crypto';
const logger = getLogger('Webhook.Hubspot');
export function validate(integration, headers, body) {
    const signature = headers['x-hubspot-signature'];
    const combinedSignature = `${integration.oauth_client_secret}${JSON.stringify(body)}`;
    const createdHash = crypto.createHash('sha256').update(combinedSignature).digest('hex');
    const bufferLength = Math.max(Buffer.from(signature, 'hex').length, Buffer.from(createdHash, 'hex').length);
    const signatureBuffer = Buffer.alloc(bufferLength, signature, 'hex');
    const hashBuffer = Buffer.alloc(bufferLength, createdHash, 'hex');
    return crypto.timingSafeEqual(signatureBuffer, hashBuffer);
}
const route = (nango, integration, headers, body, _rawBody, logContextGetter) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const valid = validate(integration, headers, body);
    if (!valid) {
        logger.error('webhook signature invalid');
        return;
    }
    if (Array.isArray(body)) {
        const groupedByObjectId = body.reduce((acc, event) => {
            (acc[event.objectId] = acc[event.objectId] || []).push(event);
            return acc;
        }, {});
        let connectionIds = [];
        for (const objectId in groupedByObjectId) {
            const sorted = groupedByObjectId[objectId].sort((a, b) => {
                const aIsCreation = a.subscriptionType.endsWith('.creation') ? 1 : 0;
                const bIsCreation = b.subscriptionType.endsWith('.creation') ? 1 : 0;
                return bIsCreation - aIsCreation || a.occurredAt - b.occurredAt;
            });
            for (const event of sorted) {
                const response = yield nango.executeScriptForWebhooks(integration, event, 'subscriptionType', 'portalId', logContextGetter);
                if (response && ((_a = response.connectionIds) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                    connectionIds = connectionIds.concat(response.connectionIds);
                }
            }
        }
        return { connectionIds };
    }
    else {
        return nango.executeScriptForWebhooks(integration, body, 'subscriptionType', 'portalId', logContextGetter);
    }
});
export default route;
//# sourceMappingURL=hubspot-webhook-routing.js.map