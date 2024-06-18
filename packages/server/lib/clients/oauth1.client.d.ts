/// <reference types="node" resolution-mode="require"/>
import type { IntegrationConfig, Template as ProviderTemplate } from '@nangohq/types';
interface OAuth1RequestTokenResult {
    request_token: string;
    request_token_secret: string;
    parsed_query_string: any;
}
export declare class OAuth1Client {
    private client;
    private config;
    private authConfig;
    constructor(config: IntegrationConfig, template: ProviderTemplate, callbackUrl: string);
    getOAuthRequestToken(): Promise<OAuth1RequestTokenResult>;
    getOAuthAccessToken(oauth_token: string, oauth_token_secret: string, oauth_token_verifier: string): Promise<any>;
    getAuthorizationURL(requestToken: OAuth1RequestTokenResult): string;
}
export declare function extractQueryParams(data: string | Buffer | undefined): Record<string, any>;
export {};
