import type { IncomingMessage, OutgoingHttpHeaders } from 'http';
import type { RequestOptions } from 'https';
import { Nango } from '@nangohq/node';
import configService from '../services/config.service.js';
import paginateService from '../services/paginate.service.js';
import proxyService from '../services/proxy.service.js';
import { httpRequest, httpsRequest } from '@nangohq/utils/lib/http.js';
import { safeStringify } from '../utils/utils.js';
import type { IntegrationWithCreds } from '@nangohq/node';
import type { UserProvidedProxyConfiguration } from '../models/Proxy.js';
import { getLogger, metrics } from '@nangohq/utils';

const logger = getLogger('SDK');

type LogLevel = 'info' | 'debug' | 'error' | 'warn' | 'http' | 'verbose' | 'silly';

type ParamEncoder = (value: unknown, defaultEncoder: (value: unknown) => unknown) => unknown;

interface GenericFormData {
    append(name: string, value: unknown, options?: unknown): unknown;
}

type SerializerVisitor = (
    this: GenericFormData,
    value: unknown,
    key: string | number,
    path: null | (string | number)[],
    helpers: FormDataVisitorHelpers
) => boolean;

type CustomParamsSerializer = (params: Record<string, unknown>, options?: ParamsSerializerOptions) => string;

interface FormDataVisitorHelpers {
    defaultVisitor: SerializerVisitor;
    convertValue: (value: unknown) => unknown;
    isVisitable: (value: unknown) => boolean;
}

interface SerializerOptions {
    visitor?: SerializerVisitor;
    dots?: boolean;
    metaTokens?: boolean;
    indexes?: boolean | null;
}

interface ParamsSerializerOptions extends SerializerOptions {
    encode?: ParamEncoder;
    serialize?: CustomParamsSerializer;
}

export interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: OutgoingHttpHeaders;
    config: {
        url: string | undefined;
        method: string | undefined;
        headers: OutgoingHttpHeaders;
        body: string | undefined;
    };
    request: Record<string, unknown>;
}

export const defaultPersistApi = async (options: RequestOptions, postData: string | undefined): Promise<HttpResponse> => {
    const isHttps = options.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    const response: IncomingMessage = await requestFn(options, postData);

    let responseBody = '';
    for await (const chunk of response) {
        responseBody += (chunk as Buffer).toString();
    }

    return {
        data: JSON.parse(responseBody) as Record<string, unknown>,
        status: response.statusCode ?? 200,
        statusText: response.statusMessage ?? 'OK',
        headers: response.headers as OutgoingHttpHeaders,
        config: {
            url: options.path ?? undefined,
            method: options.method,
            headers: options.headers as OutgoingHttpHeaders,
            body: postData
        },
        request: {}
    };
};

interface UserLogParameters {
    level?: LogLevel;
}

enum PaginationType {
    CURSOR = 'cursor',
    LINK = 'link',
    OFFSET = 'offset'
}

interface Pagination {
    type: string;
    limit?: number;
    response_path?: string;
    limit_name_in_request: string;
}

interface CursorPagination extends Pagination {
    cursor_path_in_response: string;
    cursor_name_in_request: string;
}

interface LinkPagination extends Pagination {
    link_rel_in_response_header?: string;
    link_path_in_response_body?: string;
}

interface OffsetPagination extends Pagination {
    offset_name_in_request: string;
}

interface RetryHeaderConfig {
    at?: string;
    after?: string;
}

export interface ProxyConfiguration {
    endpoint: string;
    providerConfigKey?: string;
    connectionId?: string;
    url?: string;

    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'get' | 'post' | 'patch' | 'put' | 'delete';
    headers?: Record<string, string>;
    params?: string | Record<string, string | number>;
    paramsSerializer?: ParamsSerializerOptions;
    data?: unknown;
    retries?: number;
    baseUrlOverride?: string;
    paginate?: Partial<CursorPagination> | Partial<LinkPagination> | Partial<OffsetPagination>;
    retryHeader?: RetryHeaderConfig;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    retryOn?: number[] | null;
}

enum AuthModes {
    OAuth1 = 'OAUTH1',
    OAuth2 = 'OAUTH2',
    OAuth2CC = 'OAUTH2_CC',
    Basic = 'BASIC',
    ApiKey = 'API_KEY',
    AppStore = 'APP_STORE',
    App = 'APP',
    Custom = 'CUSTOM',
    None = 'NONE'
}

interface OAuth1Token {
    oAuthToken: string;
    oAuthTokenSecret: string;
}

interface AppCredentials {
    type: AuthModes.App;
    access_token: string;
    expires_at?: Date | undefined;
    raw: Record<string, unknown>;
}

interface AppStoreCredentials {
    type?: AuthModes.AppStore;
    access_token: string;
    expires_at?: Date | undefined;
    raw: Record<string, unknown>;
    private_key: string;
}

interface BasicApiCredentials {
    type: AuthModes.Basic;
    username: string;
    password: string;
}

interface ApiKeyCredentials {
    type: AuthModes.ApiKey;
    apiKey: string;
}

interface CredentialsCommon<T = Record<string, unknown>> {
    type: AuthModes;
    raw: T;
}

interface OAuth2Credentials extends CredentialsCommon {
    type: AuthModes.OAuth2;
    access_token: string;

    refresh_token?: string;
    expires_at?: Date | undefined;
}

interface OAuth1Credentials extends CredentialsCommon {
    type: AuthModes.OAuth1;
    oauth_token: string;
    oauth_token_secret: string;
}

type UnauthCredentials = Record<string, never>;

type AuthCredentials =
    | OAuth2Credentials
    | OAuth1Credentials
    | BasicApiCredentials
    | ApiKeyCredentials
    | AppCredentials
    | AppStoreCredentials
    | UnauthCredentials;

type Metadata = Record<string, unknown>;

interface MetadataChangeResponse {
    metadata: Metadata;
    provider_config_key: string;
    connection_id: string | string[];
}

interface Connection {
    id?: number;
    created_at?: Date;
    updated_at?: Date;
    provider_config_key: string;
    connection_id: string;
    connection_config: Record<string, string>;
    environment_id: number;
    metadata?: Metadata | null;
    credentials_iv?: string | null;
    credentials_tag?: string | null;
    credentials: AuthCredentials;
}

export class ActionError<T = Record<string, unknown>> extends Error {
    type: string;
    payload?: Record<string, unknown>;

    constructor(payload?: T) {
        super();
        this.type = 'action_script_runtime_error';
        if (payload) {
            this.payload = payload;
        }
    }
}

interface RunArgs {
    sync: string;
    connectionId: string;
    lastSyncDate?: string;
    useServerLastSyncDate?: boolean;
    input?: object;
    metadata?: Metadata;
    autoConfirm: boolean;
    debug: boolean;
    optionalEnvironment?: string;
    optionalProviderConfigKey?: string;
}

export interface DryRunServiceInterface {
    run: (options: RunArgs, debug?: boolean) => Promise<string | void>;
}

export interface NangoProps {
    host?: string;
    secretKey: string;
    accountId?: number;
    connectionId: string;
    environmentId?: number;
    environmentName?: string;
    activityLogId?: number | undefined;
    providerConfigKey: string;
    provider?: string;
    lastSyncDate?: Date;
    syncId?: string | undefined;
    nangoConnectionId?: number;
    syncJobId?: number | undefined;
    dryRun?: boolean;
    track_deletes?: boolean;
    attributes?: object | undefined;
    logMessages?: { counts: { updated: number; added: number; deleted: number }; messages: unknown[] } | undefined;
    stubbedMetadata?: Metadata | undefined;
    abortSignal?: AbortSignal;
    dryRunService?: DryRunServiceInterface;
}

interface EnvironmentVariable {
    name: string;
    value: string;
}

const MEMOIZED_CONNECTION_TTL = 60000;

/**
 * Create a defaultPersistApi function to replace axios instance
 * This function uses httpRequest and httpsRequest based on the protocol
 */

export class NangoAction {
    protected nango: Nango;
    private attributes = {};
    protected persistApi: typeof defaultPersistApi;
    activityLogId?: number | undefined;
    syncId?: string;
    nangoConnectionId?: number;
    environmentId?: number;
    environmentName?: string;
    syncJobId?: number;
    dryRun?: boolean;
    abortSignal?: AbortSignal;
    dryRunService?: DryRunServiceInterface;

    public connectionId: string;
    public providerConfigKey: string;
    public provider?: string;

    public ActionError = ActionError;

    private memoizedConnections: Map<string, { connection: Connection; timestamp: number } | undefined> = new Map<
        string,
        { connection: Connection; timestamp: number }
    >();
    private memoizedIntegration: IntegrationWithCreds | undefined;

    constructor(config: NangoProps, { persistApi }: { persistApi: typeof defaultPersistApi } = { persistApi: defaultPersistApi }) {
        this.connectionId = config.connectionId;
        this.providerConfigKey = config.providerConfigKey;
        this.persistApi = persistApi;

        if (config.activityLogId) {
            this.activityLogId = config.activityLogId;
        }

        this.nango = new Nango(
            {
                isSync: true,
                ...config
            },
            {
                userAgent: 'sdk'
            }
        );

        if (config.syncId) {
            this.syncId = config.syncId;
        }

        if (config.nangoConnectionId) {
            this.nangoConnectionId = config.nangoConnectionId;
        }

        if (config.syncJobId) {
            this.syncJobId = config.syncJobId;
        }

        if (config.dryRun) {
            this.dryRun = config.dryRun;
        }

        if (config.environmentId) {
            this.environmentId = config.environmentId;
        }

        if (config.environmentName) {
            this.environmentName = config.environmentName;
        }

        if (config.provider) {
            this.provider = config.provider;
        }

        if (config.attributes) {
            this.attributes = config.attributes;
        }

        if (config.abortSignal) {
            this.abortSignal = config.abortSignal;
        }

        if (config.dryRunService) {
            this.dryRunService = config.dryRunService;
        }

        if (this.dryRun !== true && !this.activityLogId) {
            throw new Error('Parameter activityLogId is required when not in dryRun');
        }
    }

    protected stringify(): string {
        return JSON.stringify(this, (key, value) => {
            if (key === 'secretKey') {
                return '********';
            }
            return value;
        });
    }

    private proxyConfig(config: ProxyConfiguration): UserProvidedProxyConfiguration {
        if (!config.connectionId && this.connectionId) {
            config.connectionId = this.connectionId;
        }
        if (!config.providerConfigKey && this.providerConfigKey) {
            config.providerConfigKey = this.providerConfigKey;
        }
        if (!config.connectionId) {
            throw new Error('Missing connection id');
        }
        if (!config.providerConfigKey) {
            throw new Error('Missing provider config key');
        }
        return {
            ...config,
            providerConfigKey: config.providerConfigKey,
            connectionId: config.connectionId,
            headers: {
                ...(config.headers || {}),
                'user-agent': this.nango.userAgent
            }
        };
    }

    protected exitSyncIfAborted(): void {
        if (this.abortSignal?.aborted) {
            process.exit(0);
        }
    }

    public async proxy<T = unknown>(config: ProxyConfiguration): Promise<HttpResponse<T>> {
        this.exitSyncIfAborted();
        if (this.dryRun) {
            const axiosResponse = await this.nango.proxy(config);
            return {
                data: axiosResponse.data as T,
                status: axiosResponse.status,
                statusText: axiosResponse.statusText,
                headers: axiosResponse.headers,
                config: {
                    url: config.url || '',
                    method: config.method,
                    headers: config.headers,
                    body: config.data
                },
                request: {}
            } as HttpResponse<T>;
        } else {
            const { connectionId, providerConfigKey } = config;
            const connection = await this.getConnection(providerConfigKey, connectionId);
            if (!connection) {
                throw new Error(`Connection not found using the provider config key ${this.providerConfigKey} and connection id ${this.connectionId}`);
            }

            const proxyConfig = this.proxyConfig(config);

            const { response, activityLogs: activityLogs } = await proxyService.route(proxyConfig, {
                existingActivityLogId: this.activityLogId as number,
                connection,
                provider: this.provider as string
            });

            if (activityLogs) {
                // Save buffered logs
                for (const log of activityLogs) {
                    if (log.level === 'debug') {
                        continue;
                    }

                    if (!this.dryRun) {
                        await this.sendLogToPersist(log.content, { level: log.level, timestamp: log.timestamp });
                    } else {
                        logger[log.level in logger ? log.level : 'debug'](log.content);
                    }
                }
            }

            if (response instanceof Error) {
                throw response;
            }

            return {
                data: response.data as T,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: {
                    url: config.url || '',
                    method: config.method,
                    headers: config.headers,
                    body: config.data
                },
                request: {}
            } as HttpResponse<T>;
        }
    }

    private async proxyForPagination<T = unknown>(config: UserProvidedProxyConfiguration): Promise<HttpResponse<T>> {
        const httpResponse = await this.proxy<T>(config);
        return {
            data: httpResponse.data,
            status: httpResponse.status,
            statusText: httpResponse.statusText,
            headers: httpResponse.headers,
            config: {
                url: httpResponse.config.url,
                method: httpResponse.config.method,
                headers: httpResponse.config.headers,
                body: httpResponse.config.body
            },
            request: httpResponse.request
        };
    }

    public async get<T = unknown>(config: ProxyConfiguration): Promise<HttpResponse<T>> {
        return this.proxy({
            ...config,
            method: 'GET'
        });
    }

    public async post<T = unknown>(config: ProxyConfiguration): Promise<HttpResponse<T>> {
        return this.proxy({
            ...config,
            method: 'POST'
        });
    }

    public async put<T = unknown>(config: ProxyConfiguration): Promise<HttpResponse<T>> {
        return this.proxy({
            ...config,
            method: 'PUT'
        });
    }

    public async patch<T = unknown>(config: ProxyConfiguration): Promise<HttpResponse<T>> {
        return this.proxy({
            ...config,
            method: 'PATCH'
        });
    }

    public async delete<T = unknown>(config: ProxyConfiguration): Promise<HttpResponse<T>> {
        return this.proxy({
            ...config,
            method: 'DELETE'
        });
    }

    public async getToken(): Promise<string | OAuth1Token | BasicApiCredentials | ApiKeyCredentials | AppCredentials | AppStoreCredentials> {
        this.exitSyncIfAborted();
        return this.nango.getToken(this.providerConfigKey, this.connectionId);
    }

    public async getConnection(providerConfigKeyOverride?: string, connectionIdOverride?: string): Promise<Connection> {
        this.exitSyncIfAborted();

        const providerConfigKey = providerConfigKeyOverride || this.providerConfigKey;
        const connectionId = connectionIdOverride || this.connectionId;

        const credentialsPair = `${providerConfigKey}${connectionId}`;
        const cachedConnection = this.memoizedConnections.get(credentialsPair);

        if (!cachedConnection || Date.now() - cachedConnection.timestamp > MEMOIZED_CONNECTION_TTL) {
            const connection = await this.nango.getConnection(providerConfigKey, connectionId);
            this.memoizedConnections.set(credentialsPair, { connection, timestamp: Date.now() });
            return connection;
        }

        return cachedConnection.connection;
    }

    public async setMetadata(metadata: Metadata): Promise<HttpResponse<MetadataChangeResponse>> {
        this.exitSyncIfAborted();
        try {
            const response = await this.nango.setMetadata(this.providerConfigKey, this.connectionId, metadata);
            return {
                data: response.data as MetadataChangeResponse,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: {
                    url: response.config.url,
                    method: response.config.method,
                    headers: response.config.headers,
                    body: response.config.data
                },
                request: {}
            } as HttpResponse<MetadataChangeResponse>;
        } finally {
            this.memoizedConnections.delete(`${this.providerConfigKey}${this.connectionId}`);
        }
    }

    public async updateMetadata(metadata: Metadata): Promise<HttpResponse<MetadataChangeResponse>> {
        this.exitSyncIfAborted();
        try {
            const response = await this.nango.updateMetadata(this.providerConfigKey, this.connectionId, metadata);
            return {
                data: response.data as MetadataChangeResponse,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: {
                    url: response.config.url,
                    method: response.config.method,
                    headers: response.config.headers,
                    body: response.config.data
                },
                request: {}
            } as HttpResponse<MetadataChangeResponse>;
        } finally {
            this.memoizedConnections.delete(`${this.providerConfigKey}${this.connectionId}`);
        }
    }

    /**
     * @deprecated please use setMetadata instead.
     */
    public async setFieldMapping(fieldMapping: Record<string, string>): Promise<HttpResponse<object>> {
        logger.warn('setFieldMapping is deprecated. Please use setMetadata instead.');
        return this.setMetadata(fieldMapping);
    }

    public async getMetadata<T = Metadata>(): Promise<T> {
        this.exitSyncIfAborted();
        return (await this.getConnection(this.providerConfigKey, this.connectionId)).metadata as T;
    }

    public async getWebhookURL(): Promise<string | undefined> {
        this.exitSyncIfAborted();
        if (this.memoizedIntegration) {
            return this.memoizedIntegration.webhook_url;
        }

        const { config: integration } = await this.nango.getIntegration(this.providerConfigKey, true);
        if (!integration || !integration.provider) {
            throw Error(`There was no provider found for the provider config key: ${this.providerConfigKey}`);
        }
        this.memoizedIntegration = integration as IntegrationWithCreds;
        return this.memoizedIntegration.webhook_url;
    }

    /**
     * @deprecated please use getMetadata instead.
     */
    public async getFieldMapping(): Promise<Metadata> {
        logger.warn('getFieldMapping is deprecated. Please use getMetadata instead.');
        const metadata = await this.getMetadata();
        return (metadata['fieldMapping'] as Metadata) || {};
    }

    /**
     * Log
     * @desc Log a message to the activity log which shows up in the Nango Dashboard
     * note that the last argument can be an object with a level property to specify the log level
     * example: await nango.log('This is a log message', { level: 'error' })
     * error = red
     * warn = orange
     * info = white
     * debug = grey
     * http = green
     * silly = light green
     */
    public async log(message: unknown, options?: { level?: LogLevel } | { [key: string]: unknown; level?: never }): Promise<void>;
    public async log(message: string, ...args: [unknown, { level?: LogLevel }]): Promise<void>;
    public async log(...args: [unknown, { level?: LogLevel }]): Promise<void> {
        this.exitSyncIfAborted();
        if (!Array.isArray(args)) {
            return;
        }

        const lastArg = args[args.length - 1];

        const isUserDefinedLevel = (object: unknown): object is UserLogParameters => {
            return typeof object === 'object' && object !== null && 'level' in object;
        };

        const userDefinedLevel: UserLogParameters | undefined = isUserDefinedLevel(lastArg as UserLogParameters) ? (lastArg as UserLogParameters) : undefined;

        if (userDefinedLevel) {
            args.pop();
        }

        const content = safeStringify(args);

        if (this.dryRun) {
            logger.info([...args]);
            return;
        }

        await this.sendLogToPersist(content, { level: userDefinedLevel?.level ?? 'info', timestamp: Date.now() });
    }

    public async getEnvironmentVariables(): Promise<EnvironmentVariable[] | null> {
        if (!this.environmentId) {
            throw new Error('There is no current environment to get variables from');
        }

        return await this.nango.getEnvironmentVariables();
    }

    public getFlowAttributes<A = object>(): A | null {
        if (!this.syncJobId) {
            throw new Error('There is no current sync to get attributes from');
        }

        return this.attributes as A;
    }

    public async *paginate<T = unknown>(config: ProxyConfiguration): AsyncGenerator<T[], undefined, void> {
        const template = configService.getTemplate(this.provider as string);
        const templatePaginationConfig: Pagination | undefined = template.proxy?.paginate;

        if (!templatePaginationConfig && (!config.paginate || !config.paginate.type)) {
            throw Error('There was no pagination configuration for this integration or configuration passed in.');
        }

        const paginationConfig: Pagination = {
            ...(templatePaginationConfig || {}),
            ...(config.paginate || {})
        } as Pagination;

        paginateService.validateConfiguration(paginationConfig);

        config.method = config.method || 'GET';

        const configMethod: string = config.method.toLocaleLowerCase();
        const passPaginationParamsInBody: boolean = ['post', 'put', 'patch'].includes(configMethod);

        const updatedBodyOrParams: Record<string, string | number> =
            ((passPaginationParamsInBody ? config.data : config.params) as Record<string, string | number>) ?? {};
        const limitParameterName: string = paginationConfig.limit_name_in_request;

        if (paginationConfig['limit']) {
            updatedBodyOrParams[limitParameterName] = paginationConfig['limit'];
        }

        const proxyConfig = this.proxyConfig(config);
        switch (paginationConfig.type.toLowerCase()) {
            case PaginationType.CURSOR:
                return yield* paginateService.cursor<T>(
                    proxyConfig,
                    paginationConfig as CursorPagination,
                    updatedBodyOrParams,
                    passPaginationParamsInBody,
                    this.proxyForPagination.bind(this) as (config: UserProvidedProxyConfiguration) => Promise<HttpResponse<T>>
                );
            case PaginationType.LINK:
                return yield* paginateService.link<T>(
                    proxyConfig,
                    paginationConfig,
                    updatedBodyOrParams,
                    passPaginationParamsInBody,
                    this.proxyForPagination.bind(this) as (config: UserProvidedProxyConfiguration) => Promise<HttpResponse<T>>
                );
            case PaginationType.OFFSET:
                return yield* paginateService.offset<T>(
                    proxyConfig,
                    paginationConfig as OffsetPagination,
                    updatedBodyOrParams,
                    passPaginationParamsInBody,
                    this.proxyForPagination.bind(this) as (config: UserProvidedProxyConfiguration) => Promise<HttpResponse<T>>
                );
            default:
                throw Error(`'${paginationConfig.type} ' pagination is not supported. Please, make sure it's one of ${Object.values(PaginationType)}`);
        }
    }

    public async triggerAction<T = object>(providerConfigKey: string, connectionId: string, actionName: string, input?: unknown): Promise<T> {
        return this.nango.triggerAction(providerConfigKey, connectionId, actionName, input) as T;
    }

    public async triggerSync(providerConfigKey: string, connectionId: string, syncName: string, fullResync?: boolean): Promise<void | string> {
        if (this.dryRun && this.dryRunService) {
            return this.dryRunService.run({
                sync: syncName,
                connectionId,
                autoConfirm: true,
                debug: false
            });
        } else {
            return this.nango.triggerSync(providerConfigKey, [syncName], connectionId, fullResync);
        }
    }

    private async sendLogToPersist(content: string, options: { level: LogLevel; timestamp: number }) {
        const postData = {
            activityLogId: this.activityLogId,
            level: options.level ?? 'info',
            timestamp: options.timestamp,
            msg: content
        };

        const response = await this.persistApi(
            {
                method: 'POST',
                path: `/environment/${this.environmentId}/log`,
                headers: {
                    Authorization: `Bearer ${this.nango.secretKey}`
                }
            },
            JSON.stringify(postData)
        );

        if (response.status > 299) {
            logger.error(`Request to persist API (log) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`, this.stringify());
            throw new Error(`Failed to log: ${JSON.stringify(response.data)}`);
        }
    }
}

export class NangoSync extends NangoAction {
    lastSyncDate?: Date;
    track_deletes = false;
    logMessages?: { counts: { updated: number; added: number; deleted: number }; messages: unknown[] } | undefined = {
        counts: { updated: 0, added: 0, deleted: 0 },
        messages: []
    };
    stubbedMetadata?: Metadata | undefined = undefined;

    private batchSize = 1000;

    constructor(config: NangoProps) {
        super(config);

        if (config.lastSyncDate) {
            this.lastSyncDate = config.lastSyncDate;
        }

        if (config.track_deletes) {
            this.track_deletes = config.track_deletes;
        }

        if (config.logMessages) {
            this.logMessages = config.logMessages;
        }

        if (config.stubbedMetadata) {
            this.stubbedMetadata = config.stubbedMetadata;
        }
    }

    /**
     * @deprecated please use batchSave
     */
    public async batchSend<T = unknown>(results: T[], model: string): Promise<boolean | null> {
        logger.warn('batchSend will be deprecated in future versions. Please use batchSave instead.');
        return this.batchSave(results, model);
    }

    public async batchSave<T = unknown>(results: T[], model: string): Promise<boolean | null> {
        this.exitSyncIfAborted();

        if (!results || results.length === 0) {
            if (this.dryRun) {
                logger.info('batchSave received an empty array. No records to save.');
            }
            return true;
        }

        if (!this.environmentId || !this.nangoConnectionId || !this.syncId || !this.syncJobId) {
            throw new Error('Nango environment Id, Connection Id, Sync Id and Sync Job Id are all required');
        }

        if (this.dryRun) {
            this.logMessages?.messages.push(`A batch save call would save the following data to the ${model} model:`);
            for (const msg of results) {
                this.logMessages?.messages.push(msg);
            }
            if (this.logMessages && this.logMessages.counts) {
                this.logMessages.counts.added = Number(this.logMessages.counts.added) + results.length;
            }
            return null;
        }

        for (let i = 0; i < results.length; i += this.batchSize) {
            const batch = results.slice(i, i + this.batchSize);
            const response = await this.persistApi(
                {
                    method: 'POST',
                    path: `/environment/${this.environmentId}/connection/${this.nangoConnectionId}/sync/${this.syncId}/job/${this.syncJobId}/records`,
                    headers: {
                        Authorization: `Bearer ${this.nango.secretKey}`
                    }
                },
                JSON.stringify({
                    model,
                    records: batch,
                    providerConfigKey: this.providerConfigKey,
                    connectionId: this.connectionId,
                    activityLogId: this.activityLogId
                })
            );
            if (response.status > 299) {
                logger.error(
                    `Request to persist API (batchSave) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`,
                    this.stringify()
                );
                throw new Error(`cannot save records for sync '${this.syncId}': ${JSON.stringify(response.data)}`);
            }
        }
        return true;
    }

    public async batchDelete<T = unknown>(results: T[], model: string): Promise<boolean | null> {
        this.exitSyncIfAborted();
        if (!results || results.length === 0) {
            if (this.dryRun) {
                logger.info('batchDelete received an empty array. No records to delete.');
            }
            return true;
        }

        if (!this.environmentId || !this.nangoConnectionId || !this.syncId || !this.syncJobId) {
            throw new Error('Nango environment Id, Connection Id, Sync Id and Sync Job Id are all required');
        }

        if (this.dryRun) {
            this.logMessages?.messages.push(`A batch delete call would delete the following data:`);
            for (const msg of results) {
                this.logMessages?.messages.push(msg);
            }
            if (this.logMessages && this.logMessages.counts) {
                this.logMessages.counts.deleted = Number(this.logMessages.counts.deleted) + results.length;
            }
            return null;
        }

        for (let i = 0; i < results.length; i += this.batchSize) {
            const batch = results.slice(i, i + this.batchSize);
            const response = await this.persistApi(
                {
                    method: 'DELETE',
                    path: `/environment/${this.environmentId}/connection/${this.nangoConnectionId}/sync/${this.syncId}/job/${this.syncJobId}/records`,
                    headers: {
                        Authorization: `Bearer ${this.nango.secretKey}`
                    }
                },
                JSON.stringify({
                    model,
                    records: batch,
                    providerConfigKey: this.providerConfigKey,
                    connectionId: this.connectionId,
                    activityLogId: this.activityLogId
                })
            );
            if (response.status > 299) {
                logger.error(
                    `Request to persist API (batchDelete) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`,
                    this.stringify()
                );
                throw new Error(`cannot delete records for sync '${this.syncId}': ${JSON.stringify(response.data)}`);
            }
        }
        return true;
    }

    public async batchUpdate<T = unknown>(results: T[], model: string): Promise<boolean | null> {
        this.exitSyncIfAborted();
        if (!results || results.length === 0) {
            if (this.dryRun) {
                logger.info('batchUpdate received an empty array. No records to update.');
            }
            return true;
        }

        if (!this.environmentId || !this.nangoConnectionId || !this.syncId || !this.syncJobId) {
            throw new Error('Nango environment Id, Connection Id, Sync Id and Sync Job Id are all required');
        }

        if (this.dryRun) {
            this.logMessages?.messages.push(`A batch update call would update the following data to the ${model} model:`);
            for (const msg of results) {
                this.logMessages?.messages.push(msg);
            }
            if (this.logMessages && this.logMessages.counts) {
                this.logMessages.counts.updated = Number(this.logMessages.counts.updated) + results.length;
            }
            return null;
        }

        for (let i = 0; i < results.length; i += this.batchSize) {
            const batch = results.slice(i, i + this.batchSize);
            const response = await this.persistApi(
                {
                    method: 'PUT',
                    path: `/environment/${this.environmentId}/connection/${this.nangoConnectionId}/sync/${this.syncId}/job/${this.syncJobId}/records`,
                    headers: {
                        Authorization: `Bearer ${this.nango.secretKey}`
                    }
                },
                JSON.stringify({
                    model,
                    records: batch,
                    providerConfigKey: this.providerConfigKey,
                    connectionId: this.connectionId,
                    activityLogId: this.activityLogId
                })
            );
            if (response.status > 299) {
                logger.error(
                    `Request to persist API (batchUpdate) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`,
                    this.stringify()
                );
                throw new Error(`cannot update records for sync '${this.syncId}': ${JSON.stringify(response.data)}`);
            }
        }
        return true;
    }

    public override async getMetadata<T = Metadata>(): Promise<T> {
        this.exitSyncIfAborted();
        if (this.dryRun && this.stubbedMetadata) {
            return this.stubbedMetadata as T;
        }

        return super.getMetadata<T>();
    }
}

const TELEMETRY_ALLOWED_METHODS: (keyof NangoSync)[] = [
    'batchDelete',
    'batchSave',
    'batchSend',
    'getConnection',
    'getEnvironmentVariables',
    'getMetadata',
    'proxy',
    'log',
    'triggerAction',
    'triggerSync'
];

/* eslint-disable no-inner-declarations */
/**
 * This function will enable tracing on the SDK
 * It has been split from the actual code to avoid making the code too dirty and to easily enable/disable tracing if there is an issue with it
 */
export function instrumentSDK(rawNango: NangoAction | NangoSync) {
    return new Proxy(rawNango, {
        get<T extends typeof rawNango, K extends keyof typeof rawNango>(target: T, propKey: K) {
            // Method name is not matching the allowList we don't do anything else
            if (!TELEMETRY_ALLOWED_METHODS.includes(propKey)) {
                return target[propKey];
            }

            return metrics.time(`${metrics.Types.RUNNER_SDK}.${propKey}` as any, (target[propKey] as any).bind(target));
        }
    });
}

/* eslint-enable no-inner-declarations */
