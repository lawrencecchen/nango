import type {
    ApiKeyCredentials,
    AppCredentials,
    BasicApiCredentials,
    Connection,
    ConnectionList,
    CreateConnectionOAuth1,
    CreateConnectionOAuth2,
    GetRecordsRequestConfig,
    Integration,
    IntegrationWithCreds,
    ListRecordsRequestConfig,
    Metadata,
    NangoProps,
    OAuth1Token,
    ProxyConfiguration,
    RecordMetadata,
    StandardNangoConfig,
    SyncStatusResponse,
    UpdateSyncFrequencyResponse
} from './types.js';
export declare const stagingHost = 'https://api-staging.nango.dev';
export declare const prodHost = 'https://api.nango.dev';
export * from './types.js';
export { getUserAgent } from './utils.js';
export declare enum SyncType {
    INITIAL = 'INITIAL',
    INCREMENTAL = 'INCREMENTAL'
}
export declare class Nango {
    serverUrl: string;
    secretKey: string;
    connectionId?: string;
    providerConfigKey?: string;
    isSync: boolean;
    dryRun: boolean;
    activityLogId?: number | string | undefined;
    userAgent: string;
    constructor(
        config: NangoProps,
        {
            userAgent
        }?: {
            userAgent?: string;
        }
    );
    /**
     * =======
     * INTEGRATIONS
     *      LIST
     *      GET
     *      CREATE
     *      UPDATE
     *      DELETE
     * =======
     */
    /**
     * Returns a list of integrations
     * @returns A promise that resolves with an object containing an array of integration configurations
     */
    listIntegrations(): Promise<{
        configs: Pick<Integration, 'unique_key' | 'provider'>[];
    }>;
    /**
     * Returns a specific integration
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param includeIntegrationCredentials - An optional flag indicating whether to include integration credentials in the response. Default is false
     * @returns A promise that resolves with an object containing an integration configuration
     */
    getIntegration(
        providerConfigKey: string,
        includeIntegrationCredentials?: boolean
    ): Promise<{
        config: Integration | IntegrationWithCreds;
    }>;
    /**
     * Creates a new integration with the specified provider and configuration key
     * Optionally, you can provide credentials for the integration
     * @param provider - The provider of the integration
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param credentials - Optional credentials for the integration
     * @returns A promise that resolves with the created integration configuration
     */
    createIntegration(
        provider: string,
        providerConfigKey: string,
        credentials?: Record<string, string>
    ): Promise<{
        config: Integration;
    }>;
    /**
     * Returns a list of connections, optionally filtered by connection ID
     * @param connectionId - Optional. The ID of the connection to retrieve details of
     * @returns A promise that resolves with an array of connection objects
     */
    listConnections(connectionId?: string): Promise<{
        connections: ConnectionList[];
    }>;
    /**
     * Returns a connection object, which also contains access credentials and full credentials payload
     * @param providerConfigKey - The integration ID used to create the connection (i.e Unique Key)
     * @param connectionId - This is the unique connection identifier used to identify this connection
     * @param forceRefresh - Optional. When set to true, this obtains a new access token from the provider before the current token has expired
     * @param refreshToken - Optional. When set to true, this returns the refresh token as part of the response
     * @returns A promise that resolves with a connection object
     */
    getConnection(providerConfigKey: string, connectionId: string, forceRefresh?: boolean, refreshToken?: boolean): Promise<Connection>;
    /**
     * @deprecated This method has been deprecated, please use the REST API to import a connection.
     */
    importConnection(
        _connectionArgs:
            | CreateConnectionOAuth1
            | (CreateConnectionOAuth2 & {
                  metadata: string;
                  connection_config: string;
              })
    ): void;
    /**
     * @deprecated This method has been deprecated, please use the REST API to import a connection.
     */
    createConnection(
        _connectionArgs:
            | CreateConnectionOAuth1
            | (CreateConnectionOAuth2 & {
                  metadata: string;
                  connection_config: string;
              })
    ): void;
    /**
     * For OAuth 2: returns the access token directly as a string
     * For OAuth 2: If you want to obtain a new refresh token from the provider before the current token has expired,
     * you can set the forceRefresh argument to true
     * For OAuth 1: returns an object with 'oAuthToken' and 'oAuthTokenSecret' fields
     * @param providerConfigKey - The integration ID used to create the connection (i.e Unique Key)
     * @param connectionId - This is the unique connection identifier used to identify this connection
     * @param forceRefresh - Optional. When set to true, this obtains a new access token from the provider before the current token has expired
     */
    getToken(
        providerConfigKey: string,
        connectionId: string,
        forceRefresh?: boolean
    ): Promise<string | OAuth1Token | BasicApiCredentials | ApiKeyCredentials | AppCredentials>;
    /**
     * Get the full (fresh) credentials payload returned by the external API,
     * which also contains access credentials
     * @param providerConfigKey - The integration ID used to create the connection (i.e Unique Key)
     * @param connectionId - This is the unique connection identifier used to identify this connection
     * @param forceRefresh - Optional. When set to true, this obtains a new access token from the provider before the current token has expired
     * @returns A promise that resolves with the raw token response
     */
    getRawTokenResponse<T = Record<string, any>>(providerConfigKey: string, connectionId: string, forceRefresh?: boolean): Promise<T>;
    /**
     * Retrieves metadata for a given provider configuration key and connection ID
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which to retrieve metadata
     * @returns A promise that resolves with the retrieved metadata
     */
    getMetadata<T = Metadata>(providerConfigKey: string, connectionId: string): Promise<T>;
    /**
     * Sets custom metadata for a connection
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID(s) of the connection(s) for which to set metadata
     * @param metadata - The custom metadata to set
     * @returns A promise that resolves with the Axios response from the server
     */
    setMetadata(providerConfigKey: string, connectionId: string | string[], metadata: Metadata): Promise<Response>;
    /**
     * Edits custom metadata for a connection, only overriding specified properties, not the entire metadata
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID(s) of the connection(s) for which to update metadata
     * @param metadata - The custom metadata to update
     * @returns A promise that resolves with the Axios response from the server
     */
    updateMetadata(providerConfigKey: string, connectionId: string | string[], metadata: Metadata): Promise<Response>;
    /**
     * Deletes a specific connection
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection to be deleted
     * @returns A promise that resolves with the Axios response from the server
     */
    deleteConnection(providerConfigKey: string, connectionId: string): Promise<Response>;
    /**
     * =======
     * SCRIPTS
     *      CONFIG
     * =======
     */
    /**
     * Retrieves the configuration for all integration scripts
     * @returns A promise that resolves with an array of configuration objects for all integration scripts
     */
    getScriptsConfig(): Promise<StandardNangoConfig[]>;
    /**
     * =======
     * SYNCS
     *      GET RECORDS
     *      TRIGGER
     *      START
     *      PAUSE
     *      STATUS
     *      GET ENVIRONMENT VARIABLES
     * =======
     */
    /**
     * @deprecated. Use listRecords() instead.
     */
    getRecords<T = any>(
        config: GetRecordsRequestConfig
    ): Promise<
        (T & {
            _nango_metadata: RecordMetadata;
        })[]
    >;
    /**
     * Returns the synced data, ordered by modification date ascending
     * If some records are updated while you paginate through this endpoint, you might see these records multiple times
     * @param config - Configuration object for listing records
     * @returns A promise that resolves with an object containing an array of records and a cursor for pagination
     */
    listRecords<T extends Record<string, any> = Record<string, any>>(
        config: ListRecordsRequestConfig
    ): Promise<{
        records: (T & {
            _nango_metadata: RecordMetadata;
        })[];
        next_cursor: string | null;
    }>;
    /**
     * Triggers an additional, one-off execution of specified sync(s) for a given connection or all applicable connections if no connection is specified
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param syncs - An optional array of sync names to trigger. If empty, all applicable syncs will be triggered
     * @param connectionId - An optional ID of the connection for which to trigger the syncs. If not provided, syncs will be triggered for all applicable connections
     * @param fullResync - An optional flag indicating whether to perform a full resynchronization. Default is false
     * @returns A promise that resolves when the sync trigger request is sent
     */
    triggerSync(providerConfigKey: string, syncs?: string[], connectionId?: string, fullResync?: boolean): Promise<void>;
    /**
     * Starts the schedule of specified sync(s) for a given connection or all applicable connections if no connection is specified
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param syncs - An optional array of sync names to start. If empty, all applicable syncs will be started
     * @param connectionId - An optional ID of the connection for which to start the syncs. If not provided, syncs will be started for all applicable connections
     * @returns A promise that resolves when the sync start request is sent
     */
    startSync(providerConfigKey: string, syncs: string[], connectionId?: string): Promise<void>;
    /**
     * Pauses the schedule of specified sync(s) for a given connection or all applicable connections
     * @param providerConfigKey -The key identifying the provider configuration on Nango
     * @param syncs - An optional array of sync names to pause. If empty, all applicable syncs will be paused
     * @param connectionId - An optional ID of the connection for which to pause the syncs. If not provided, syncs will be paused for all applicable connections
     * @returns A promise that resolves when the sync pause request is sent
     */
    pauseSync(providerConfigKey: string, syncs: string[], connectionId?: string): Promise<void>;
    /**
     * Get the status of specified sync(s) for a given connection or all applicable connections
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param syncs - An array of sync names to get status for, or '*' to get status for all syncs
     * @param connectionId - An optional ID of the connection for which to get sync status. If not provided, status for all applicable connections will be retrieved
     * @returns A promise that resolves with the status of the specified sync(s)
     */
    syncStatus(providerConfigKey: string, syncs: '*' | string[], connectionId?: string): Promise<SyncStatusResponse>;
    /**
     * Override a sync’s default frequency for a specific connection, or revert to the default frequency
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param sync - The name of the sync to update
     * @param connectionId - The ID of the connection for which to update the sync frequency
     * @param frequency - The new frequency to set for the sync, or null to revert to the default frequency
     * @returns A promise that resolves with the response data after updating the sync frequency
     */
    updateSyncConnectionFrequency(
        providerConfigKey: string,
        sync: string,
        connectionId: string,
        frequency: string | null
    ): Promise<UpdateSyncFrequencyResponse>;
    /**
     * Retrieve the environment variables as added in the Nango dashboard
     * @returns A promise that resolves with an array of environment variables
     */
    getEnvironmentVariables(): Promise<
        {
            name: string;
            value: string;
        }[]
    >;
    /**
     * =======
     * ACTIONS
     *      TRIGGER
     * =======
     */
    /**
     * Triggers an action for a connection
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which the action should be triggered
     * @param actionName - The name of the action to trigger
     * @param input - An optional input data for the action
     * @returns A promise that resolves with an object containing the response data from the triggered action
     */
    triggerAction(providerConfigKey: string, connectionId: string, actionName: string, input?: unknown): Promise<object>;
    /**
     * =======
     * PROXY
     *      GET
     *      POST
     *      PUT
     *      PATCH
     *      DELETE
     * =======
     */
    /**
     * Sends a proxied HTTP request based on the provided configuration
     * @param config - The configuration object for the proxy request
     * @returns A promise that resolves with the response from the proxied request
     */
    proxy(config: ProxyConfiguration): Promise<Response>;
    /**
     * Sends a GET request using the proxy based on the provided configuration
     * @param config - The configuration object for the GET request
     * @returns A promise that resolves with the response from the GET request
     */
    get(config: ProxyConfiguration): Promise<Response>;
    /**
     * Sends a POST request using the proxy based on the provided configuration
     * @param config - The configuration object for the POST request
     * @returns A promise that resolves with the response from the POST request
     */
    post(config: ProxyConfiguration): Promise<Response>;
    /**
     * Sends a PATCH request using the proxy based on the provided configuration
     * @param config - The configuration object for the PATCH request
     * @returns A promise that resolves with the response from the PATCH request
     */
    patch(config: ProxyConfiguration): Promise<Response>;
    /**
     * Sends a DELETE request using the proxy based on the provided configuration
     * @param config - The configuration object for the DELETE request
     * @returns A promise that resolves with the response from the DELETE request
     */
    delete(config: ProxyConfiguration): Promise<Response>;
    /**
     *
     * Verify incoming webhooks signature
     *
     * @param signatureInHeader The value in the header X-Nango-Signature
     * @param jsonPayload The HTTP body as JSON
     * @returns Whether the signature is valid
     */
    verifyWebhookSignature(signatureInHeader: string, jsonPayload: unknown): Promise<boolean>;
    /**
     * Retrieves details of a specific connection
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which to retrieve connection details
     * @param forceRefresh - An optional flag indicating whether to force a refresh of the access tokens. Defaults to false
     * @param refreshToken - An optional flag indicating whether to send the refresh token as part of the response. Defaults to false
     * @param additionalHeader - Optional. Additional headers to include in the request
     * @returns A promise that resolves with the response containing connection details
     */
    private getConnectionDetails;
    /**
     * Retrieves details of all connections from the server or details of a specific connection if a connection ID is provided
     * @param connectionId - Optional. This is the unique connection identifier used to identify this connection
     * @returns A promise that resolves with the response containing connection details
     */
    private listConnectionDetails;
    /**
     * Enriches the headers with the Authorization token
     * @param - Optional. The headers to enrich
     * @returns The enriched headers
     */
    private enrichHeaders;
}
