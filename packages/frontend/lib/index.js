/*
 * Copyright (c) 2023 Nango, all rights reserved.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
const prodHost = 'https://api.nango.dev';
const debugLogPrefix = 'NANGO DEBUG LOG: ';
export class AuthError extends Error {
    constructor(message, type) {
        super(message);
        this.type = type;
    }
}
export default class Nango {
    constructor(config) {
        this.debug = false;
        this.win = null;
        this.width = null;
        this.height = null;
        this.tm = null;
        config.host = config.host || prodHost; // Default to Nango Cloud.
        config.websocketsPath = config.websocketsPath || '/'; // Default to root path.
        this.debug = config.debug || false;
        if (this.debug) {
            console.log(debugLogPrefix, `Debug mode is enabled.`);
            console.log(debugLogPrefix, `Using host: ${config.host}.`);
        }
        if (config.width) {
            this.width = config.width;
        }
        if (config.height) {
            this.height = config.height;
        }
        this.hostBaseUrl = config.host.slice(-1) === '/' ? config.host.slice(0, -1) : config.host; // Remove trailing slash.
        this.status = AuthorizationStatus.IDLE;
        this.publicKey = config.publicKey;
        if (!config.publicKey) {
            throw new AuthError('You must specify a public key (cf. documentation).', 'missingPublicKey');
        }
        try {
            const baseUrl = new URL(this.hostBaseUrl);
            // Build the websockets url based on the host url.
            // The websockets path is considered relative to the baseUrl, and with the protocol updated
            const websocketUrl = new URL(config.websocketsPath, baseUrl);
            this.websocketsBaseUrl = websocketUrl.toString().replace('https://', 'wss://').replace('http://', 'ws://');
        }
        catch (_a) {
            throw new AuthError('Invalid URL provided for the Nango host.', 'invalidHostUrl');
        }
    }
    /**
     * Creates a new unauthenticated connection using the specified provider configuration key and connection ID
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId -  The ID of the connection
     * @param connectionConfig - Optional. Additional configuration for the connection
     * @returns A promise that resolves with the authentication result
     */
    create(providerConfigKey, connectionId, connectionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.hostBaseUrl + `/unauth/${providerConfigKey}${this.toQueryString(connectionId, connectionConfig)}`;
            const res = yield fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                const errorResponse = yield res.json();
                throw new AuthError(errorResponse.error, errorResponse.type);
            }
            return res.json();
        });
    }
    /**
     * Initiates the authorization process for a connection
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which to authorize
     * @param options - Optional. Additional options for authorization
     * @returns A promise that resolves with the authorization result
     */
    auth(providerConfigKey, connectionId, options) {
        if (options &&
            'credentials' in options &&
            (!('oauth_client_id_override' in options.credentials) || !('oauth_client_secret_override' in options.credentials)) &&
            Object.keys(options.credentials).length > 0) {
            const credentials = options.credentials;
            const _a = options, { credentials: _ } = _a, connectionConfig = __rest(_a, ["credentials"]);
            return this.customAuth(providerConfigKey, connectionId, this.convertCredentialsToConfig(credentials), connectionConfig);
        }
        const url = this.hostBaseUrl + `/oauth/connect/${providerConfigKey}${this.toQueryString(connectionId, options)}`;
        try {
            new URL(url);
        }
        catch (_b) {
            throw new AuthError('Invalid URL provided for the Nango host.', 'invalidHostUrl');
        }
        return new Promise((resolve, reject) => {
            const successHandler = (providerConfigKey, connectionId, isPending = false) => {
                if (this.status !== AuthorizationStatus.BUSY) {
                    return;
                }
                this.status = AuthorizationStatus.DONE;
                return resolve({
                    providerConfigKey: providerConfigKey,
                    connectionId: connectionId,
                    isPending
                });
            };
            const errorHandler = (errorType, errorDesc) => {
                if (this.status !== AuthorizationStatus.BUSY) {
                    return;
                }
                this.status = AuthorizationStatus.DONE;
                const error = new AuthError(errorDesc, errorType);
                return reject(error);
            };
            if (this.status === AuthorizationStatus.BUSY) {
                const error = new AuthError('The authorization window is already opened', 'windowIsOppened');
                reject(error);
            }
            // Save authorization status (for handler)
            this.status = AuthorizationStatus.BUSY;
            // Open authorization modal
            this.win = new AuthorizationModal(this.websocketsBaseUrl, url, successHandler, errorHandler, { width: this.width, height: this.height }, this.debug);
            if ((options === null || options === void 0 ? void 0 : options.detectClosedAuthWindow) || false) {
                this.tm = setInterval(() => {
                    var _a, _b;
                    if (!((_a = this.win) === null || _a === void 0 ? void 0 : _a.modal.window) || this.win.modal.window.closed) {
                        if (((_b = this.win) === null || _b === void 0 ? void 0 : _b.isProcessingMessage) === true) {
                            // Modal is still processing a web socket message from the server
                            // We ignore the window being closed for now
                            return;
                        }
                        clearTimeout(this.tm);
                        this.win = null;
                        this.status = AuthorizationStatus.CANCELED;
                        const error = new AuthError('The authorization window was closed before the authorization flow was completed', 'windowClosed');
                        reject(error);
                    }
                }, 500);
            }
        });
    }
    /**
     * Converts the provided credentials to a Connection configuration object
     * @param credentials - The credentials to convert
     * @returns The connection configuration object
     */
    convertCredentialsToConfig(credentials) {
        const params = {};
        if ('username' in credentials) {
            params['username'] = credentials.username || '';
        }
        if ('password' in credentials) {
            params['password'] = credentials.password || '';
        }
        if ('apiKey' in credentials) {
            params['apiKey'] = credentials.apiKey || '';
        }
        if ('privateKeyId' in credentials && 'issuerId' in credentials && 'privateKey' in credentials) {
            const appStoreCredentials = {
                params: {
                    privateKeyId: credentials.privateKeyId,
                    issuerId: credentials.issuerId,
                    privateKey: credentials.privateKey
                }
            };
            if (credentials.scope) {
                appStoreCredentials.params['scope'] = credentials.scope;
            }
            return appStoreCredentials;
        }
        if ('client_id' in credentials && 'client_secret' in credentials) {
            const oauth2CCCredentials = {
                client_id: credentials.client_id,
                client_secret: credentials.client_secret
            };
            return { params: oauth2CCCredentials };
        }
        return { params };
    }
    /**
     * Performs authorization based on the provided credentials i.e api, basic, appstore and oauth2
     * @param providerConfigKey - The key identifying the provider configuration on Nango
     * @param connectionId - The ID of the connection for which to create the custom Authorization
     * @param connectionConfigWithCredentials - The connection configuration containing the credentials
     * @param connectionConfig - Optional. Additional connection configuration
     * @returns A promise that resolves with the authorization result
     */
    customAuth(providerConfigKey, connectionId, connectionConfigWithCredentials, connectionConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { params: credentials } = connectionConfigWithCredentials;
            if (!credentials) {
                throw new AuthError('You must specify credentials.', 'missingCredentials');
            }
            if ('apiKey' in credentials) {
                const apiKeyCredential = credentials;
                const url = this.hostBaseUrl + `/api-auth/api-key/${providerConfigKey}${this.toQueryString(connectionId, connectionConfig)}`;
                const res = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(apiKeyCredential)
                });
                if (!res.ok) {
                    const errorResponse = yield res.json();
                    throw new AuthError(errorResponse.error, errorResponse.type);
                }
                return res.json();
            }
            if ('username' in credentials || 'password' in credentials) {
                const basicCredentials = credentials;
                const url = this.hostBaseUrl + `/api-auth/basic/${providerConfigKey}${this.toQueryString(connectionId, connectionConfig)}`;
                const res = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(basicCredentials)
                });
                if (!res.ok) {
                    const errorResponse = yield res.json();
                    throw new AuthError(errorResponse.error, errorResponse.type);
                }
                return res.json();
            }
            if ('privateKeyId' in credentials && 'issuerId' in credentials && 'privateKey' in credentials) {
                const appCredentials = credentials;
                const url = this.hostBaseUrl + `/app-store-auth/${providerConfigKey}${this.toQueryString(connectionId, connectionConfig)}`;
                const res = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appCredentials)
                });
                if (!res.ok) {
                    const errorResponse = yield res.json();
                    throw new AuthError(errorResponse.error, errorResponse.type);
                }
                return res.json();
            }
            if ('client_id' in credentials && 'client_secret' in credentials) {
                const oauthCredentials = credentials;
                const url = this.hostBaseUrl + `/oauth2/auth/${providerConfigKey}${this.toQueryString(connectionId, connectionConfig)}`;
                const res = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(oauthCredentials)
                });
                if (!res.ok) {
                    const errorResponse = yield res.json();
                    throw new AuthError(errorResponse.error, errorResponse.type);
                }
                return res.json();
            }
            return Promise.reject(new Error('Something went wrong with the authorization'));
        });
    }
    /**
     * Converts the connection ID and configuration parameters into a query string
     * @param connectionId - The ID of the connection for which to generate a query string
     * @param connectionConfig - Optional. Additional configuration for the connection
     * @returns The generated query string
     */
    toQueryString(connectionId, connectionConfig) {
        const query = [];
        if (connectionId) {
            query.push(`connection_id=${connectionId}`);
        }
        query.push(`public_key=${this.publicKey}`);
        if (connectionConfig) {
            for (const param in connectionConfig.params) {
                const val = connectionConfig.params[param];
                if (typeof val === 'string') {
                    query.push(`params[${param}]=${val}`);
                }
            }
            if (connectionConfig.hmac) {
                query.push(`hmac=${connectionConfig.hmac}`);
            }
            if (connectionConfig.user_scope) {
                query.push(`user_scope=${connectionConfig.user_scope.join(',')}`);
            }
            if (connectionConfig.credentials) {
                const credentials = connectionConfig.credentials;
                if ('oauth_client_id_override' in credentials) {
                    query.push(`credentials[oauth_client_id_override]=${encodeURIComponent(credentials.oauth_client_id_override)}`);
                }
                if ('oauth_client_secret_override' in credentials) {
                    query.push(`credentials[oauth_client_secret_override]=${encodeURIComponent(credentials.oauth_client_secret_override)}`);
                }
            }
            for (const param in connectionConfig.authorization_params) {
                const val = connectionConfig.authorization_params[param];
                if (typeof val === 'string') {
                    query.push(`authorization_params[${param}]=${val}`);
                }
                else if (val === undefined) {
                    query.push(`authorization_params[${param}]=undefined`);
                }
            }
        }
        return query.length === 0 ? '' : '?' + query.join('&');
    }
}
var AuthorizationStatus;
(function (AuthorizationStatus) {
    AuthorizationStatus[AuthorizationStatus["IDLE"] = 0] = "IDLE";
    AuthorizationStatus[AuthorizationStatus["BUSY"] = 1] = "BUSY";
    AuthorizationStatus[AuthorizationStatus["CANCELED"] = 2] = "CANCELED";
    AuthorizationStatus[AuthorizationStatus["DONE"] = 3] = "DONE";
})(AuthorizationStatus || (AuthorizationStatus = {}));
/**
 * AuthorizationModal class
 */
class AuthorizationModal {
    constructor(webSocketUrl, url, successHandler, errorHandler, { width, height }, debug) {
        this.width = 500;
        this.height = 600;
        this.isProcessingMessage = false;
        // Window modal URL
        this.url = url;
        this.debug = debug || false;
        const { left, top, computedWidth, computedHeight } = this.layout(width || this.width, height || this.height);
        // Window modal features
        this.features = {
            width: computedWidth,
            height: computedHeight,
            top,
            left,
            scrollbars: 'yes',
            resizable: 'yes',
            status: 'no',
            toolbar: 'no',
            location: 'no',
            copyhistory: 'no',
            menubar: 'no',
            directories: 'no'
        };
        this.modal = window.open('', '_blank', this.featuresToString());
        this.swClient = new WebSocket(webSocketUrl);
        this.swClient.onmessage = (message) => {
            this.isProcessingMessage = true;
            this.handleMessage(message, successHandler, errorHandler);
            this.isProcessingMessage = false;
        };
    }
    /**
     * Handles the messages received from the Nango server via WebSocket
     * @param message - The message event containing data from the server
     * @param successHandler - The success handler function to be called when a success message is received
     * @param errorHandler - The error handler function to be called when an error message is received
     */
    handleMessage(message, successHandler, errorHandler) {
        const data = JSON.parse(message.data);
        switch (data.message_type) {
            case "connection_ack" /* WSMessageType.ConnectionAck */: {
                if (this.debug) {
                    console.log(debugLogPrefix, 'Connection ack received. Opening modal...');
                }
                const wsClientId = data.ws_client_id;
                this.open(wsClientId);
                break;
            }
            case "error" /* WSMessageType.Error */:
                if (this.debug) {
                    console.log(debugLogPrefix, 'Error received. Rejecting authorization...');
                }
                errorHandler(data.error_type, data.error_desc);
                this.swClient.close();
                break;
            case "success" /* WSMessageType.Success */:
                if (this.debug) {
                    console.log(debugLogPrefix, 'Success received. Resolving authorization...');
                }
                successHandler(data.provider_config_key, data.connection_id);
                this.swClient.close();
                break;
            default:
                if (this.debug) {
                    console.log(debugLogPrefix, 'Unknown message type received from Nango server. Ignoring...');
                }
                return;
        }
    }
    /**
     * Calculates the layout dimensions for a modal window based on the expected width and height
     * @param expectedWidth - The expected width of the modal window
     * @param expectedHeight - The expected height of the modal window
     * @returns The layout details including left and top positions, as well as computed width and height
     */
    layout(expectedWidth, expectedHeight) {
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const left = screenWidth / 2 - expectedWidth / 2;
        const top = screenHeight / 2 - expectedHeight / 2;
        const computedWidth = Math.min(expectedWidth, screenWidth);
        const computedHeight = Math.min(expectedHeight, screenHeight);
        return { left: Math.max(left, 0), top: Math.max(top, 0), computedWidth, computedHeight };
    }
    /**
     * Opens a modal window with the specified WebSocket client ID
     * @param wsClientId - The WebSocket client ID to include in the URL
     * @returns The modal object
     */
    open(wsClientId) {
        this.modal.location = this.url + '&ws_client_id=' + wsClientId;
        return this.modal;
    }
    /**
     * Converts the features object of this class to a string
     * @returns The string representation of features
     */
    featuresToString() {
        const features = this.features;
        const featuresAsString = [];
        for (const key in features) {
            featuresAsString.push(key + '=' + features[key]);
        }
        return featuresAsString.join(',');
    }
}
//# sourceMappingURL=index.js.map