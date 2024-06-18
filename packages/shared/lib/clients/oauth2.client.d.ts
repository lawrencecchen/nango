import type { TemplateOAuth2 as ProviderTemplateOAuth2, Template as ProviderTemplate } from '@nangohq/types';
import type { ModuleOptions, WreckHttpOptions } from 'simple-oauth2';
import type { Merge } from 'type-fest';

import type { Config as ProviderConfig, OAuth2Credentials, Connection } from '../models/index.js';
import type { ServiceResponse } from '../models/Generic.js';
export declare function getSimpleOAuth2ClientConfig(
    providerConfig: ProviderConfig,
    template: ProviderTemplate,
    connectionConfig: Record<string, string>
): Merge<
    ModuleOptions,
    {
        http: WreckHttpOptions;
    }
>;
export declare function getFreshOAuth2Credentials(
    connection: Connection,
    config: ProviderConfig,
    template: ProviderTemplateOAuth2
): Promise<ServiceResponse<OAuth2Credentials>>;
