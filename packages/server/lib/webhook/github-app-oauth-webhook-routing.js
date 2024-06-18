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
import { environmentService, connectionService, configService } from '@nangohq/shared';
import { getLogger } from '@nangohq/utils';
import crypto from 'crypto';
import { connectionCreated as connectionCreatedHook } from '../hooks/hooks.js';
const logger = getLogger('Webhook.GithubAppOauth');
function validate(integration, headerSignature, body) {
    const custom = integration.custom;
    const private_key = custom['private_key'];
    const hash = `${custom['app_id']}${private_key}${integration.app_link}`;
    const secret = crypto.createHash('sha256').update(hash).digest('hex');
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    const untrusted = Buffer.from(headerSignature, 'ascii');
    return crypto.timingSafeEqual(trusted, untrusted);
}
const route = (nango, integration, headers, body, _rawBody, logContextGetter) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = headers['x-hub-signature-256'];
    if (signature) {
        const valid = validate(integration, signature, body);
        if (!valid) {
            logger.error('Github App webhook signature invalid. Exiting');
            return;
        }
    }
    if (get(body, 'action') === 'created') {
        yield handleCreateWebhook(integration, body, logContextGetter);
    }
    return nango.executeScriptForWebhooks(integration, body, 'action', 'installation.id', logContextGetter, 'installation_id');
});
function handleCreateWebhook(integration, body, logContextGetter) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!get(body, 'requester.login')) {
            return;
        }
        const connections = yield connectionService.findConnectionsByMultipleConnectionConfigValues({ app_id: get(body, 'installation.app_id'), pending: true, handle: get(body, 'requester.login') }, integration.environment_id);
        if ((connections === null || connections === void 0 ? void 0 : connections.length) === 0) {
            logger.info('No connections found for app_id', get(body, 'installation.app_id'));
            return;
        }
        else {
            const environmentAndAccountLookup = yield environmentService.getAccountAndEnvironment({ environmentId: integration.environment_id });
            if (!environmentAndAccountLookup) {
                logger.error('Environment or account not found');
                return;
            }
            const { environment, account } = environmentAndAccountLookup;
            const installationId = get(body, 'installation.id');
            const [connection] = connections;
            // if there is no matching connection or if the connection config already has an installation_id, exit
            if (!connection || connection.connection_config['installation_id']) {
                logger.info('no connection or existing installation_id');
                return;
            }
            const template = configService.getTemplate(integration.provider);
            const activityLogId = connection.connection_config['pendingLog'];
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete connection.connection_config['pendingLog'];
            const connectionConfig = Object.assign(Object.assign({}, connection.connection_config), { installation_id: installationId });
            const logCtx = yield logContextGetter.get({ id: activityLogId });
            const connCreatedHook = (res) => __awaiter(this, void 0, void 0, function* () {
                void connectionCreatedHook({
                    connection: res.connection,
                    environment,
                    account,
                    auth_mode: 'APP',
                    operation: res.operation
                }, integration.provider, logContextGetter, activityLogId, { initiateSync: true, runPostConnectionScript: false }, logCtx);
            });
            yield connectionService.getAppCredentialsAndFinishConnection(connection.connection_id, integration, template, connectionConfig, activityLogId, logCtx, connCreatedHook);
            yield logCtx.success();
        }
    });
}
export default route;
//# sourceMappingURL=github-app-oauth-webhook-routing.js.map