export function UnknownAuthMode(authMode) {
    return {
        type: 'auth_mode_err',
        message: `Auth mode ${authMode} not supported.`
    };
}
export function ConnectionNotFound(connectionId) {
    return {
        type: 'connection_not_found',
        message: `Connection ${connectionId} not found.`
    };
}
export function InvalidCallbackOAuth1() {
    return {
        type: 'callback_err',
        message: `Did not get oauth_token and/or oauth_verifier in the callback.`
    };
}
export function InvalidCallbackOAuth2() {
    return {
        type: 'callback_err',
        message: `Did not get authorization code in the callback.`
    };
}
export function EnvironmentOrAccountNotFound() {
    return {
        type: 'account_or_environment_retrieval_err',
        message: `The account or environment could not be retrieved.`
    };
}
export function UnknownGrantType(grantType) {
    return {
        type: 'grant_type_err',
        message: `The grant type "${grantType}" is not supported by this OAuth flow.`
    };
}
export function MissingConnectionId() {
    return {
        type: 'missing_connection_id',
        message: `Missing Connection ID.`
    };
}
export function MissingProviderConfigKey() {
    return {
        type: 'no_provider_config_key',
        message: `Missing Provider Config unique key.`
    };
}
export function UnknownProviderConfigKey(providerConfigKey) {
    return {
        type: 'provider_config_err',
        message: `Could not find a Provider Config matching the "${providerConfigKey}" key.`
    };
}
export function InvalidProviderConfig(providerConfigKey) {
    return {
        type: 'provider_config_err',
        message: `Provider Config "${providerConfigKey}" is missing client ID, secret and/or scopes.`
    };
}
export function InvalidState(state) {
    return {
        type: 'state_err',
        message: `Invalid state parameter passed in the callback: ${state}`
    };
}
export function TokenError() {
    return {
        type: 'token_err',
        message: `Error storing/retrieving the token.`
    };
}
export function UnknownProviderTemplate(providerTemplate) {
    return {
        type: 'unknown_config_key',
        message: `No Provider Configuration with key "${providerTemplate}".`
    };
}
export function InvalidConnectionConfig(url, params) {
    return {
        type: 'url_param_err',
        message: `Missing Connection Config param(s) in Auth request to interpolate url ${url}. Provided Connection Config: ${params}`
    };
}
export function UnknownError(errorMessage) {
    return {
        type: 'unknown_err',
        message: `Unknown error during the Oauth flow.${errorMessage ? ' ' + errorMessage : ''}`
    };
}
export function MissingHmac() {
    return {
        type: 'missing_hmac',
        message: `Missing HMAC digest.`
    };
}
export function InvalidHmac() {
    return {
        type: 'invalid_hmac',
        message: `Invalid HMAC digest.`
    };
}
//# sourceMappingURL=web-socket-error.js.map