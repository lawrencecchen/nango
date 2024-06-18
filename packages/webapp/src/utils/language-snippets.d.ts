import type { NangoSyncEndpoint, NangoSyncModel } from '../types';
export declare const nodeSnippet: (models: string | NangoSyncModel[] | undefined, secretKey: string, connectionId: string, providerConfigKey: string) => string;
export declare const nodeActionSnippet: (
    actionName: string,
    secretKey: string,
    connectionId: string,
    providerConfigKey: string,
    input?: Record<string, any> | string,
    safeInput?: boolean
) => string;
export declare const curlSnippet: (
    baseUrl: string,
    endpoint: string | NangoSyncEndpoint | NangoSyncEndpoint[],
    secretKey: string,
    connectionId: string,
    providerConfigKey: string,
    input?: Record<string, any> | string,
    method?: string
) => string;
export declare const autoStartSnippet: (secretKey: string, provider: string, sync: string) => string;
export declare const setMetadaSnippet: (secretKey: string, provider: string, input: Record<string, any>) => string;
