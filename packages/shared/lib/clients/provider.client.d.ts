import type { TemplateOAuth2 as ProviderTemplateOAuth2 } from '@nangohq/types';

import type { Config as ProviderConfig, Connection } from '../models/index.js';
declare class ProviderClient {
    shouldUseProviderClient(provider: string): boolean;
    shouldIntrospectToken(provider: string): boolean;
    getToken(config: ProviderConfig, tokenUrl: string, code: string, callBackUrl: string, codeVerifier: string): Promise<object>;
    refreshToken(template: ProviderTemplateOAuth2, config: ProviderConfig, connection: Connection): Promise<object>;
    introspectedTokenExpired(config: ProviderConfig, connection: Connection): Promise<boolean>;
    private createFigmaToken;
    private createFacebookToken;
    private createTiktokAdsToken;
    private createStripeAppToken;
    private refreshStripeAppToken;
    private createTiktokAccountsToken;
    private refreshTiktokAccountsToken;
    private refreshFigmaToken;
    private refreshFacebookToken;
    private createBraintreeToken;
    private refreshBraintreeToken;
    private introspectedSalesforceTokenExpired;
}
declare const _default: ProviderClient;
export default _default;
