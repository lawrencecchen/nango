var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import braintree from 'braintree';
import qs from 'qs';
import { getLogger, axiosInstance as axios } from '@nangohq/utils';
import { parseTokenExpirationDate, isTokenExpired } from '../utils/utils.js';
import { NangoError } from '../utils/error.js';
const stripeAppExpiresIn = 3600;
const logger = getLogger('Provider.Client');
class ProviderClient {
    shouldUseProviderClient(provider) {
        switch (provider) {
            case 'braintree':
            case 'braintree-sandbox':
            case 'figma':
            case 'figjam':
            case 'facebook':
            case 'tiktok-ads':
            case 'tiktok-accounts':
            case 'stripe-app':
            case 'stripe-app-sandbox':
                return true;
            default:
                return false;
        }
    }
    shouldIntrospectToken(provider) {
        switch (provider) {
            case 'salesforce':
            case 'salesforce-sandbox':
                return true;
            default:
                return false;
        }
    }
    getToken(config, tokenUrl, code, callBackUrl, codeVerifier) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (config.provider) {
                case 'braintree':
                case 'braintree-sandbox':
                    return this.createBraintreeToken(code, config.oauth_client_id, config.oauth_client_secret);
                case 'figma':
                case 'figjam':
                    return this.createFigmaToken(tokenUrl, code, config.oauth_client_id, config.oauth_client_secret, callBackUrl);
                case 'facebook':
                    return this.createFacebookToken(tokenUrl, code, config.oauth_client_id, config.oauth_client_secret, callBackUrl, codeVerifier);
                case 'tiktok-ads':
                    return this.createTiktokAdsToken(tokenUrl, code, config.oauth_client_id, config.oauth_client_secret);
                case 'stripe-app':
                case 'stripe-app-sandbox':
                    return this.createStripeAppToken(tokenUrl, code, config.oauth_client_secret, callBackUrl);
                case 'tiktok-accounts':
                    return this.createTiktokAccountsToken(tokenUrl, code, config.oauth_client_id, config.oauth_client_secret, callBackUrl);
                default:
                    throw new NangoError('unknown_provider_client');
            }
        });
    }
    refreshToken(template, config, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (connection.credentials.type !== 'OAUTH2') {
                throw new NangoError('wrong_credentials_type');
            }
            const credentials = connection.credentials;
            if (config.provider !== 'facebook' && !credentials.refresh_token) {
                throw new NangoError('missing_refresh_token');
            }
            else if (config.provider === 'facebook' && !credentials.access_token) {
                throw new NangoError('missing_facebook_access_token');
            }
            switch (config.provider) {
                case 'braintree':
                case 'braintree-sandbox':
                    return this.refreshBraintreeToken(credentials.refresh_token, config.oauth_client_id, config.oauth_client_secret);
                case 'figma':
                case 'figjam':
                    return this.refreshFigmaToken(template.refresh_url, credentials.refresh_token, config.oauth_client_id, config.oauth_client_secret);
                case 'facebook':
                    return this.refreshFacebookToken(template.token_url, credentials.access_token, config.oauth_client_id, config.oauth_client_secret);
                case 'tiktok-accounts':
                    return this.refreshTiktokAccountsToken(template.refresh_url, credentials.refresh_token, config.oauth_client_id, config.oauth_client_secret);
                case 'stripe-app':
                case 'stripe-app-sandbox':
                    return this.refreshStripeAppToken(template.token_url, credentials.refresh_token, config.oauth_client_secret);
                default:
                    throw new NangoError('unknown_provider_client');
            }
        });
    }
    introspectedTokenExpired(config, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (connection.credentials.type !== 'OAUTH2') {
                throw new NangoError('wrong_credentials_type');
            }
            const credentials = connection.credentials;
            const oauthConnection = connection;
            switch (config.provider) {
                case 'salesforce':
                case 'salesforce-sandbox':
                    return this.introspectedSalesforceTokenExpired(credentials.access_token, config.oauth_client_id, config.oauth_client_secret, oauthConnection.connection_config);
                default:
                    throw new NangoError('unknown_provider_client');
            }
        });
    }
    createFigmaToken(tokenUrl, code, clientId, clientSecret, callBackUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.set('redirect_uri', callBackUrl);
            const body = {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code'
            };
            const url = `${tokenUrl}?${params.toString()}`;
            const response = yield axios.post(url, body);
            if (response.status === 200 && response.data !== null) {
                return {
                    access_token: response.data['access_token'],
                    refresh_token: response.data['refresh_token'],
                    expires_in: response.data['expires_in']
                };
            }
            throw new NangoError('figma_token_request_error');
        });
    }
    createFacebookToken(tokenUrl, code, clientId, clientSecret, callBackUrl, codeVerifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.set('redirect_uri', callBackUrl);
            const body = {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: callBackUrl,
                code_verifier: codeVerifier
            };
            const url = `${tokenUrl}?${params.toString()}`;
            const response = yield axios.post(url, body);
            if (response.status === 200 && response.data !== null) {
                return {
                    access_token: response.data['access_token'],
                    expires_in: response.data['expires_in']
                };
            }
            throw new NangoError('facebook_token_request_error');
        });
    }
    createTiktokAdsToken(tokenUrl, code, clientId, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    secret: clientSecret,
                    app_id: clientId,
                    auth_code: code
                };
                const response = yield axios.post(tokenUrl, body);
                if (response.status === 200 && response.data !== null) {
                    return {
                        access_token: response.data.data['access_token'],
                        advertiser_ids: response.data.data['advertiser_ids'],
                        scope: response.data.data['scope'],
                        request_id: response.data['request_id']
                    };
                }
                throw new NangoError('tiktok_token_request_error');
            }
            catch (e) {
                throw new NangoError('tiktok_token_request_error', e.message);
            }
        });
    }
    createStripeAppToken(tokenUrl, code, clientSecret, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(clientSecret + ':').toString('base64')
                };
                const body = {
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: callback
                };
                const response = yield axios.post(tokenUrl, body, { headers: headers });
                if (response.status === 200 && response.data) {
                    return {
                        access_token: response.data['access_token'],
                        livemode: response.data['livemode'],
                        refresh_token: response.data['refresh_token'],
                        scope: response.data['scope'],
                        stripe_publishable_key: response.data['stripe_publishable_key'],
                        stripe_user_id: response.data['stripe_user_id'],
                        token_type: response.data['token_type'],
                        expires_in: stripeAppExpiresIn
                    };
                }
                throw new NangoError('stripe_app_token_request_error');
            }
            catch (e) {
                throw new NangoError('stripe_app_token_request_error', e.message);
            }
        });
    }
    refreshStripeAppToken(refreshTokenUrl, refreshToken, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(clientSecret + ':').toString('base64')
                };
                const body = {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                };
                const response = yield axios.post(refreshTokenUrl, body, { headers: headers });
                if (response.status === 200 && response.data) {
                    return {
                        access_token: response.data['access_token'],
                        livemode: response.data['livemode'],
                        refresh_token: response.data['refresh_token'],
                        scope: response.data['scope'],
                        stripe_publishable_key: response.data['stripe_publishable_key'],
                        stripe_user_id: response.data['stripe_user_id'],
                        token_type: response.data['token_type'],
                        expires_in: stripeAppExpiresIn
                    };
                }
                throw new NangoError('stripe_app_token_refresh_request_error');
            }
            catch (e) {
                throw new NangoError('stripe_app_token_refresh_request_error', e.message);
            }
        });
    }
    createTiktokAccountsToken(tokenUrl, code, client_id, client_secret, redirect_uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    client_id,
                    client_secret,
                    grant_type: 'authorization_code',
                    auth_code: code,
                    redirect_uri
                };
                const response = yield axios.post(tokenUrl, body);
                if (response.status === 200 && response.data && response.data.data) {
                    return {
                        access_token: response.data.data['access_token'],
                        token_type: response.data.data['token_type'],
                        scope: response.data.data['scope'],
                        expires_in: response.data.data['expires_in'],
                        refresh_token: response.data.data['refresh_token'],
                        refresh_token_expires_in: response.data.data['refresh_token_expires_in'],
                        open_id: response.data.data['open_id'],
                        request_id: response.data['request_id']
                    };
                }
                throw new NangoError('tiktok_token_request_error', response.data);
            }
            catch (e) {
                throw new NangoError('tiktok_token_request_error', e.message);
            }
        });
    }
    refreshTiktokAccountsToken(refreshTokenUrl, refreshToken, clientId, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                };
                const response = yield axios.post(refreshTokenUrl, body);
                if (response.status === 200 && response.data !== null) {
                    return {
                        access_token: response.data.data['access_token'],
                        token_type: response.data.data['token_type'],
                        scope: response.data.data['scope'],
                        expires_in: response.data.data['expires_in'],
                        refresh_token: response.data.data['refresh_token'],
                        refresh_token_expires_in: response.data.data['refresh_token_expires_in'],
                        open_id: response.data.data['open_id'],
                        request_id: response.data['request_id']
                    };
                }
                throw new NangoError('tiktok_token_refresh_request_error');
            }
            catch (e) {
                throw new NangoError('tiktok_token_refresh_request_error', e.message);
            }
        });
    }
    refreshFigmaToken(refreshTokenUrl, refreshToken, clientId, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken
            };
            const response = yield axios.post(refreshTokenUrl, body);
            if (response.status === 200 && response.data !== null) {
                return {
                    refresh_token: refreshToken,
                    access_token: response.data['access_token'],
                    expires_in: response.data['expires_in']
                };
            }
            throw new NangoError('figma_refresh_token_request_error');
        });
    }
    refreshFacebookToken(refreshTokenUrl, accessToken, clientId, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryParams = {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'fb_exchange_token',
                fb_exchange_token: accessToken
            };
            const urlWithParams = `${refreshTokenUrl}?${qs.stringify(queryParams)}`;
            const response = yield axios.post(urlWithParams);
            if (response.status === 200 && response.data !== null) {
                return {
                    access_token: response.data['access_token'],
                    expires_in: response.data['expires_in']
                };
            }
            throw new NangoError('facebook_refresh_token_request_error');
        });
    }
    createBraintreeToken(code, clientId, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            const gateway = new braintree.BraintreeGateway({ clientId: clientId, clientSecret: clientSecret });
            const res = yield gateway.oauth.createTokenFromCode({ code: code });
            if (!('credentials' in res && 'accessToken' in res.credentials && 'refreshToken' in res.credentials && 'expiresAt' in res.credentials)) {
                throw new NangoError('braintree_token_request_error');
            }
            const creds = res['credentials'];
            return {
                access_token: creds['accessToken'],
                refresh_token: creds['refreshToken'],
                expires_at: creds['expiresAt']
            };
        });
    }
    refreshBraintreeToken(refreshToken, clientId, clientSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            const gateway = new braintree.BraintreeGateway({ clientId: clientId, clientSecret: clientSecret });
            const res = yield gateway.oauth.createTokenFromRefreshToken({ refreshToken: refreshToken });
            if (!('credentials' in res && 'accessToken' in res.credentials && 'refreshToken' in res.credentials && 'expiresAt' in res.credentials)) {
                throw new NangoError('braintree_token_refresh_error');
            }
            const creds = res['credentials'];
            return {
                access_token: creds['accessToken'],
                refresh_token: creds['refreshToken'],
                expires_at: creds['expiresAt']
            };
        });
    }
    introspectedSalesforceTokenExpired(accessToken, clientId, clientSecret, connectionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!connectionConfig['instance_url']) {
                throw new NangoError('salesforce_instance_url_missing');
            }
            const url = `${connectionConfig['instance_url']}/services/oauth2/introspect`;
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/json'
            };
            const body = {
                token: accessToken,
                client_id: clientId,
                client_secret: clientSecret,
                token_type_hint: 'access_token'
            };
            try {
                const res = yield axios.post(url, body, { headers: headers });
                if (res.status != 200 || res.data == null || !res.data['active'] || res.data['exp'] == null) {
                    return true;
                }
                const expireDate = parseTokenExpirationDate(res.data['exp']);
                return isTokenExpired(expireDate, 15 * 60);
            }
            catch (err) {
                logger.error(err);
                // TODO add observability
                return false;
            }
        });
    }
}
export default new ProviderClient();
//# sourceMappingURL=provider.client.js.map