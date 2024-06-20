import * as braintree from 'braintree';
import type { Config as ProviderConfig, Connection, AuthorizationTokenResponse, RefreshTokenResponse } from '../models/index.js';
import type { TemplateOAuth2 as ProviderTemplateOAuth2 } from '@nangohq/types';
import * as qs from 'qs';
import { parseTokenExpirationDate, isTokenExpired } from '../utils/utils.js';
import { NangoError } from '../utils/error.js';
import { getLogger, httpsRequest } from '@nangohq/utils';
import type { IncomingMessage } from 'http';
import type { RequestOptions } from 'https';

const stripeAppExpiresIn = 3600;
const logger = getLogger('Provider.Client');

async function streamToString(stream: IncomingMessage): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk as Uint8Array);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

class ProviderClient {
    public shouldUseProviderClient(provider: string): boolean {
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

    public shouldIntrospectToken(provider: string): boolean {
        switch (provider) {
            case 'salesforce':
            case 'salesforce-sandbox':
                return true;
            default:
                return false;
        }
    }

    public async getToken(
        config: ProviderConfig,
        tokenUrl: string,
        code: string,
        callBackUrl: string,
        codeVerifier: string
    ): Promise<AuthorizationTokenResponse | RefreshTokenResponse> {
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
    }

    public async refreshToken(template: ProviderTemplateOAuth2, config: ProviderConfig, connection: Connection): Promise<object> {
        if (connection.credentials.type !== 'OAUTH2') {
            throw new NangoError('wrong_credentials_type');
        }

        if (config.provider !== 'facebook' && !connection.credentials.refresh_token) {
            throw new NangoError('missing_refresh_token');
        } else if (config.provider === 'facebook' && !connection.credentials.access_token) {
            throw new NangoError('missing_facebook_access_token');
        }

        switch (config.provider) {
            case 'braintree':
            case 'braintree-sandbox':
                if (typeof connection.credentials.refresh_token !== 'string') {
                    throw new NangoError('invalid_refresh_token');
                }
                return this.refreshBraintreeToken(connection.credentials.refresh_token, config.oauth_client_id, config.oauth_client_secret);
            case 'figma':
            case 'figjam':
                return this.refreshFigmaToken(
                    template.refresh_url as string,
                    connection.credentials.refresh_token as string,
                    config.oauth_client_id,
                    config.oauth_client_secret
                );
            case 'facebook':
                return this.refreshFacebookToken(
                    template.token_url as string,
                    connection.credentials.access_token,
                    config.oauth_client_id,
                    config.oauth_client_secret
                );
            case 'tiktok-accounts':
                return this.refreshTiktokAccountsToken(
                    template.refresh_url as string,
                    connection.credentials.refresh_token as string,
                    config.oauth_client_id,
                    config.oauth_client_secret
                );
            case 'stripe-app':
            case 'stripe-app-sandbox':
                return this.refreshStripeAppToken(template.token_url as string, connection.credentials.refresh_token as string, config.oauth_client_secret);
            default:
                throw new NangoError('unknown_provider_client');
        }
    }

    public async introspectedTokenExpired(config: ProviderConfig, connection: Connection): Promise<boolean> {
        if (connection.credentials.type !== 'OAUTH2') {
            throw new NangoError('wrong_credentials_type');
        }

        const url = `${connection.connection_config['instance_url']}/services/oauth2/introspect`;
        const body = JSON.stringify({
            token: connection.credentials.access_token,
            client_id: config.oauth_client_id,
            client_secret: config.oauth_client_secret,
            token_type_hint: 'access_token'
        });
        const options: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        switch (config.provider) {
            case 'salesforce':
            case 'salesforce-sandbox':
                try {
                    const response = await httpsRequest({ ...options, path: url }, body);
                    const parsedResponse = JSON.parse(await streamToString(response));
                    if (parsedResponse && typeof parsedResponse.active === 'boolean' && typeof parsedResponse.exp === 'number') {
                        const responseData: { active: boolean; exp: number } = {
                            active: parsedResponse.active,
                            exp: parsedResponse.exp
                        };

                        if (!responseData.active || !responseData.exp) {
                            return true;
                        }

                        const expireDate = parseTokenExpirationDate(responseData.exp);

                        return isTokenExpired(expireDate, 15 * 60);
                    }
                    return true;
                } catch (err) {
                    logger.error(err);
                    // TODO add observability
                    return false;
                }
            default:
                throw new NangoError('unknown_provider_client');
        }
    }

    private async createFigmaToken(
        tokenUrl: string,
        code: string,
        clientId: string,
        clientSecret: string,
        callBackUrl: string
    ): Promise<AuthorizationTokenResponse> {
        const params = new URLSearchParams();
        params.set('redirect_uri', callBackUrl);
        const body = JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code'
        });
        const options: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const response = await httpsRequest({ ...options, path: `${tokenUrl}?${params.toString()}` }, body);
        const parsedResponse = JSON.parse(await streamToString(response));
        if (
            parsedResponse &&
            typeof parsedResponse.access_token === 'string' &&
            typeof parsedResponse.refresh_token === 'string' &&
            typeof parsedResponse.expires_in === 'number'
        ) {
            const responseData: { access_token: string; refresh_token: string; expires_in: number } = {
                access_token: parsedResponse.access_token,
                refresh_token: parsedResponse.refresh_token,
                expires_in: parsedResponse.expires_in
            };
            return {
                access_token: responseData.access_token,
                refresh_token: responseData.refresh_token,
                expires_in: responseData.expires_in
            };
        }
        throw new NangoError('figma_token_request_error');
    }

    private async createFacebookToken(
        tokenUrl: string,
        code: string,
        clientId: string,
        clientSecret: string,
        callBackUrl: string,
        codeVerifier: string
    ): Promise<AuthorizationTokenResponse> {
        const params = new URLSearchParams();
        params.set('redirect_uri', callBackUrl);
        const body = JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: callBackUrl,
            code_verifier: codeVerifier
        });
        const options: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const response = await httpsRequest({ ...options, path: `${tokenUrl}?${params.toString()}` }, body);
        const parsedResponse = JSON.parse(await streamToString(response));
        if (parsedResponse && typeof parsedResponse.access_token === 'string' && typeof parsedResponse.expires_in === 'number') {
            const responseData: { access_token: string; expires_in: number } = {
                access_token: parsedResponse.access_token,
                expires_in: parsedResponse.expires_in
            };
            return {
                access_token: responseData.access_token,
                expires_in: responseData.expires_in
            };
        }
        throw new NangoError('facebook_token_request_error');
    }

    private async createTiktokAdsToken(tokenUrl: string, code: string, clientId: string, clientSecret: string): Promise<AuthorizationTokenResponse> {
        try {
            const body = JSON.stringify({
                secret: clientSecret,
                app_id: clientId,
                auth_code: code
            });

            const options: RequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const response = await httpsRequest({ ...options, path: tokenUrl }, body);
            const parsedResponse = JSON.parse(await streamToString(response));
            if (
                parsedResponse &&
                parsedResponse.data &&
                typeof parsedResponse.data.access_token === 'string'
            ) {
                return {
                    access_token: parsedResponse.data.access_token,
                    refresh_token: '', // Tiktok Ads API does not provide a refresh token
                    expires_in: 3600 // Assuming a default expiration time
                };
            }
            throw new NangoError('tiktok_token_request_error');
        } catch (e: unknown) {
            throw new NangoError('tiktok_token_request_error', (e as Error).message);
        }
    }

    private async createStripeAppToken(tokenUrl: string, code: string, clientSecret: string, callback: string): Promise<AuthorizationTokenResponse> {
        try {
            const body = JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: callback
            });

            const options: RequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(clientSecret + ':').toString('base64'),
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const response = await httpsRequest({ ...options, path: tokenUrl }, body);
            const parsedResponse = JSON.parse(await streamToString(response));
            if (
                parsedResponse &&
                typeof parsedResponse.access_token === 'string' &&
                typeof parsedResponse.livemode === 'boolean' &&
                typeof parsedResponse.refresh_token === 'string' &&
                typeof parsedResponse.scope === 'string' &&
                typeof parsedResponse.stripe_publishable_key === 'string' &&
                typeof parsedResponse.stripe_user_id === 'string' &&
                typeof parsedResponse.token_type === 'string'
            ) {
                return {
                    access_token: parsedResponse.access_token,
                    refresh_token: parsedResponse.refresh_token,
                    expires_in: stripeAppExpiresIn
                };
            }

            throw new NangoError('stripe_app_token_request_error');
        } catch (e: unknown) {
            throw new NangoError('stripe_app_token_request_error', (e as Error).message);
        }
    }

    private async refreshStripeAppToken(refreshTokenUrl: string, refreshToken: string, clientSecret: string): Promise<object> {
        try {
            const body = JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            });

            const options: RequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(clientSecret + ':').toString('base64'),
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const response = await httpsRequest({ ...options, path: refreshTokenUrl }, body);
            const responseData: {
                access_token: string;
                livemode: boolean;
                refresh_token: string;
                scope: string;
                stripe_publishable_key: string;
                stripe_user_id: string;
                token_type: string;
            } = JSON.parse(await streamToString(response));

            if (responseData) {
                return {
                    access_token: responseData.access_token,
                    livemode: responseData.livemode,
                    refresh_token: responseData.refresh_token,
                    scope: responseData.scope,
                    stripe_publishable_key: responseData.stripe_publishable_key,
                    stripe_user_id: responseData.stripe_user_id,
                    token_type: responseData.token_type,
                    expires_in: stripeAppExpiresIn
                };
            }
            throw new NangoError('stripe_app_token_refresh_request_error');
        } catch (e: unknown) {
            throw new NangoError('stripe_app_token_refresh_request_error', (e as Error).message);
        }
    }

    private async createTiktokAccountsToken(tokenUrl: string, code: string, client_id: string, client_secret: string, redirect_uri: string): Promise<AuthorizationTokenResponse> {
        try {
            const body = JSON.stringify({
                client_id,
                client_secret,
                grant_type: 'authorization_code',
                auth_code: code,
                redirect_uri
            });

            const options: RequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const response = await httpsRequest({ ...options, path: tokenUrl }, body);
            const parsedResponse = JSON.parse(await streamToString(response));
            if (
                parsedResponse &&
                parsedResponse.data &&
                typeof parsedResponse.data.access_token === 'string' &&
                typeof parsedResponse.data.token_type === 'string' &&
                typeof parsedResponse.data.scope === 'string' &&
                typeof parsedResponse.data.expires_in === 'number' &&
                typeof parsedResponse.data.refresh_token === 'string' &&
                typeof parsedResponse.data.refresh_token_expires_in === 'number' &&
                typeof parsedResponse.data.open_id === 'string' &&
                typeof parsedResponse.request_id === 'string'
            ) {
                return {
                    access_token: parsedResponse.data.access_token,
                    refresh_token: parsedResponse.data.refresh_token,
                    expires_in: parsedResponse.data.expires_in
                };
            }

            throw new NangoError('tiktok_token_request_error', parsedResponse);
        } catch (e: unknown) {
            throw new NangoError('tiktok_token_request_error', (e as Error).message);
        }
    }

    private async refreshTiktokAccountsToken(refreshTokenUrl: string, refreshToken: string, clientId: string, clientSecret: string): Promise<object> {
        try {
            const body = JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            });

            const options: RequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const response = await httpsRequest({ ...options, path: refreshTokenUrl }, body);
            const parsedResponse = JSON.parse(await streamToString(response));
            if (
                parsedResponse &&
                parsedResponse.data &&
                typeof parsedResponse.data.access_token === 'string' &&
                typeof parsedResponse.data.token_type === 'string' &&
                typeof parsedResponse.data.scope === 'string' &&
                typeof parsedResponse.data.expires_in === 'number' &&
                typeof parsedResponse.data.refresh_token === 'string' &&
                typeof parsedResponse.data.refresh_token_expires_in === 'number' &&
                typeof parsedResponse.data.open_id === 'string' &&
                typeof parsedResponse.request_id === 'string'
            ) {
                const responseData: {
                    data: {
                        access_token: string;
                        token_type: string;
                        scope: string;
                        expires_in: number;
                        refresh_token: string;
                        refresh_token_expires_in: number;
                        open_id: string;
                    };
                    request_id: string;
                } = {
                    data: {
                        access_token: parsedResponse.data.access_token,
                        token_type: parsedResponse.data.token_type,
                        scope: parsedResponse.data.scope,
                        expires_in: parsedResponse.data.expires_in,
                        refresh_token: parsedResponse.data.refresh_token,
                        refresh_token_expires_in: parsedResponse.data.refresh_token_expires_in,
                        open_id: parsedResponse.data.open_id
                    },
                    request_id: parsedResponse.request_id
                };
                return {
                    access_token: responseData.data.access_token,
                    token_type: responseData.data.token_type,
                    scope: responseData.data.scope,
                    expires_in: responseData.data.expires_in,
                    refresh_token: responseData.data.refresh_token,
                    refresh_token_expires_in: responseData.data.refresh_token_expires_in,
                    open_id: responseData.data.open_id,
                    request_id: responseData.request_id
                };
            }

            throw new NangoError('tiktok_token_refresh_request_error', parsedResponse);
        } catch (e: unknown) {
            throw new NangoError('tiktok_token_refresh_request_error', (e as Error).message);
        }
    }

    private async refreshFigmaToken(refreshTokenUrl: string, refreshToken: string, clientId: string, clientSecret: string): Promise<RefreshTokenResponse> {
        const body = JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken
        });

        const options: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const response = await httpsRequest({ ...options, path: refreshTokenUrl }, body);
        const parsedResponse = JSON.parse(await streamToString(response));
        if (parsedResponse && typeof parsedResponse.access_token === 'string' && typeof parsedResponse.expires_in === 'number') {
            const responseData: { access_token: string; expires_in: number } = {
                access_token: parsedResponse.access_token,
                expires_in: parsedResponse.expires_in
            };
            return {
                refresh_token: refreshToken,
                access_token: responseData.access_token,
                expires_in: responseData.expires_in
            };
        }
        throw new NangoError('figma_refresh_token_request_error');
    }

    private async refreshFacebookToken(refreshTokenUrl: string, accessToken: string, clientId: string, clientSecret: string): Promise<RefreshTokenResponse> {
        const queryParams = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'fb_exchange_token',
            fb_exchange_token: accessToken
        };
        const urlWithParams = `${refreshTokenUrl}?${qs.stringify(queryParams)}`;

        const options: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const response = await httpsRequest({ ...options, path: urlWithParams });
        const parsedResponse = JSON.parse(await streamToString(response));
        if (parsedResponse && typeof parsedResponse.access_token === 'string' && typeof parsedResponse.expires_in === 'number') {
            const responseData: { access_token: string; expires_in: number } = {
                access_token: parsedResponse.access_token,
                expires_in: parsedResponse.expires_in
            };
            return {
                access_token: responseData.access_token,
                expires_in: responseData.expires_in
            };
        }
        throw new NangoError('facebook_refresh_token_request_error');
    }

    private async createBraintreeToken(code: string, clientId: string, clientSecret: string): Promise<AuthorizationTokenResponse> {
        const gateway = new braintree.BraintreeGateway({ clientId: clientId, clientSecret: clientSecret });
        const res = await gateway.oauth.createTokenFromCode({ code: code });

        if (!('credentials' in res && 'accessToken' in res.credentials && 'refreshToken' in res.credentials && 'expiresAt' in res.credentials)) {
            throw new NangoError('braintree_token_request_error');
        }

        const creds = res['credentials'];

        return {
            access_token: creds['accessToken'],
            refresh_token: creds['refreshToken'],
            expires_in: Math.floor((new Date(creds['expiresAt']).getTime() - Date.now()) / 1000)
        };
    }

    private async refreshBraintreeToken(refreshToken: string, clientId: string, clientSecret: string): Promise<object> {
        const gateway = new braintree.BraintreeGateway({ clientId: clientId, clientSecret: clientSecret });
        const res = await gateway.oauth.createTokenFromRefreshToken({ refreshToken: refreshToken });

        if (!('credentials' in res && 'accessToken' in res.credentials && 'refreshToken' in res.credentials && 'expiresAt' in res.credentials)) {
            throw new NangoError('braintree_token_refresh_error');
        }

        const creds = res['credentials'];

        return {
            access_token: creds['accessToken'],
            refresh_token: creds['refreshToken'],
            expires_at: creds['expiresAt']
        };
    }

}

export default new ProviderClient();
