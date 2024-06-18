export interface WSErr {
    type: string;
    message: string;
}
export declare function UnknownAuthMode(authMode: string): WSErr;
export declare function ConnectionNotFound(connectionId: string): WSErr;
export declare function InvalidCallbackOAuth1(): WSErr;
export declare function InvalidCallbackOAuth2(): WSErr;
export declare function EnvironmentOrAccountNotFound(): WSErr;
export declare function UnknownGrantType(grantType: string): WSErr;
export declare function MissingConnectionId(): WSErr;
export declare function MissingProviderConfigKey(): WSErr;
export declare function UnknownProviderConfigKey(providerConfigKey: string): WSErr;
export declare function InvalidProviderConfig(providerConfigKey: string): WSErr;
export declare function InvalidState(state: string): WSErr;
export declare function TokenError(): WSErr;
export declare function UnknownProviderTemplate(providerTemplate: string): WSErr;
export declare function InvalidConnectionConfig(url: string, params: string): WSErr;
export declare function UnknownError(errorMessage?: string): WSErr;
export declare function MissingHmac(): WSErr;
export declare function InvalidHmac(): WSErr;
