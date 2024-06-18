var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AuthorizationCode } from 'simple-oauth2';
import Boom from '@hapi/boom';
import { httpAgent, httpsAgent } from '@nangohq/utils';
import connectionsManager from '../services/connection.service.js';
import { LogActionEnum } from '../models/Activity.js';
import { interpolateString } from '../utils/utils.js';
import { NangoError } from '../utils/error.js';
import errorManager, { ErrorSourceEnum } from '../utils/error.manager.js';
export function getSimpleOAuth2ClientConfig(providerConfig, template, connectionConfig) {
    const templateTokenUrl = typeof template.token_url === 'string' ? template.token_url : template.token_url['OAUTH2'];
    const strippedTokenUrl = templateTokenUrl.replace(/connectionConfig\./g, '');
    const tokenUrl = new URL(interpolateString(strippedTokenUrl, connectionConfig));
    const strippedAuthorizeUrl = template.authorization_url.replace(/connectionConfig\./g, '');
    const authorizeUrl = new URL(interpolateString(strippedAuthorizeUrl, connectionConfig));
    const headers = { 'User-Agent': 'Nango' };
    const authConfig = template;
    return {
        client: {
            id: providerConfig.oauth_client_id,
            secret: providerConfig.oauth_client_secret
        },
        auth: {
            tokenHost: tokenUrl.origin,
            tokenPath: tokenUrl.pathname,
            authorizeHost: authorizeUrl.origin,
            authorizePath: authorizeUrl.pathname
        },
        http: {
            headers,
            // @ts-expect-error badly documented feature https://github.com/hapijs/wreck/blob/ba28b0420d6b0998cd8e61be7f3f8822129c88fe/lib/index.js#L34-L40
            agents: httpAgent && httpsAgent
                ? {
                    http: httpAgent,
                    https: httpsAgent,
                    httpsAllowUnauthorized: httpsAgent
                }
                : undefined
        },
        options: {
            authorizationMethod: authConfig.authorization_method || 'body',
            bodyFormat: authConfig.body_format || 'form',
            // @ts-expect-error seems unused ?
            scopeSeparator: template.scope_separator || ' '
        }
    };
}
export function getFreshOAuth2Credentials(connection, config, template) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const credentials = connection.credentials;
        if (credentials.config_override && credentials.config_override.client_id && credentials.config_override.client_secret) {
            config = Object.assign(Object.assign({}, config), { oauth_client_id: credentials.config_override.client_id, oauth_client_secret: credentials.config_override.client_secret });
        }
        const simpleOAuth2ClientConfig = getSimpleOAuth2ClientConfig(config, template, connection.connection_config);
        if (template.token_request_auth_method === 'basic') {
            const headers = Object.assign(Object.assign({}, (_a = simpleOAuth2ClientConfig.http) === null || _a === void 0 ? void 0 : _a.headers), { Authorization: 'Basic ' + Buffer.from(config.oauth_client_id + ':' + config.oauth_client_secret).toString('base64') });
            simpleOAuth2ClientConfig.http.headers = headers;
        }
        const client = new AuthorizationCode(simpleOAuth2ClientConfig);
        const oldAccessToken = client.createToken({
            access_token: credentials.access_token,
            expires_at: credentials.expires_at,
            refresh_token: credentials.refresh_token
        });
        let additionalParams = {};
        if (template.refresh_params) {
            additionalParams = template.refresh_params;
        }
        else if (template.token_params) {
            additionalParams = template.token_params;
        }
        let rawNewAccessToken;
        try {
            rawNewAccessToken = yield oldAccessToken.refresh(additionalParams);
        }
        catch (e) {
            let nangoErr;
            let errorPayload;
            if ('data' in e && 'payload' in e.data) {
                errorPayload = e.data.payload;
            }
            if (Boom.isBoom(e)) {
                const payload = {
                    external_message: e.message,
                    external_request_details: e.output,
                    dataMessage: errorPayload instanceof Buffer ? errorPayload.toString() : errorPayload
                };
                nangoErr = new NangoError(`refresh_token_external_error`, payload);
            }
            else {
                nangoErr = new NangoError(`refresh_token_external_error`, { message: e.message });
            }
            errorManager.report(nangoErr.message, {
                environmentId: connection.environment_id,
                source: ErrorSourceEnum.CUSTOMER,
                operation: LogActionEnum.AUTH,
                metadata: {
                    connection,
                    config,
                    template
                }
            });
            return { success: false, error: nangoErr, response: null };
        }
        let newCredentials;
        try {
            newCredentials = connectionsManager.parseRawCredentials(rawNewAccessToken.token, 'OAUTH2');
            if (!newCredentials.refresh_token && credentials.refresh_token != null) {
                newCredentials.refresh_token = credentials.refresh_token;
            }
            if (credentials.config_override && credentials.config_override.client_id && credentials.config_override.client_secret) {
                newCredentials.config_override = {
                    client_id: credentials.config_override.client_id,
                    client_secret: credentials.config_override.client_secret
                };
            }
            return { success: true, error: null, response: newCredentials };
        }
        catch (err) {
            const error = new NangoError(`refresh_token_parsing_error`, { cause: err });
            errorManager.report(error.message, {
                environmentId: connection.environment_id,
                source: ErrorSourceEnum.CUSTOMER,
                operation: LogActionEnum.AUTH,
                metadata: {
                    connection,
                    config,
                    template
                }
            });
            return { success: false, error, response: null };
        }
    });
}
//# sourceMappingURL=oauth2.client.js.map