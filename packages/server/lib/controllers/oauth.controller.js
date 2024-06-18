var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as crypto from 'node:crypto';
import * as uuid from 'uuid';
import simpleOauth2 from 'simple-oauth2';
import { getConnectionConfig, interpolateStringFromObject, getOauthCallbackUrl, getGlobalAppCallbackUrl, createActivityLog, createActivityLogMessageAndEnd, createActivityLogMessage, updateProvider as updateProviderActivityLog, updateSuccess as updateSuccessActivityLog, updateProviderConfigAndConnectionId as updateProviderConfigAndConnectionIdActivityLog, addEndTime as addEndTimeActivityLog, LogActionEnum, configService, connectionService, environmentService, oauth2Client, providerClientManager, errorManager, analytics, telemetry, LogTypes, AnalyticsTypes, hmacService, ErrorSourceEnum } from '@nangohq/shared';
import { defaultOperationExpiration, logContextGetter } from '@nangohq/logs';
import { errorToObject, stringifyError } from '@nangohq/utils';
import publisher from '../clients/publisher.client.js';
import * as WSErrBuilder from '../utils/web-socket-error.js';
import oAuthSessionService from '../services/oauth-session.service.js';
import { getAdditionalAuthorizationParams, getConnectionMetadataFromCallbackRequest, missesInterpolationParam, getConnectionMetadataFromTokenResponse } from '../utils/utils.js';
import { OAuth1Client } from '../clients/oauth1.client.js';
import { connectionCreated as connectionCreatedHook, connectionCreationFailed as connectionCreationFailedHook } from '../hooks/hooks.js';
class OAuthController {
    oauthRequest(req, res, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { account, environment } = res.locals;
            const accountId = account.id;
            const environmentId = environment.id;
            const { providerConfigKey } = req.params;
            let connectionId = req.query['connection_id'];
            const wsClientId = req.query['ws_client_id'];
            const userScope = req.query['user_scope'];
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.AUTH,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                environment_id: environmentId
            };
            const activityLogId = yield createActivityLog(log);
            let logCtx;
            try {
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'auth', action: 'create_connection' },
                    message: 'Create connection via OAuth',
                    expiresAt: defaultOperationExpiration.auth()
                }, { account, environment });
                if (!wsClientId) {
                    void analytics.track(AnalyticsTypes.PRE_WS_OAUTH, accountId);
                }
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_START, 'OAuth request process start', LogActionEnum.AUTH, {
                    environmentId: String(environmentId),
                    accountId: String(accountId),
                    providerConfigKey: String(providerConfigKey),
                    connectionId: String(connectionId)
                });
                const callbackUrl = yield getOauthCallbackUrl(environmentId);
                const connectionConfig = req.query['params'] != null ? getConnectionConfig(req.query['params']) : {};
                const authorizationParams = req.query['authorization_params'] != null ? getAdditionalAuthorizationParams(req.query['authorization_params']) : {};
                const overrideCredentials = req.query['credentials'] != null ? getAdditionalAuthorizationParams(req.query['credentials']) : {};
                if (connectionId == null) {
                    const error = WSErrBuilder.MissingConnectionId();
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: error.message
                    });
                    yield logCtx.error(error.message);
                    yield logCtx.failed();
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                else if (providerConfigKey == null) {
                    const error = WSErrBuilder.MissingProviderConfigKey();
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: error.message
                    });
                    yield logCtx.error(error.message);
                    yield logCtx.failed();
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                connectionId = connectionId.toString();
                const hmacEnabled = yield hmacService.isEnabled(environmentId);
                if (hmacEnabled) {
                    const hmac = req.query['hmac'];
                    if (!hmac) {
                        const error = WSErrBuilder.MissingHmac();
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: error.message
                        });
                        yield logCtx.error(error.message);
                        yield logCtx.failed();
                        return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                    }
                    const verified = yield hmacService.verify(hmac, environmentId, providerConfigKey, connectionId);
                    if (!verified) {
                        const error = WSErrBuilder.InvalidHmac();
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: error.message
                        });
                        yield logCtx.error(error.message);
                        yield logCtx.failed();
                        return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                    }
                }
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environmentId,
                    activity_log_id: activityLogId,
                    content: 'Authorization URL request from the client',
                    timestamp: Date.now(),
                    url: callbackUrl,
                    params: Object.assign(Object.assign({}, connectionConfig), { hmacEnabled })
                });
                yield logCtx.info('Authorization URL request from the client');
                const config = yield configService.getProviderConfig(providerConfigKey, environmentId);
                if (config == null) {
                    const error = WSErrBuilder.UnknownProviderConfigKey(providerConfigKey);
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        url: callbackUrl
                    });
                    yield logCtx.error(error.message);
                    yield logCtx.failed();
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                yield updateProviderActivityLog(activityLogId, String(config.provider));
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                let template;
                try {
                    template = configService.getTemplate(config.provider);
                }
                catch (_a) {
                    const error = WSErrBuilder.UnknownProviderTemplate(config.provider);
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        url: callbackUrl
                    });
                    yield logCtx.error(error.message);
                    yield logCtx.failed();
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                const session = {
                    providerConfigKey: providerConfigKey,
                    provider: config.provider,
                    connectionId: connectionId,
                    callbackUrl: callbackUrl,
                    authMode: template.auth_mode,
                    codeVerifier: crypto.randomBytes(24).toString('hex'),
                    id: uuid.v1(),
                    connectionConfig,
                    environmentId,
                    webSocketClientId: wsClientId,
                    activityLogId: String(activityLogId)
                };
                if (userScope) {
                    session.connectionConfig['user_scope'] = userScope;
                }
                // certain providers need the credentials to be specified in the config
                if (overrideCredentials && (overrideCredentials['oauth_client_id_override'] || overrideCredentials['oauth_client_secret_override'])) {
                    if (overrideCredentials['oauth_client_id_override']) {
                        config.oauth_client_id = overrideCredentials['oauth_client_id_override'];
                        session.connectionConfig = Object.assign(Object.assign({}, session.connectionConfig), { oauth_client_id_override: config.oauth_client_id });
                    }
                    if (overrideCredentials['oauth_client_secret_override']) {
                        config.oauth_client_secret = overrideCredentials['oauth_client_secret_override'];
                        session.connectionConfig = Object.assign(Object.assign({}, session.connectionConfig), { oauth_client_secret_override: config.oauth_client_secret });
                    }
                    const obfuscatedClientSecret = config.oauth_client_secret ? config.oauth_client_secret.slice(0, 4) + '***' : '';
                    yield createActivityLogMessage({
                        level: 'info',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content: 'Credentials override',
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: callbackUrl,
                        params: {
                            oauth_client_id: config.oauth_client_id,
                            oauth_client_secret: obfuscatedClientSecret
                        }
                    });
                    yield logCtx.info('Credentials override', {
                        oauth_client_id: config.oauth_client_id,
                        oauth_client_secret: obfuscatedClientSecret
                    });
                }
                if (connectionConfig['oauth_scopes_override']) {
                    config.oauth_scopes = connectionConfig['oauth_scopes_override'];
                }
                if (template.auth_mode !== 'APP' && (config.oauth_client_id == null || config.oauth_client_secret == null)) {
                    const error = WSErrBuilder.InvalidProviderConfig(providerConfigKey);
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: callbackUrl
                    });
                    yield logCtx.error(error.message);
                    yield logCtx.failed();
                    return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
                }
                if (template.auth_mode === 'OAUTH2') {
                    return this.oauth2Request({
                        template: template,
                        providerConfig: config,
                        session,
                        res,
                        connectionConfig,
                        authorizationParams,
                        callbackUrl,
                        activityLogId: activityLogId,
                        environment_id: environmentId,
                        userScope,
                        logCtx
                    });
                }
                else if (template.auth_mode === 'APP' || template.auth_mode === 'CUSTOM') {
                    const appCallBackUrl = getGlobalAppCallbackUrl();
                    return this.appRequest(template, config, session, res, authorizationParams, appCallBackUrl, activityLogId, environmentId, logCtx);
                }
                else if (template.auth_mode === 'OAUTH1') {
                    return this.oauth1Request(template, config, session, res, callbackUrl, activityLogId, environmentId, logCtx);
                }
                const error = WSErrBuilder.UnknownAuthMode(template.auth_mode);
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environmentId,
                    activity_log_id: activityLogId,
                    content: error.message,
                    timestamp: Date.now(),
                    url: callbackUrl
                });
                yield logCtx.error(error.message);
                yield logCtx.failed();
                return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, error);
            }
            catch (e) {
                const prettyError = stringifyError(e, { pretty: true });
                const error = WSErrBuilder.UnknownError();
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environmentId,
                    activity_log_id: activityLogId,
                    content: error.message + '\n' + prettyError,
                    timestamp: Date.now()
                });
                if (logCtx) {
                    yield logCtx.error(error.message, { error: e });
                    yield logCtx.failed();
                }
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId,
                    metadata: {
                        providerConfigKey,
                        connectionId
                    }
                });
                return publisher.notifyErr(res, wsClientId, providerConfigKey, connectionId, WSErrBuilder.UnknownError(prettyError));
            }
        });
    }
    oauth2RequestCC(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { environment, account } = res.locals;
            const { providerConfigKey } = req.params;
            const connectionId = req.query['connection_id'];
            const connectionConfig = req.query['params'] != null ? getConnectionConfig(req.query['params']) : {};
            const body = req.body;
            if (!body.client_id) {
                errorManager.errRes(res, 'missing_client_id');
                return;
            }
            if (!body.client_secret) {
                errorManager.errRes(res, 'missing_client_secret');
                return;
            }
            const { client_id, client_secret } = body;
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.AUTH,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: connectionId,
                provider_config_key: providerConfigKey,
                environment_id: environment.id
            };
            const activityLogId = yield createActivityLog(log);
            let logCtx;
            try {
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'auth', action: 'create_connection' },
                    message: 'Create connection via OAuth2 CC',
                    expiresAt: defaultOperationExpiration.auth()
                }, { account, environment });
                void analytics.track(AnalyticsTypes.PRE_OAUTH2_CC_AUTH, account.id);
                if (!providerConfigKey) {
                    errorManager.errRes(res, 'missing_connection');
                    return;
                }
                if (!connectionId) {
                    errorManager.errRes(res, 'missing_connection_id');
                    return;
                }
                const hmacEnabled = yield hmacService.isEnabled(environment.id);
                if (hmacEnabled) {
                    const hmac = req.query['hmac'];
                    if (!hmac) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Missing HMAC in query params'
                        });
                        yield logCtx.error('Missing HMAC in query params');
                        yield logCtx.failed();
                        errorManager.errRes(res, 'missing_hmac');
                        return;
                    }
                    const verified = yield hmacService.verify(hmac, environment.id, providerConfigKey, connectionId);
                    if (!verified) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Invalid HMAC'
                        });
                        yield logCtx.error('Invalid HMAC');
                        yield logCtx.failed();
                        errorManager.errRes(res, 'invalid_hmac');
                        return;
                    }
                }
                const config = yield configService.getProviderConfig(providerConfigKey, environment.id);
                if (!config) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `Error during OAuth2 client credentials: config not found`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Unknown provider config');
                    yield logCtx.failed();
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                const template = configService.getTemplate(config.provider);
                if (template.auth_mode !== 'OAUTH2_CC') {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Provider ${config.provider} does not support oauth2 client credentials creation`
                    });
                    yield logCtx.error('Provider does not support OAuth2 client credentials creation', { provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'invalid_auth_mode');
                    return;
                }
                yield updateProviderActivityLog(activityLogId, String(config.provider));
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                const { success, error, response: credentials } = yield connectionService.getOauthClientCredentials(template, client_id, client_secret);
                if (!success || !credentials) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `Error during OAuth2 client credentials creation: ${error}`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('Error during OAuth2 client credentials creation', { error, provider: config.provider });
                    yield logCtx.failed();
                    errorManager.errRes(res, 'oauth2_cc_error');
                    return;
                }
                connectionConfig['scopes'] = Array.isArray(credentials.raw['scope']) ? credentials.raw['scope'] : credentials.raw['scope'].split(' ');
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `OAuth2 client credentials connection creation was successful`,
                    timestamp: Date.now()
                });
                yield logCtx.info('OAuth2 client credentials creation was successful');
                yield logCtx.success();
                yield updateSuccessActivityLog(activityLogId, true);
                const [updatedConnection] = yield connectionService.upsertConnection(connectionId, providerConfigKey, config.provider, credentials, connectionConfig, environment.id, account.id);
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: 'NONE',
                        operation: updatedConnection.operation
                    }, config.provider, logContextGetter, activityLogId, undefined, logCtx);
                }
                res.status(200).send({ providerConfigKey: providerConfigKey, connectionId: connectionId });
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Error during OAuth2 client credentials create: ${prettyError}`,
                    timestamp: Date.now()
                });
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: 'OAUTH2_CC',
                    error: {
                        type: 'unknown',
                        description: `Error during Unauth create: ${prettyError}`
                    },
                    operation: 'unknown'
                }, 'unknown', activityLogId, logCtx);
                if (logCtx) {
                    yield logCtx.error('Error during OAuth2 client credentials creation', { error: err });
                    yield logCtx.failed();
                }
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: environment.id,
                    metadata: {
                        providerConfigKey,
                        connectionId
                    }
                });
                next(err);
            }
        });
    }
    oauth2Request({ template, providerConfig, session, res, connectionConfig, authorizationParams, callbackUrl, activityLogId, environment_id, userScope, logCtx }) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const oauth2Template = template;
            const channel = session.webSocketClientId;
            const providerConfigKey = session.providerConfigKey;
            const connectionId = session.connectionId;
            const tokenUrl = typeof template.token_url === 'string' ? template.token_url : (_a = template.token_url) === null || _a === void 0 ? void 0 : _a['OAUTH2'];
            try {
                if (missesInterpolationParam(template.authorization_url, connectionConfig)) {
                    const error = WSErrBuilder.InvalidConnectionConfig(template.authorization_url, JSON.stringify(connectionConfig));
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: callbackUrl,
                        params: Object.assign({}, connectionConfig)
                    });
                    yield logCtx.error(error.message, { connectionConfig });
                    yield logCtx.failed();
                    return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
                }
                if (missesInterpolationParam(tokenUrl, connectionConfig)) {
                    const error = WSErrBuilder.InvalidConnectionConfig(tokenUrl, JSON.stringify(connectionConfig));
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: callbackUrl,
                        params: Object.assign({}, connectionConfig)
                    });
                    yield logCtx.error(error.message, { connectionConfig });
                    yield logCtx.failed();
                    return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
                }
                if (oauth2Template.token_params == undefined ||
                    oauth2Template.token_params.grant_type == undefined ||
                    oauth2Template.token_params.grant_type == 'authorization_code') {
                    let allAuthParams = oauth2Template.authorization_params || {};
                    // We always implement PKCE, no matter whether the server requires it or not,
                    // unless it has been explicitly turned off for this template
                    if (!template.disable_pkce) {
                        const h = crypto
                            .createHash('sha256')
                            .update(session.codeVerifier)
                            .digest('base64')
                            .replace(/\+/g, '-')
                            .replace(/\//g, '_')
                            .replace(/=+$/, '');
                        allAuthParams['code_challenge'] = h;
                        allAuthParams['code_challenge_method'] = 'S256';
                    }
                    if (providerConfig.provider === 'slack' && userScope) {
                        allAuthParams['user_scope'] = userScope;
                    }
                    allAuthParams = Object.assign(Object.assign({}, allAuthParams), authorizationParams); // Auth params submitted in the request take precedence over the ones defined in the template (including if they are undefined).
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    Object.keys(allAuthParams).forEach((key) => (allAuthParams[key] === undefined ? delete allAuthParams[key] : {})); // Remove undefined values.
                    yield oAuthSessionService.create(session);
                    const simpleOAuthClient = new simpleOauth2.AuthorizationCode(oauth2Client.getSimpleOAuth2ClientConfig(providerConfig, template, connectionConfig));
                    let authorizationUri = simpleOAuthClient.authorizeURL(Object.assign({ redirect_uri: callbackUrl, scope: providerConfig.oauth_scopes ? providerConfig.oauth_scopes.split(',').join(oauth2Template.scope_separator || ' ') : '', state: session.id }, allAuthParams));
                    if (template.authorization_url_replacements) {
                        const urlReplacements = template.authorization_url_replacements || {};
                        Object.keys(template.authorization_url_replacements).forEach((key) => {
                            const replacement = urlReplacements[key];
                            if (typeof replacement === 'string') {
                                authorizationUri = authorizationUri.replace(key, replacement);
                            }
                        });
                    }
                    yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_CALLBACK_RECEIVED, 'OAuth2 callback url received', LogActionEnum.AUTH, {
                        environmentId: String(environment_id),
                        callbackUrl,
                        providerConfigKey: String(providerConfigKey),
                        provider: String(providerConfig.provider),
                        connectionId: String(connectionId),
                        authMode: String(template.auth_mode)
                    });
                    yield createActivityLogMessage({
                        level: 'info',
                        environment_id,
                        activity_log_id: activityLogId,
                        content: `Redirecting to ${authorizationUri} for ${providerConfigKey} (connection ${connectionId})`,
                        timestamp: Date.now(),
                        url: callbackUrl,
                        auth_mode: template.auth_mode,
                        params: Object.assign(Object.assign(Object.assign({}, allAuthParams), connectionConfig), { grant_type: (_b = oauth2Template.token_params) === null || _b === void 0 ? void 0 : _b.grant_type, scopes: providerConfig.oauth_scopes ? providerConfig.oauth_scopes.split(',').join(oauth2Template.scope_separator || ' ') : '', external_api_url: authorizationUri })
                    });
                    yield logCtx.info('Redirecting', {
                        authorizationUri,
                        providerConfigKey,
                        connectionId,
                        allAuthParams,
                        connectionConfig,
                        grantType: (_c = oauth2Template.token_params) === null || _c === void 0 ? void 0 : _c.grant_type,
                        scopes: providerConfig.oauth_scopes ? providerConfig.oauth_scopes.split(',').join(oauth2Template.scope_separator || ' ') : ''
                    });
                    // if they exit the flow add an end time to have it on record
                    yield addEndTimeActivityLog(activityLogId);
                    res.redirect(authorizationUri);
                }
                else {
                    const grantType = oauth2Template.token_params.grant_type;
                    const error = WSErrBuilder.UnknownGrantType(grantType);
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: callbackUrl,
                        params: Object.assign({ grant_type: grantType, basic_auth_enabled: template.token_request_auth_method === 'basic' }, connectionConfig)
                    });
                    yield logCtx.error('Redirecting', {
                        grantType,
                        basicAuthEnabled: template.token_request_auth_method === 'basic',
                        connectionConfig
                    });
                    yield logCtx.failed();
                    return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
                }
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                const error = WSErrBuilder.UnknownError();
                const content = error.message + '\n' + prettyError;
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, `OAuth2 request process failed ${content}`, LogActionEnum.AUTH, {
                    callbackUrl,
                    environmentId: String(environment_id),
                    providerConfigKey: String(providerConfigKey),
                    connectionId: String(connectionId),
                    level: 'error'
                });
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    content,
                    timestamp: Date.now(),
                    auth_mode: template.auth_mode,
                    url: callbackUrl,
                    params: Object.assign({}, connectionConfig)
                });
                yield logCtx.error(WSErrBuilder.UnknownError().message, { error, connectionConfig });
                yield logCtx.failed();
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, WSErrBuilder.UnknownError(prettyError));
            }
        });
    }
    appRequest(template, providerConfig, session, res, authorizationParams, callbackUrl, activityLogId, environment_id, logCtx) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = session.webSocketClientId;
            const providerConfigKey = session.providerConfigKey;
            const connectionId = session.connectionId;
            const connectionConfig = Object.assign(Object.assign({}, authorizationParams), { appPublicLink: providerConfig.app_link });
            session.connectionConfig = connectionConfig;
            try {
                if (missesInterpolationParam(template.authorization_url, connectionConfig)) {
                    const error = WSErrBuilder.InvalidConnectionConfig(template.authorization_url, JSON.stringify(connectionConfig));
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        content: error.message,
                        timestamp: Date.now(),
                        auth_mode: template.auth_mode,
                        url: callbackUrl,
                        params: Object.assign({}, connectionConfig)
                    });
                    yield logCtx.error(error.message, Object.assign({}, connectionConfig));
                    yield logCtx.failed();
                    return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
                }
                yield oAuthSessionService.create(session);
                const appUrl = interpolateStringFromObject(template.authorization_url, {
                    connectionConfig
                });
                const params = new URLSearchParams({
                    state: session.id
                });
                const authorizationUri = `${appUrl}?${params.toString()}`;
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id,
                    activity_log_id: activityLogId,
                    content: `Redirecting to ${authorizationUri} for ${providerConfigKey} (connection ${connectionId})`,
                    timestamp: Date.now(),
                    url: callbackUrl,
                    auth_mode: template.auth_mode,
                    params: Object.assign(Object.assign({}, connectionConfig), { external_api_url: authorizationUri })
                });
                yield logCtx.info('Redirecting', { authorizationUri, providerConfigKey, connectionId, connectionConfig });
                yield addEndTimeActivityLog(activityLogId);
                res.redirect(authorizationUri);
            }
            catch (error) {
                const prettyError = stringifyError(error, { pretty: true });
                const content = WSErrBuilder.UnknownError().message + '\n' + prettyError;
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    content,
                    timestamp: Date.now(),
                    auth_mode: template.auth_mode,
                    url: callbackUrl,
                    params: Object.assign({}, connectionConfig)
                });
                yield logCtx.error('Redirecting', { connectionConfig });
                yield logCtx.failed();
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, WSErrBuilder.UnknownError(prettyError));
            }
        });
    }
    // In OAuth 2 we are guaranteed that the state parameter will be sent back to us
    // for the entire journey. With OAuth 1.0a we have to register the callback URL
    // in a first step and will get called back there. We need to manually include the state
    // param there, otherwise we won't be able to identify the user in the callback
    oauth1Request(template, config, session, res, callbackUrl, activityLogId, environment_id, logCtx) {
        return __awaiter(this, void 0, void 0, function* () {
            const callbackParams = new URLSearchParams({
                state: session.id
            });
            const channel = session.webSocketClientId;
            const providerConfigKey = session.providerConfigKey;
            const connectionId = session.connectionId;
            const oAuth1CallbackURL = `${callbackUrl}?${callbackParams.toString()}`;
            yield createActivityLogMessage({
                level: 'info',
                environment_id,
                activity_log_id: activityLogId,
                content: `OAuth callback URL was retrieved`,
                timestamp: Date.now(),
                auth_mode: template.auth_mode,
                url: oAuth1CallbackURL
            });
            yield logCtx.info('OAuth callback URL was retrieved', { url: oAuth1CallbackURL });
            const oAuth1Client = new OAuth1Client(config, template, oAuth1CallbackURL);
            let tokenResult;
            try {
                tokenResult = yield oAuth1Client.getOAuthRequestToken();
            }
            catch (err) {
                const error = errorToObject(err);
                errorManager.report(new Error('token_retrieval_error'), {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: session.environmentId,
                    metadata: error
                });
                const userError = WSErrBuilder.TokenError();
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    content: userError.message,
                    timestamp: Date.now(),
                    auth_mode: template.auth_mode,
                    url: oAuth1CallbackURL,
                    params: Object.assign({}, error)
                });
                yield logCtx.error(userError.message, { error: err, url: oAuth1CallbackURL });
                yield logCtx.failed();
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, userError);
            }
            session.requestTokenSecret = tokenResult.request_token_secret;
            yield oAuthSessionService.create(session);
            const redirectUrl = oAuth1Client.getAuthorizationURL(tokenResult);
            yield createActivityLogMessage({
                level: 'info',
                environment_id,
                activity_log_id: activityLogId,
                content: `Request token for ${session.providerConfigKey} (connection: ${session.connectionId}) was a success. Redirecting to: ${redirectUrl}`,
                timestamp: Date.now(),
                auth_mode: template.auth_mode,
                url: oAuth1CallbackURL
            });
            yield logCtx.info('Successfully requested token. Redirecting...', {
                providerConfigKey: session.providerConfigKey,
                connectionId: session.connectionId,
                redirectUrl
            });
            // if they end the flow early, be sure to have an end time
            yield addEndTimeActivityLog(activityLogId);
            yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_CALLBACK_RECEIVED, 'OAuth1 callback url received', LogActionEnum.AUTH, {
                environmentId: String(environment_id),
                callbackUrl,
                providerConfigKey: String(providerConfigKey),
                provider: config.provider,
                connectionId: String(connectionId),
                authMode: String(template.auth_mode)
            });
            // All worked, let's redirect the user to the authorization page
            return res.redirect(redirectUrl);
        });
    }
    oauthCallback(req, res, _) {
        return __awaiter(this, void 0, void 0, function* () {
            const { state } = req.query;
            const installation_id = req.query['installation_id'];
            const action = req.query['setup_action'];
            if (!state && installation_id && action) {
                res.redirect(req.get('referer') || req.get('Referer') || req.headers.referer || 'https://github.com');
                return;
            }
            if (state == null) {
                const errorMessage = 'No state found in callback';
                const e = new Error(errorMessage);
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    metadata: errorManager.getExpressRequestContext(req)
                });
                return;
            }
            const session = yield oAuthSessionService.findById(state);
            if (session == null) {
                const errorMessage = `No session found for state: ${state}`;
                const e = new Error(errorMessage);
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    metadata: errorManager.getExpressRequestContext(req)
                });
                return;
            }
            else {
                yield oAuthSessionService.delete(state);
            }
            const activityLogId = Number(session.activityLogId);
            const logCtx = yield logContextGetter.get({ id: session.activityLogId });
            const channel = session.webSocketClientId;
            const providerConfigKey = session.providerConfigKey;
            const connectionId = session.connectionId;
            try {
                yield updateProviderConfigAndConnectionIdActivityLog(activityLogId, providerConfigKey, connectionId);
                yield createActivityLogMessage({
                    level: 'debug',
                    environment_id: session.environmentId,
                    activity_log_id: activityLogId,
                    content: `Received callback from ${session.providerConfigKey} for connection ${session.connectionId}`,
                    state: state,
                    timestamp: Date.now(),
                    url: req.originalUrl
                });
                yield logCtx.debug('Received callback', { providerConfigKey, connectionId });
                const template = configService.getTemplate(session.provider);
                const config = (yield configService.getProviderConfig(session.providerConfigKey, session.environmentId));
                yield logCtx.enrichOperation({ integrationId: config.id, integrationName: config.unique_key, providerName: config.provider });
                const environment = yield environmentService.getById(session.environmentId);
                const account = yield environmentService.getAccountFromEnvironment(session.environmentId);
                if (!environment || !account) {
                    const error = WSErrBuilder.EnvironmentOrAccountNotFound();
                    return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
                }
                if (session.authMode === 'OAUTH2' || session.authMode === 'CUSTOM') {
                    return this.oauth2Callback(template, config, session, req, res, activityLogId, environment, account, logCtx);
                }
                else if (session.authMode === 'OAUTH1') {
                    return this.oauth1Callback(template, config, session, req, res, activityLogId, environment, account, logCtx);
                }
                const error = WSErrBuilder.UnknownAuthMode(session.authMode);
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: session.environmentId,
                    activity_log_id: activityLogId,
                    content: error.message,
                    state: state,
                    timestamp: Date.now(),
                    auth_mode: session.authMode,
                    url: req.originalUrl
                });
                yield logCtx.error(error.message, { url: req.originalUrl });
                yield logCtx.failed();
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: session.environmentId,
                    metadata: errorManager.getExpressRequestContext(req)
                });
                const error = WSErrBuilder.UnknownError();
                const content = error.message + '\n' + prettyError;
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: session.environmentId,
                    activity_log_id: activityLogId,
                    content,
                    timestamp: Date.now(),
                    params: Object.assign({}, errorManager.getExpressRequestContext(req))
                });
                yield logCtx.error(error.message, { error: err, url: req.originalUrl });
                yield logCtx.failed();
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, WSErrBuilder.UnknownError(prettyError));
            }
        });
    }
    oauth2Callback(template, config, session, req, res, activityLogId, environment, account, logCtx) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { code } = req.query;
            const providerConfigKey = session.providerConfigKey;
            const connectionId = session.connectionId;
            const channel = session.webSocketClientId;
            const callbackMetadata = getConnectionMetadataFromCallbackRequest(req.query, template);
            const installationId = req.query['installation_id'];
            if (!code) {
                const error = WSErrBuilder.InvalidCallbackOAuth2();
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: error.message,
                    timestamp: Date.now(),
                    params: {
                        scopes: config.oauth_scopes,
                        basic_auth_enabled: template.token_request_auth_method === 'basic',
                        token_params: template.token_params
                    }
                });
                yield logCtx.error(error.message, {
                    scopes: config.oauth_scopes,
                    basicAuthEnabled: template.token_request_auth_method === 'basic',
                    tokenParams: template.token_params
                });
                yield logCtx.failed();
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, 'OAuth2 token request failed with a missing code', LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    provider: String(config.provider),
                    connectionId: String(connectionId),
                    authMode: String(template.auth_mode),
                    level: 'error'
                });
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: template.auth_mode,
                    error: {
                        type: 'invalid_callback',
                        description: error.message
                    },
                    operation: 'unknown'
                }, session.provider, activityLogId, logCtx);
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
            }
            // no need to do anything here until the request is approved
            if (session.authMode === 'CUSTOM' && req.query['setup_action'] === 'update' && installationId) {
                // this means the update request was performed from the provider itself
                if (!req.query['state']) {
                    res.redirect(req.get('referer') || req.get('Referer') || req.headers.referer || 'https://github.com');
                    return;
                }
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Update request has been made for ${session.provider} using ${providerConfigKey} for the connection ${connectionId}`,
                    timestamp: Date.now()
                });
                yield updateSuccessActivityLog(activityLogId, true);
                yield logCtx.info('Update request has been made', { provider: session.provider, providerConfigKey, connectionId });
                yield logCtx.success();
                return publisher.notifySuccess(res, channel, providerConfigKey, connectionId);
            }
            // check for oauth overrides in the connnection config
            if (session.connectionConfig['oauth_client_id_override']) {
                config.oauth_client_id = session.connectionConfig['oauth_client_id_override'];
            }
            if (session.connectionConfig['oauth_client_secret_override']) {
                config.oauth_client_secret = session.connectionConfig['oauth_client_secret_override'];
            }
            if (session.connectionConfig['oauth_scopes']) {
                config.oauth_scopes = session.connectionConfig['oauth_scopes'];
            }
            const simpleOAuthClient = new simpleOauth2.AuthorizationCode(oauth2Client.getSimpleOAuth2ClientConfig(config, template, session.connectionConfig));
            let additionalTokenParams = {};
            if (template.token_params !== undefined) {
                // We need to remove grant_type, simpleOAuth2 handles that for us
                const deepCopy = JSON.parse(JSON.stringify(template.token_params));
                additionalTokenParams = deepCopy;
            }
            // We always implement PKCE, no matter whether the server requires it or not,
            // unless it has been explicitly disabled for this provider template
            if (!template.disable_pkce) {
                additionalTokenParams['code_verifier'] = session.codeVerifier;
            }
            const headers = {};
            if (template.token_request_auth_method === 'basic') {
                headers['Authorization'] = 'Basic ' + Buffer.from(config.oauth_client_id + ':' + config.oauth_client_secret).toString('base64');
            }
            try {
                let rawCredentials;
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Initiating token request for ${session.provider} using ${providerConfigKey} for the connection ${connectionId}`,
                    timestamp: Date.now(),
                    params: Object.assign(Object.assign({}, additionalTokenParams), { code: code, scopes: config.oauth_scopes, basic_auth_enabled: template.token_request_auth_method === 'basic', token_params: template.token_params })
                });
                yield logCtx.info('Initiating token request', {
                    provider: session.provider,
                    providerConfigKey,
                    connectionId,
                    additionalTokenParams,
                    code,
                    scopes: config.oauth_scopes,
                    basicAuthEnabled: template.token_request_auth_method === 'basic',
                    tokenParams: template.token_params
                });
                const tokenUrl = typeof template.token_url === 'string' ? template.token_url : (_a = template.token_url) === null || _a === void 0 ? void 0 : _a['OAUTH2'];
                if (providerClientManager.shouldUseProviderClient(session.provider)) {
                    rawCredentials = yield providerClientManager.getToken(config, tokenUrl, code, session.callbackUrl, session.codeVerifier);
                }
                else {
                    const accessToken = yield simpleOAuthClient.getToken(Object.assign({ code: code, redirect_uri: session.callbackUrl }, additionalTokenParams), {
                        headers
                    });
                    rawCredentials = accessToken.token;
                }
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `Token response was received for ${session.provider} using ${providerConfigKey} for the connection ${connectionId}`,
                    timestamp: Date.now()
                });
                yield logCtx.info('Token response received', { provider: session.provider, providerConfigKey, connectionId });
                const tokenMetadata = getConnectionMetadataFromTokenResponse(rawCredentials, template);
                let parsedRawCredentials;
                try {
                    parsedRawCredentials = connectionService.parseRawCredentials(rawCredentials, 'OAUTH2');
                }
                catch (err) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        content: `The OAuth token response from the server could not be parsed - OAuth flow failed. The server returned:\n${JSON.stringify(rawCredentials)}`,
                        timestamp: Date.now()
                    });
                    yield logCtx.error('The OAuth token response from the server could not be parsed - OAuth flow failed.', { error: err, rawCredentials });
                    yield logCtx.failed();
                    yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, 'OAuth2 token request failed, response from the server could not be parsed', LogActionEnum.AUTH, {
                        environmentId: String(environment.id),
                        providerConfigKey: String(providerConfigKey),
                        provider: String(config.provider),
                        connectionId: String(connectionId),
                        authMode: String(template.auth_mode),
                        level: 'error'
                    });
                    connectionCreationFailedHook({
                        connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                        environment,
                        account,
                        auth_mode: template.auth_mode,
                        error: {
                            type: 'unable_to_parse_token_response',
                            description: 'OAuth2 token request failed, response from the server could not be parsed'
                        },
                        operation: 'unknown'
                    }, session.provider, activityLogId, logCtx);
                    return publisher.notifyErr(res, channel, providerConfigKey, connectionId, WSErrBuilder.UnknownError());
                }
                let connectionConfig = Object.assign(Object.assign(Object.assign({}, session.connectionConfig), tokenMetadata), callbackMetadata);
                let pending = false;
                if (template.auth_mode === 'CUSTOM' && !connectionConfig['installation_id'] && !installationId) {
                    pending = true;
                    const custom = config.custom;
                    connectionConfig = Object.assign(Object.assign({}, connectionConfig), { app_id: custom['app_id'], pending, pendingLog: activityLogId.toString() });
                }
                if (template.auth_mode === 'CUSTOM' && installationId) {
                    connectionConfig = Object.assign(Object.assign({}, connectionConfig), { installation_id: installationId });
                }
                if (connectionConfig['oauth_client_id_override']) {
                    parsedRawCredentials = Object.assign(Object.assign({}, parsedRawCredentials), { config_override: {
                            client_id: connectionConfig['oauth_client_id_override']
                        } });
                    connectionConfig = Object.keys(session.connectionConfig).reduce((acc, key) => {
                        if (key !== 'oauth_client_id_override') {
                            acc[key] = connectionConfig[key];
                        }
                        return acc;
                    }, {});
                }
                if (connectionConfig['oauth_client_secret_override']) {
                    parsedRawCredentials = Object.assign(Object.assign({}, parsedRawCredentials), { config_override: Object.assign(Object.assign({}, parsedRawCredentials.config_override), { client_secret: connectionConfig['oauth_client_secret_override'] }) });
                    connectionConfig = Object.keys(session.connectionConfig).reduce((acc, key) => {
                        if (key !== 'oauth_client_secret_override') {
                            acc[key] = connectionConfig[key];
                        }
                        return acc;
                    }, {});
                }
                if (connectionConfig['oauth_scopes_override']) {
                    connectionConfig['oauth_scopes_override'] = !Array.isArray(connectionConfig['oauth_scopes_override'])
                        ? connectionConfig['oauth_scopes_override'].split(',')
                        : connectionConfig['oauth_scopes_override'];
                }
                const [updatedConnection] = yield connectionService.upsertConnection(connectionId, providerConfigKey, session.provider, parsedRawCredentials, connectionConfig, session.environmentId, account.id);
                yield updateProviderActivityLog(activityLogId, session.provider);
                yield createActivityLogMessageAndEnd({
                    level: 'debug',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `OAuth connection for ${providerConfigKey} was successful${template.auth_mode === 'CUSTOM' && !installationId ? ' and request for app approval is pending' : ''}`,
                    timestamp: Date.now(),
                    auth_mode: template.auth_mode,
                    params: Object.assign(Object.assign({}, additionalTokenParams), { code: code, scopes: config.oauth_scopes, basic_auth_enabled: template.token_request_auth_method === 'basic', token_params: template.token_params })
                });
                yield logCtx.debug(`OAuth connection successful${template.auth_mode === 'CUSTOM' && !installationId ? ' and request for app approval is pending' : ''}`, {
                    additionalTokenParams,
                    code,
                    scopes: config.oauth_scopes,
                    basicAuthEnabled: template.token_request_auth_method === 'basic',
                    tokenParams: template.token_params
                });
                if (updatedConnection) {
                    yield logCtx.enrichOperation({ connectionId: updatedConnection.connection.id, connectionName: updatedConnection.connection.connection_id });
                    // don't initiate a sync if custom because this is the first step of the oauth flow
                    const initiateSync = template.auth_mode === 'CUSTOM' ? false : true;
                    const runPostConnectionScript = true;
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: template.auth_mode,
                        operation: updatedConnection.operation
                    }, session.provider, logContextGetter, activityLogId, { initiateSync, runPostConnectionScript }, logCtx);
                }
                if (template.auth_mode === 'CUSTOM' && installationId) {
                    pending = false;
                    const connCreatedHook = (res) => __awaiter(this, void 0, void 0, function* () {
                        void connectionCreatedHook({
                            connection: res.connection,
                            environment,
                            account,
                            auth_mode: 'APP',
                            operation: res.operation
                        }, config.provider, logContextGetter, activityLogId, { initiateSync: true, runPostConnectionScript: false }, logCtx);
                    });
                    yield connectionService.getAppCredentialsAndFinishConnection(connectionId, config, template, connectionConfig, activityLogId, logCtx, connCreatedHook);
                }
                else {
                    yield updateSuccessActivityLog(activityLogId, template.auth_mode === 'CUSTOM' ? null : true);
                }
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_SUCCESS, 'OAuth2 token request succeeded', LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    provider: String(config.provider),
                    connectionId: String(connectionId),
                    authMode: String(template.auth_mode)
                });
                yield logCtx.success();
                return publisher.notifySuccess(res, channel, providerConfigKey, connectionId, pending);
            }
            catch (err) {
                const prettyError = stringifyError(err, { pretty: true });
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: session.environmentId,
                    metadata: {
                        providerConfigKey: session.providerConfigKey,
                        connectionId: session.connectionId
                    }
                });
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, 'OAuth2 token request failed', LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    provider: String(config.provider),
                    connectionId: String(connectionId),
                    authMode: String(template.auth_mode),
                    level: 'error'
                });
                const error = WSErrBuilder.UnknownError();
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: error.message + '\n' + prettyError,
                    timestamp: Date.now()
                });
                yield logCtx.error(error.message, { error: err });
                yield logCtx.failed();
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: template.auth_mode,
                    error: {
                        type: 'unknown',
                        description: error.message + '\n' + prettyError
                    },
                    operation: 'unknown'
                }, session.provider, activityLogId, logCtx);
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
            }
        });
    }
    oauth1Callback(template, config, session, req, res, activityLogId, environment, account, logCtx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { oauth_token, oauth_verifier } = req.query;
            const providerConfigKey = session.providerConfigKey;
            const connectionId = session.connectionId;
            const channel = session.webSocketClientId;
            const metadata = getConnectionMetadataFromCallbackRequest(req.query, template);
            if (!oauth_token || !oauth_verifier) {
                const error = WSErrBuilder.InvalidCallbackOAuth1();
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: error.message,
                    timestamp: Date.now()
                });
                yield logCtx.error(error.message);
                yield logCtx.failed();
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: template.auth_mode,
                    error: {
                        type: 'invalid_callback',
                        description: error.message
                    },
                    operation: 'unknown'
                }, session.provider, activityLogId, logCtx);
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, error);
            }
            const oauth_token_secret = session.requestTokenSecret;
            const oAuth1Client = new OAuth1Client(config, template, '');
            oAuth1Client
                .getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier)
                .then((accessTokenResult) => __awaiter(this, void 0, void 0, function* () {
                const parsedAccessTokenResult = connectionService.parseRawCredentials(accessTokenResult, 'OAUTH1');
                const [updatedConnection] = yield connectionService.upsertConnection(connectionId, providerConfigKey, session.provider, parsedAccessTokenResult, Object.assign(Object.assign({}, session.connectionConfig), metadata), environment.id, account.id);
                yield updateSuccessActivityLog(activityLogId, true);
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: `OAuth connection for ${providerConfigKey} was successful`,
                    timestamp: Date.now(),
                    auth_mode: template.auth_mode,
                    url: session.callbackUrl
                });
                yield logCtx.info('OAuth connection was successful', { url: session.callbackUrl, providerConfigKey });
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_SUCCESS, 'OAuth1 token request succeeded', LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    provider: String(config.provider),
                    connectionId: String(connectionId),
                    authMode: String(template.auth_mode)
                });
                if (updatedConnection) {
                    yield logCtx.enrichOperation({
                        connectionId: updatedConnection.connection.id,
                        connectionName: updatedConnection.connection.connection_id
                    });
                    // syncs not support for oauth1
                    const initiateSync = false;
                    const runPostConnectionScript = true;
                    void connectionCreatedHook({
                        connection: updatedConnection.connection,
                        environment,
                        account,
                        auth_mode: template.auth_mode,
                        operation: updatedConnection.operation
                    }, session.provider, logContextGetter, activityLogId, { initiateSync, runPostConnectionScript }, logCtx);
                }
                yield logCtx.success();
                return publisher.notifySuccess(res, channel, providerConfigKey, connectionId);
            }))
                .catch((err) => __awaiter(this, void 0, void 0, function* () {
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.AUTH,
                    environmentId: session.environmentId,
                    metadata: Object.assign(Object.assign({}, metadata), { providerConfigKey: session.providerConfigKey, connectionId: session.connectionId })
                });
                const prettyError = stringifyError(err, { pretty: true });
                yield telemetry.log(LogTypes.AUTH_TOKEN_REQUEST_FAILURE, 'OAuth1 token request failed', LogActionEnum.AUTH, {
                    environmentId: String(environment.id),
                    providerConfigKey: String(providerConfigKey),
                    provider: String(config.provider),
                    connectionId: String(connectionId),
                    authMode: String(template.auth_mode),
                    level: 'error'
                });
                const error = WSErrBuilder.UnknownError();
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    content: error.message + '\n' + prettyError,
                    timestamp: Date.now()
                });
                yield logCtx.error(error.message);
                yield logCtx.failed();
                connectionCreationFailedHook({
                    connection: { connection_id: connectionId, provider_config_key: providerConfigKey },
                    environment,
                    account,
                    auth_mode: template.auth_mode,
                    error: {
                        type: 'unknown',
                        description: error.message + '\n' + prettyError
                    },
                    operation: 'unknown'
                }, session.provider, activityLogId, logCtx);
                return publisher.notifyErr(res, channel, providerConfigKey, connectionId, WSErrBuilder.UnknownError(prettyError));
            }));
        });
    }
}
export default new OAuthController();
//# sourceMappingURL=oauth.controller.js.map