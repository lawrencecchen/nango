var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isCloud, baseUrl } from '@nangohq/utils';
import { accountService, hmacService, environmentService, connectionService, errorManager, getWebsocketsPath, getOauthCallbackUrl, getGlobalWebhookReceiveUrl, getOnboardingProgress, userService, generateSlackConnectionId, externalWebhookService, NANGO_VERSION } from '@nangohq/shared';
import { NANGO_ADMIN_UUID } from './account.controller.js';
class EnvironmentController {
    meta(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionUser = req.user;
                if (!sessionUser) {
                    errorManager.errRes(res, 'user_not_found');
                    return;
                }
                const user = yield userService.getUserById(sessionUser.id);
                if (!user) {
                    errorManager.errRes(res, 'user_not_found');
                    return;
                }
                const environments = yield environmentService.getEnvironmentsByAccountId(user.account_id);
                const onboarding = yield getOnboardingProgress(sessionUser.id);
                res.status(200).send({
                    environments,
                    version: NANGO_VERSION,
                    email: sessionUser.email,
                    baseUrl,
                    debugMode: req.session.debugMode === true,
                    onboardingComplete: (onboarding === null || onboarding === void 0 ? void 0 : onboarding.complete) || false
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    getEnvironment(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment, account, user } = res.locals;
                if (!isCloud) {
                    environment.websockets_path = getWebsocketsPath();
                    if (process.env[`NANGO_SECRET_KEY_${environment.name.toUpperCase()}`]) {
                        environment.secret_key = process.env[`NANGO_SECRET_KEY_${environment.name.toUpperCase()}`];
                        environment.secret_key_rotatable = false;
                    }
                    if (process.env[`NANGO_PUBLIC_KEY_${environment.name.toUpperCase()}`]) {
                        environment.public_key = process.env[`NANGO_PUBLIC_KEY_${environment.name.toUpperCase()}`];
                        environment.public_key_rotatable = false;
                    }
                }
                environment.callback_url = yield getOauthCallbackUrl(environment.id);
                const webhookBaseUrl = getGlobalWebhookReceiveUrl();
                environment.webhook_receive_url = `${webhookBaseUrl}/${environment.uuid}`;
                let slack_notifications_channel = '';
                if (environment.slack_notifications) {
                    const connectionId = generateSlackConnectionId(account.uuid, environment.name);
                    const integration_key = process.env['NANGO_SLACK_INTEGRATION_KEY'] || 'slack';
                    const nangoAdminUUID = NANGO_ADMIN_UUID;
                    const env = 'prod';
                    const info = yield accountService.getAccountAndEnvironmentIdByUUID(nangoAdminUUID, env);
                    if (info) {
                        const connectionConfig = yield connectionService.getConnectionConfig({
                            provider_config_key: integration_key,
                            environment_id: info.environmentId,
                            connection_id: connectionId
                        });
                        if (connectionConfig && connectionConfig['incoming_webhook.channel']) {
                            slack_notifications_channel = connectionConfig['incoming_webhook.channel'];
                        }
                    }
                }
                const environmentVariables = yield environmentService.getEnvironmentVariables(environment.id);
                const webhookSettings = yield externalWebhookService.get(environment.id);
                res.status(200).send({
                    environmentAndAccount: {
                        environment,
                        env_variables: environmentVariables,
                        webhook_settings: webhookSettings,
                        host: baseUrl,
                        uuid: account.uuid,
                        email: user.email,
                        slack_notifications_channel
                    }
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    getHmacDigest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                const { provider_config_key: providerConfigKey, connection_id: connectionId } = req.query;
                if (!providerConfigKey) {
                    errorManager.errRes(res, 'missing_provider_config_key');
                    return;
                }
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
                }
                if (environment.hmac_enabled && environment.hmac_key) {
                    const digest = yield hmacService.digest(environment.id, providerConfigKey, connectionId);
                    res.status(200).send({ hmac_digest: digest });
                }
                else {
                    res.status(200).send({ hmac_digest: null });
                }
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAdminAuthInfo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { connection_id: connectionId } = req.query;
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
                }
                const integration_key = process.env['NANGO_SLACK_INTEGRATION_KEY'] || 'slack';
                const nangoAdminUUID = NANGO_ADMIN_UUID;
                const env = 'prod';
                const info = yield accountService.getAccountAndEnvironmentIdByUUID(nangoAdminUUID, env);
                if (!info) {
                    errorManager.errRes(res, 'account_not_found');
                    return;
                }
                const digest = yield hmacService.digest(info.environmentId, integration_key, connectionId);
                const environment = yield environmentService.getById(info.environmentId);
                if (!environment) {
                    errorManager.errRes(res, 'account_not_found');
                    return;
                }
                res.status(200).send({ hmac_digest: digest, public_key: environment.public_key, integration_key });
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateCallback(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.body == null) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                if (req.body['callback_url'] == null) {
                    errorManager.errRes(res, 'missing_callback_url');
                    return;
                }
                const { environment } = res.locals;
                yield environmentService.editCallbackUrl(req.body['callback_url'], environment.id);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateHmacEnabled(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                const { environment } = res.locals;
                yield environmentService.editHmacEnabled(req.body['hmac_enabled'], environment.id);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateSlackNotificationsEnabled(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                const { environment } = res.locals;
                yield environmentService.editSlackNotifications(req.body['slack_notifications'], environment.id);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateHmacKey(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                const { environment } = res.locals;
                yield environmentService.editHmacKey(req.body['hmac_key'], environment.id);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    getEnvironmentVariables(_req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const environmentVariables = yield environmentService.getEnvironmentVariables(environmentId);
                if (!environmentVariables) {
                    res.status(200).send([]);
                    return;
                }
                const envs = environmentVariables.map((env) => {
                    return {
                        name: env.name,
                        value: env.value
                    };
                });
                res.status(200).send(envs);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateEnvironmentVariables(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                const { environment } = res.locals;
                yield environmentService.editEnvironmentVariable(environment.id, req.body);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    rotateKey(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body.type) {
                    res.status(400).send({ error: 'The type of key to rotate is required' });
                    return;
                }
                const { environment } = res.locals;
                const newKey = yield environmentService.rotateKey(environment.id, req.body.type);
                res.status(200).send({ key: newKey });
            }
            catch (err) {
                next(err);
            }
        });
    }
    revertKey(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body.type) {
                    res.status(400).send({ error: 'The type of key to rotate is required' });
                    return;
                }
                const { environment } = res.locals;
                const newKey = yield environmentService.revertKey(environment.id, req.body.type);
                res.status(200).send({ key: newKey });
            }
            catch (err) {
                next(err);
            }
        });
    }
    activateKey(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body.type) {
                    res.status(400).send({ error: 'The type of key to activate is required' });
                    return;
                }
                const { environment } = res.locals;
                yield environmentService.activateKey(environment.id, req.body.type);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
}
export default new EnvironmentController();
//# sourceMappingURL=environment.controller.js.map