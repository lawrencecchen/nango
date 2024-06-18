var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import oAuth1 from 'oauth';
// The choice of OAuth 1.0a libraries for node is not exactly great:
// There are a half-dozen around but none of the is really maintained anymore (no surprise, OAuth 1.0 is officially deprecated)
// We still need to support it though because a few dozen important services are still using it, e.g. Twitter, Etsy, Sellsy, Trello
// node-oauth seems to be stable since years, offers plenty of config flexibility and is at least somewhat maintained. Best of the bunch IMO as of August 2022
// Unfortunately it is dated and still uses callbacks, this wrapper here makes it easier to use with a promise API
// For reference, this is a pretty good graphic on the OAuth 1.0a flow: https://oauth.net/core/1.0/#anchor9
export class OAuth1Client {
    constructor(config, template, callbackUrl) {
        var _a;
        this.config = config;
        this.authConfig = template;
        const headers = { 'User-Agent': 'Nango' };
        this.client = new oAuth1.OAuth(this.authConfig.request_url, typeof this.authConfig.token_url === 'string' ? this.authConfig.token_url : (_a = this.authConfig.token_url) === null || _a === void 0 ? void 0 : _a['OAUTH1'], this.config.oauth_client_id, this.config.oauth_client_secret, '1.0A', callbackUrl, this.authConfig.signature_method, undefined, headers);
        this.client.setClientOptions({
            requestTokenHttpMethod: this.authConfig.request_http_method || 'POST',
            accessTokenHttpMethod: this.authConfig.token_http_method || 'POST',
            followRedirects: true
        });
    }
    getOAuthRequestToken() {
        return __awaiter(this, void 0, void 0, function* () {
            let additionalTokenParams = {};
            if (this.authConfig.request_params) {
                additionalTokenParams = this.authConfig.request_params;
            }
            const promise = new Promise((resolve, reject) => {
                this.client.getOAuthRequestToken(additionalTokenParams, (error, token, token_secret, parsed_query_string) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve({
                            request_token: token,
                            request_token_secret: token_secret,
                            parsed_query_string: parsed_query_string
                        });
                    }
                });
            });
            return promise;
        });
    }
    getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_token_verifier) {
        return __awaiter(this, void 0, void 0, function* () {
            let additionalTokenParams = {};
            if (this.authConfig.token_params) {
                additionalTokenParams = this.authConfig.token_params;
            }
            const promise = new Promise((resolve, reject) => {
                // This is lifted from https://github.com/ciaranj/node-oauth/blob/master/lib/oauth.js#L456
                // Unfortunately that main method does not expose extra params like the initial token request does ¯\_(ツ)_/¯
                additionalTokenParams['oauth_verifier'] = oauth_token_verifier;
                // @ts-expect-error we access private method
                this.client._performSecureRequest(oauth_token, oauth_token_secret, 
                // @ts-expect-error we access private method
                this.client._clientOptions.accessTokenHttpMethod, 
                // @ts-expect-error we access private method
                this.client._accessUrl, additionalTokenParams, null, undefined, function (error, data, _response) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(extractQueryParams(data));
                });
            });
            return promise;
        });
    }
    getAuthorizationURL(requestToken) {
        const scopes = this.config.oauth_scopes ? this.config.oauth_scopes.split(',').join(this.authConfig.scope_separator || ' ') : '';
        let additionalAuthParams = {};
        if (this.authConfig.authorization_params) {
            additionalAuthParams = this.authConfig.authorization_params;
        }
        const queryParams = Object.assign({ oauth_token: requestToken.request_token, scope: scopes }, additionalAuthParams);
        const url = new URL(this.authConfig.authorization_url);
        const params = new URLSearchParams(queryParams);
        return `${url.href}?${params.toString()}`;
    }
}
export function extractQueryParams(data) {
    return Object.fromEntries(new URLSearchParams(typeof data === 'string' ? data : data === null || data === void 0 ? void 0 : data.toString()));
}
//# sourceMappingURL=oauth1.client.js.map