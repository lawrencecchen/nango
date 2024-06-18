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
const logger = getLogger('Webook.GithubApp');
function validate(integration, headerSignature, body) {
    const hash = `${integration.oauth_client_id}${integration.oauth_client_secret}${integration.app_link}`;
    const secret = crypto.createHash('sha256').update(hash).digest('hex');
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    const untrusted = Buffer.from(headerSignature, 'ascii');
    return crypto.timingSafeEqual(trusted, untrusted);
}
const route = (nango, integration, headers, body, _rawBody, logContextGetter) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = headers['x-hub-signature-256'];
    if (signature) {
        logger.info('Signature found, verifying...');
        const valid = validate(integration, signature, body);
        if (!valid) {
            logger.error('Github App webhook signature invalid');
            return;
        }
    }
    return nango.executeScriptForWebhooks(integration, body, 'action', 'installation.id', logContextGetter, 'installation_id');
});
export default route;
//# sourceMappingURL=github-app-webhook-routing.js.map