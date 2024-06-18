export declare class AuthError extends Error {
    type: string;
    constructor(message: string, type: string);
}
export interface AuthResult {
    providerConfigKey: string;
    connectionId: string;
    isPending?: boolean;
}
interface AuthOptions {
    detectClosedAuthWindow?: boolean;
}
export default class Nango {
    private hostBaseUrl;
    private websocketsBaseUrl;
    private status;
    private publicKey;
    private debug;
    win: null | AuthorizationModal;
    private width;
    private height;
    private tm;
    constructor(config: { host?: string; websocketsPath?: string; publicKey: string; width?: number; height?: number; debug?: boolean });
    /**
     * Creates a new unauthenticated connection using the specified provider configuration key and connection ID
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId -  The ID of the connection
     * @param connectionConfig - Optional. Additional configuration for the connection
     * @returns A promise that resolves with the authentication result
     */
    create(providerConfigKey: string, connectionId: string, connectionConfig?: ConnectionConfig): Promise<AuthResult>;
    /**
     * Initiates the authorization process for a connection
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which to authorize
     * @param options - Optional. Additional options for authorization
     * @returns A promise that resolves with the authorization result
     */
    auth(
        providerConfigKey: string,
        connectionId: string,
        options?: (ConnectionConfig | OAuth2ClientCredentials | OAuthCredentialsOverride | BasicApiCredentials | ApiKeyCredentials | AppStoreCredentials) &
            AuthOptions
    ): Promise<AuthResult>;
    /**
     * Converts the provided credentials to a Connection configuration object
     * @param credentials - The credentials to convert
     * @returns The connection configuration object
     */
    private convertCredentialsToConfig;
    /**
     * Performs authorization based on the provided credentials i.e api, basic, appstore and oauth2
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which to create the custom Authorization
     * @param connectionConfigWithCredentials - The connection configuration containing the credentials
     * @param connectionConfig - Optional. Additional connection configuration
     * @returns A promise that resolves with the authorization result
     */
    private customAuth;
    /**
     * Converts the connection ID and configuration parameters into a query string
     * @param connectionId - The ID of the connection for which to generate a query string
     * @param connectionConfig - Optional. Additional configuration for the connection
     * @returns The generated query string
     */
    private toQueryString;
}
interface ConnectionConfig {
    params?: Record<string, string>;
    hmac?: string;
    user_scope?: string[];
    authorization_params?: Record<string, string | undefined>;
    credentials?: OAuthCredentialsOverride | BasicApiCredentials | ApiKeyCredentials | AppStoreCredentials;
}
interface OAuthCredentialsOverride {
    oauth_client_id_override: string;
    oauth_client_secret_override: string;
}
interface BasicApiCredentials {
    username?: string;
    password?: string;
}
interface ApiKeyCredentials {
    apiKey?: string;
}
interface AppStoreCredentials {
    privateKeyId: string;
    issuerId: string;
    privateKey: string;
    scope?: string[];
}
interface OAuth2ClientCredentials {
    client_id: string;
    client_secret: string;
}
/**
 * AuthorizationModal class
 */
declare class AuthorizationModal {
    private url;
    private features;
    private width;
    private height;
    modal: Window;
    private swClient;
    private debug;
    isProcessingMessage: boolean;
    constructor(
        webSocketUrl: string,
        url: string,
        successHandler: (providerConfigKey: string, connectionId: string) => any,
        errorHandler: (errorType: string, errorDesc: string) => any,
        {
            width,
            height
        }: {
            width?: number | null;
            height?: number | null;
        },
        debug?: boolean
    );
    /**
     * Handles the messages received from the Nango server via WebSocket
     * @param message - The message event containing data from the server
     * @param successHandler - The success handler function to be called when a success message is received
     * @param errorHandler - The error handler function to be called when an error message is received
     */
    handleMessage(
        message: MessageEvent,
        successHandler: (providerConfigKey: string, connectionId: string) => any,
        errorHandler: (errorType: string, errorDesc: string) => any
    ): void;
    /**
     * Calculates the layout dimensions for a modal window based on the expected width and height
     * @param expectedWidth - The expected width of the modal window
     * @param expectedHeight - The expected height of the modal window
     * @returns The layout details including left and top positions, as well as computed width and height
     */
    layout(
        expectedWidth: number,
        expectedHeight: number
    ): {
        left: number;
        top: number;
        computedWidth: number;
        computedHeight: number;
    };
    /**
     * Opens a modal window with the specified WebSocket client ID
     * @param wsClientId - The WebSocket client ID to include in the URL
     * @returns The modal object
     */
    open(wsClientId: string): Window;
    /**
     * Converts the features object of this class to a string
     * @returns The string representation of features
     */
    featuresToString(): string;
}
export {};
