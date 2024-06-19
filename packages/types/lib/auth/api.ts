import type { AuthOperation } from '../sharedAuthTypes.js';

export interface ConnectionUpsertResponse {
    id: number;
    operation: AuthOperation;
}

export interface OAuth1RequestTokenResult {
    request_token: string;
    request_token_secret: string;
    parsed_query_string: any;
}

export interface CredentialsRefresh<T = unknown> {
    providerConfigKey: string;
    connectionId: string;
    promise: Promise<T>;
}
