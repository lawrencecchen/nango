import bodyParser from 'body-parser';
import multer from 'multer';
import oauthController from './controllers/oauth.controller.js.js';
import configController from './controllers/config.controller.js.js';
import providerController from './controllers/provider.controller.js.js';
import connectionController from './controllers/connection.controller.js.js';
import authController from './controllers/auth.controller.js.js';
import unAuthController from './controllers/unauth.controller.js.js';
import appStoreAuthController from './controllers/appStoreAuth.controller.js.js';
import authMiddleware from './middleware/access.middleware.js.js';
import userController from './controllers/user.controller.js.js';
import proxyController from './controllers/proxy.controller.js.js';
import activityController from './controllers/activity.controller.js.js';
import syncController from './controllers/sync.controller.js.js';
import flowController from './controllers/flow.controller.js.js';
import apiAuthController from './controllers/apiAuth.controller.js.js';
import appAuthController from './controllers/appAuth.controller.js.js';
import onboardingController from './controllers/onboarding.controller.js.js';
import webhookController from './controllers/webhook.controller.js.js';
import { rateLimiterMiddleware } from './middleware/ratelimit.middleware.js.js';
import { authCheck } from './middleware/resource-capping.middleware.js.js';
import path from 'path';
import { dirname } from './utils/utils.js.js';
import express from 'express';
import cors from 'cors';
import { setupAuth } from './clients/auth.client.js.js';
import passport from 'passport';
import environmentController from './controllers/environment.controller.js.js';
import accountController from './controllers/account.controller.js.js';
import type { Response, Request } from 'express';
import { isCloud, isEnterprise, AUTH_ENABLED, MANAGED_AUTH_ENABLED, isBasicAuthEnabled, isTest } from '@nangohq/utils';
import { errorManager } from '@nangohq/shared';
import tracer from 'dd-trace';
import { getConnection as getConnectionWeb } from './controllers/v1/connection/get.js.js';
import { searchOperations } from './controllers/v1/logs/searchOperations.js.js';
import { getOperation } from './controllers/v1/logs/getOperation.js.js';
import { patchSettings } from './controllers/v1/environment/webhook/patchSettings.js.js';
import { updatePrimaryUrl } from './controllers/v1/environment/webhook/updatePrimaryUrl.js.js';
import { updateSecondaryUrl } from './controllers/v1/environment/webhook/updateSecondaryUrl.js.js';
import {
    getEmailByUuid,
    resendVerificationEmailByUuid,
    resendVerificationEmailByEmail,
    signup,
    signupWithToken,
    signin,
    validateEmailAndLogin,
    getEmailByExpiredToken
} from './controllers/v1/account/index.js';
import { searchMessages } from './controllers/v1/logs/searchMessages.js.js';
import { setMetadata } from './controllers/connection/setMetadata.js.js';
import { updateMetadata } from './controllers/connection/updateMetadata.js.js';
import type { ApiError } from '@nangohq/types';
import { searchFilters } from './controllers/v1/logs/searchFilters.js.js';

export const router = express.Router();

const apiAuth = [authMiddleware.secretKeyAuth.bind(authMiddleware), rateLimiterMiddleware];
const adminAuth = [authMiddleware.secretKeyAuth.bind(authMiddleware), authMiddleware.adminKeyAuth.bind(authMiddleware), rateLimiterMiddleware];
const apiPublicAuth = [authMiddleware.publicKeyAuth.bind(authMiddleware), authCheck, rateLimiterMiddleware];
let webAuth = AUTH_ENABLED
    ? [passport.authenticate('session'), authMiddleware.sessionAuth.bind(authMiddleware), rateLimiterMiddleware]
    : isBasicAuthEnabled
      ? [passport.authenticate('basic', { session: false }), authMiddleware.basicAuth.bind(authMiddleware), rateLimiterMiddleware]
      : [authMiddleware.noAuth.bind(authMiddleware), rateLimiterMiddleware];

// For integration test, we want to bypass session auth
if (isTest) {
    webAuth = apiAuth;
}

router.use(
    express.json({
        limit: '75mb',
        verify: (req: Request, _, buf) => {
            req.rawBody = buf.toString();
        }
    })
);
router.use(bodyParser.raw({ type: 'text/xml' }));
router.use(cors());
router.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// API routes (no/public auth).
router.get('/health', (_, res) => {
    res.status(200).send({ result: 'ok' });
});

router.route('/oauth/callback').get(oauthController.oauthCallback.bind(oauthController));
router.route('/webhook/:environmentUuid/:providerConfigKey').post(webhookController.receive.bind(proxyController));
router.route('/app-auth/connect').get(appAuthController.connect.bind(appAuthController));
router.route('/oauth/connect/:providerConfigKey').get(apiPublicAuth, oauthController.oauthRequest.bind(oauthController));
router.route('/oauth2/auth/:providerConfigKey').post(apiPublicAuth, oauthController.oauth2RequestCC.bind(oauthController));
router.route('/api-auth/api-key/:providerConfigKey').post(apiPublicAuth, apiAuthController.apiKey.bind(apiAuthController));
router.route('/api-auth/basic/:providerConfigKey').post(apiPublicAuth, apiAuthController.basic.bind(apiAuthController));
router.route('/app-store-auth/:providerConfigKey').post(apiPublicAuth, appStoreAuthController.auth.bind(appStoreAuthController));
router.route('/unauth/:providerConfigKey').post(apiPublicAuth, unAuthController.create.bind(unAuthController));

// API Admin routes
router.route('/admin/flow/deploy/pre-built').post(adminAuth, flowController.adminDeployPrivateFlow.bind(flowController));
router.route('/admin/customer').patch(adminAuth, accountController.editCustomer.bind(accountController));

// API routes (API key auth).
router.route('/provider').get(apiAuth, providerController.listProviders.bind(providerController));
router.route('/provider/:provider').get(apiAuth, providerController.getProvider.bind(providerController));
router.route('/config').get(apiAuth, configController.listProviderConfigs.bind(configController));
router.route('/config/:providerConfigKey').get(apiAuth, configController.getProviderConfig.bind(configController));
router.route('/config').post(apiAuth, configController.createProviderConfig.bind(configController));
router.route('/config').put(apiAuth, configController.editProviderConfig.bind(configController));
router.route('/config/:providerConfigKey').delete(apiAuth, configController.deleteProviderConfig.bind(configController));
router.route('/connection/:connectionId').get(apiAuth, connectionController.getConnectionCreds.bind(connectionController));
router.route('/connection').get(apiAuth, connectionController.listConnections.bind(connectionController));
router.route('/connection/:connectionId').delete(apiAuth, connectionController.deleteConnection.bind(connectionController));
router.route('/connection/:connectionId/metadata').post(apiAuth, connectionController.setMetadataLegacy.bind(connectionController));
router.route('/connection/:connectionId/metadata').patch(apiAuth, connectionController.updateMetadataLegacy.bind(connectionController));
router.route('/connection/metadata').post(apiAuth, setMetadata);
router.route('/connection/metadata').patch(apiAuth, updateMetadata);
router.route('/connection').post(apiAuth, connectionController.createConnection.bind(connectionController));
router.route('/environment-variables').get(apiAuth, environmentController.getEnvironmentVariables.bind(connectionController));
router.route('/sync/deploy').post(apiAuth, syncController.deploySync.bind(syncController));
router.route('/sync/deploy/confirmation').post(apiAuth, syncController.confirmation.bind(syncController));
router.route('/sync/update-connection-frequency').put(apiAuth, syncController.updateFrequencyForConnection.bind(syncController));
router.route('/records').get(apiAuth, syncController.getAllRecords.bind(syncController));
router.route('/sync/trigger').post(apiAuth, syncController.trigger.bind(syncController));
router.route('/sync/pause').post(apiAuth, syncController.pause.bind(syncController));
router.route('/sync/start').post(apiAuth, syncController.start.bind(syncController));
router.route('/sync/provider').get(apiAuth, syncController.getSyncProvider.bind(syncController));
router.route('/sync/status').get(apiAuth, syncController.getSyncStatus.bind(syncController));
router.route('/sync/:syncId').delete(apiAuth, syncController.deleteSync.bind(syncController));
router.route('/flow/attributes').get(apiAuth, syncController.getFlowAttributes.bind(syncController));
router.route('/flow/configs').get(apiAuth, flowController.getFlowConfig.bind(flowController));
router.route('/scripts/config').get(apiAuth, flowController.getFlowConfig.bind(flowController));
router.route('/action/trigger').post(apiAuth, syncController.triggerAction.bind(syncController)); //TODO: to deprecate

router.route('/v1/*').all(apiAuth, syncController.actionOrModel.bind(syncController));

router.route('/proxy/*').all(apiAuth, upload.any(), proxyController.routeCall.bind(proxyController));

// Webapp routes (session auth).
const web = express.Router();
setupAuth(web);

// Webapp routes (no auth).
if (AUTH_ENABLED) {
    web.route('/api/v1/account/signup').post(rateLimiterMiddleware, signup);
    web.route('/api/v1/account/signup/token').post(rateLimiterMiddleware, signupWithToken);
    web.route('/api/v1/account/signup/invite').get(rateLimiterMiddleware, authController.invitation.bind(authController));
    web.route('/api/v1/account/logout').post(rateLimiterMiddleware, authController.logout.bind(authController));
    web.route('/api/v1/account/signin').post(rateLimiterMiddleware, passport.authenticate('local'), signin);
    web.route('/api/v1/account/forgot-password').put(rateLimiterMiddleware, authController.forgotPassword.bind(authController));
    web.route('/api/v1/account/reset-password').put(rateLimiterMiddleware, authController.resetPassword.bind(authController));
    web.route('/api/v1/account/resend-verification-email/by-uuid').post(rateLimiterMiddleware, resendVerificationEmailByUuid);
    web.route('/api/v1/account/resend-verification-email/by-email').post(rateLimiterMiddleware, resendVerificationEmailByEmail);
    web.route('/api/v1/account/email/:uuid').get(rateLimiterMiddleware, getEmailByUuid);
    web.route('/api/v1/account/email/expired-token/:token').get(rateLimiterMiddleware, getEmailByExpiredToken);
    web.route('/api/v1/account/verify/code').post(rateLimiterMiddleware, validateEmailAndLogin);
}

if (MANAGED_AUTH_ENABLED) {
    web.route('/api/v1/managed/signup').post(rateLimiterMiddleware, authController.getManagedLogin.bind(authController));
    web.route('/api/v1/managed/signup/:token').post(rateLimiterMiddleware, authController.getManagedLoginWithInvite.bind(authController));
    web.route('/api/v1/login/callback').get(rateLimiterMiddleware, authController.loginCallback.bind(authController));
}

web.route('/api/v1/meta').get(webAuth, environmentController.meta.bind(environmentController));
web.route('/api/v1/account').get(webAuth, accountController.getAccount.bind(accountController));
web.route('/api/v1/account').put(webAuth, accountController.editAccount.bind(accountController));
web.route('/api/v1/account/admin/switch').post(webAuth, accountController.switchAccount.bind(accountController));

web.route('/api/v1/environment').get(webAuth, environmentController.getEnvironment.bind(environmentController));
web.route('/api/v1/environment/callback').post(webAuth, environmentController.updateCallback.bind(environmentController));
web.route('/api/v1/environment/webhook/primary-url').patch(webAuth, updatePrimaryUrl);
web.route('/api/v1/environment/webhook/secondary-url').patch(webAuth, updateSecondaryUrl);
web.route('/api/v1/environment/hmac').get(webAuth, environmentController.getHmacDigest.bind(environmentController));
web.route('/api/v1/environment/hmac-enabled').post(webAuth, environmentController.updateHmacEnabled.bind(environmentController));
web.route('/api/v1/environment/slack-notifications-enabled').post(webAuth, environmentController.updateSlackNotificationsEnabled.bind(environmentController));
web.route('/api/v1/environment/hmac-key').post(webAuth, environmentController.updateHmacKey.bind(environmentController));
web.route('/api/v1/environment/environment-variables').post(webAuth, environmentController.updateEnvironmentVariables.bind(environmentController));
web.route('/api/v1/environment/rotate-key').post(webAuth, environmentController.rotateKey.bind(accountController));
web.route('/api/v1/environment/revert-key').post(webAuth, environmentController.revertKey.bind(accountController));
web.route('/api/v1/environment/webhook/settings').patch(webAuth, patchSettings);
web.route('/api/v1/environment/activate-key').post(webAuth, environmentController.activateKey.bind(accountController));
web.route('/api/v1/environment/admin-auth').get(webAuth, environmentController.getAdminAuthInfo.bind(environmentController));

web.route('/api/v1/integration').get(webAuth, configController.listProviderConfigsWeb.bind(configController));
web.route('/api/v1/integration/:providerConfigKey').get(webAuth, configController.getProviderConfig.bind(configController));
web.route('/api/v1/integration').put(webAuth, configController.editProviderConfigWeb.bind(connectionController));
web.route('/api/v1/integration/name').put(webAuth, configController.editProviderConfigName.bind(connectionController));
web.route('/api/v1/integration').post(webAuth, configController.createProviderConfig.bind(configController));
web.route('/api/v1/integration/new').post(webAuth, configController.createEmptyProviderConfig.bind(configController));
web.route('/api/v1/integration/:providerConfigKey').delete(webAuth, configController.deleteProviderConfig.bind(connectionController));
web.route('/api/v1/integration/:providerConfigKey/connections').get(webAuth, configController.getConnections.bind(connectionController));

web.route('/api/v1/provider').get(configController.listProvidersFromYaml.bind(configController));

web.route('/api/v1/connection').get(webAuth, connectionController.listConnections.bind(connectionController));
web.route('/api/v1/connection/:connectionId').get(webAuth, getConnectionWeb);
web.route('/api/v1/connection/:connectionId').delete(webAuth, connectionController.deleteConnection.bind(connectionController));
web.route('/api/v1/connection/admin/:connectionId').delete(webAuth, connectionController.deleteAdminConnection.bind(connectionController));

web.route('/api/v1/user').get(webAuth, userController.getUser.bind(userController));
web.route('/api/v1/user/name').put(webAuth, userController.editName.bind(userController));
web.route('/api/v1/user/password').put(webAuth, userController.editPassword.bind(userController));
web.route('/api/v1/users/:userId/suspend').post(webAuth, userController.suspend.bind(userController));
web.route('/api/v1/users/invite').post(webAuth, userController.invite.bind(userController));

web.route('/api/v1/activity').get(webAuth, activityController.retrieve.bind(activityController));
web.route('/api/v1/activity-messages').get(webAuth, activityController.getMessages.bind(activityController));
web.route('/api/v1/activity-filters').get(webAuth, activityController.getPossibleFilters.bind(activityController));

web.route('/api/v1/sync').get(webAuth, syncController.getSyncsByParams.bind(syncController));
web.route('/api/v1/sync/command').post(webAuth, syncController.syncCommand.bind(syncController));
web.route('/api/v1/syncs').get(webAuth, syncController.getSyncs.bind(syncController));
web.route('/api/v1/sync/:syncId/frequency').put(webAuth, syncController.updateFrequency.bind(syncController));
web.route('/api/v1/flows').get(webAuth, flowController.getFlows.bind(syncController));
web.route('/api/v1/flow/deploy/pre-built').post(webAuth, flowController.deployPreBuiltFlow.bind(flowController));
web.route('/api/v1/flow/download').post(webAuth, flowController.downloadFlow.bind(flowController));
web.route('/api/v1/flow/:id/disable').patch(webAuth, flowController.disableFlow.bind(flowController));
web.route('/api/v1/flow/:id/enable').patch(webAuth, flowController.enableFlow.bind(flowController));
web.route('/api/v1/flow/:flowName').get(webAuth, flowController.getFlow.bind(syncController));

web.route('/api/v1/onboarding').get(webAuth, onboardingController.status.bind(onboardingController));
web.route('/api/v1/onboarding').post(webAuth, onboardingController.create.bind(onboardingController));
web.route('/api/v1/onboarding').put(webAuth, onboardingController.updateStatus.bind(onboardingController));
web.route('/api/v1/onboarding/deploy').post(webAuth, onboardingController.deploy.bind(onboardingController));
web.route('/api/v1/onboarding/sync-status').post(webAuth, onboardingController.checkSyncCompletion.bind(onboardingController));
web.route('/api/v1/onboarding/action').post(webAuth, onboardingController.writeGithubIssue.bind(onboardingController));

web.route('/api/v1/logs/operations').post(webAuth, searchOperations);
web.route('/api/v1/logs/messages').post(webAuth, searchMessages);
web.route('/api/v1/logs/filters').post(webAuth, searchFilters);
web.route('/api/v1/logs/operations/:operationId').get(webAuth, getOperation);

// Hosted signin
if (!isCloud && !isEnterprise) {
    web.route('/api/v1/basic').get(webAuth, (_: Request, res: Response) => {
        res.status(200).send();
    });
}

// -------
// 404
web.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: { code: 'not_found' } });
});

router.use(web);

// -------
// Webapp assets, static files and build.
const webappBuildPath = '../../../webapp/build';
const staticSite = express.Router();
staticSite.use('/assets', express.static(path.join(dirname(), webappBuildPath), { immutable: true, maxAge: '1y' }));
staticSite.use(express.static(path.join(dirname(), webappBuildPath), { setHeaders: () => ({ 'Cache-Control': 'no-cache, private' }) }));
staticSite.get('*', (_, res) => {
    const fp = path.join(dirname(), webappBuildPath, 'index.html');
    res.sendFile(fp, { headers: { 'Cache-Control': 'no-cache, private' } });
});
router.use(staticSite);

// -------
// Error handling.
router.use((err: any, req: Request, res: Response<ApiError<'invalid_json'>>, _: any) => {
    if (err instanceof SyntaxError && 'body' in err && 'type' in err && err.type === 'entity.parse.failed') {
        res.status(400).send({ error: { code: 'invalid_json', message: err.message } });
        return;
    }

    errorManager.handleGenericError(err, req, res, tracer);
});
