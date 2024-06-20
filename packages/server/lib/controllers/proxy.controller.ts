import type { Request, Response, NextFunction } from 'express';
import type { OutgoingHttpHeaders, IncomingMessage, RequestOptions } from 'http';
import type { TransformCallback } from 'stream';
import { Readable, Transform, PassThrough } from 'stream';
import { parse as parseUrl } from 'url';
import type { UrlWithParsedQuery } from 'url';
import { stringify as stringifyQuery } from 'querystring';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import type { RequestOptions as HttpsRequestOptions } from 'https';
import { backOff } from 'exponential-backoff';
import type {
    ActivityLog,
    ActivityLogMessage,
    HTTP_VERB,
    UserProvidedProxyConfiguration,
    InternalProxyConfiguration,
    ApplicationConstructedProxyConfiguration
} from '@nangohq/shared';
import type { HttpError } from '@nangohq/shared/lib/services/proxy.service';
import {
    NangoError,
    updateProvider as updateProviderActivityLog,
    updateEndpoint as updateEndpointActivityLog,
    createActivityLog,
    createActivityLogMessageAndEnd,
    createActivityLogMessage,
    updateSuccess as updateSuccessActivityLog,
    LogActionEnum,
    errorManager,
    ErrorSourceEnum,
    proxyService,
    connectionService,
    configService
} from '@nangohq/shared';
import { metrics, getLogger, httpRequest, httpsRequest } from '@nangohq/utils';
import { logContextGetter, oldLevelToNewLevel } from '@nangohq/logs';
import { connectionRefreshFailed as connectionRefreshFailedHook, connectionRefreshSuccess as connectionRefreshSuccessHook } from '../hooks/hooks.js';
import type { LogContext } from '@nangohq/logs';
import type { RequestLocals } from '../utils/express.js';

type ForwardedHeaders = Record<string, string>;

const logger = getLogger('Proxy.Controller');

const httpAgent = new HttpAgent();
const httpsAgent = new HttpsAgent();

class ProxyController {
    /**
     * Route Call
     * @desc Parse incoming request from the SDK or HTTP request and route the
     * call on the provided method after verifying the necessary parameters are set.
     * @param {Request} req Express request object
     * @param {Response} res Express response object
     * @param {NextFuncion} next callback function to pass control to the next middleware function in the pipeline.
     */
    public async routeCall(req: Request, res: Response<unknown, Required<RequestLocals>>, next: NextFunction) {
        const { environment, account } = res.locals as RequestLocals;

        if (!environment || !account) {
            next(new Error('Environment or account is missing in request locals'));
            return;
        }

        let logCtx: LogContext | undefined;
        try {
            const connectionId: string = req.get('Connection-Id') ?? '';
            const providerConfigKey: string = req.get('Provider-Config-Key') ?? '';
            const retries: string | null = req.get('Retries') ?? null;
            const baseUrlOverride: string = req.get('Base-Url-Override') ?? '';
            const isSync: boolean = req.get('Nango-Is-Sync') === 'true';
            const isDryRun: boolean = req.get('Nango-Is-Dry-Run') === 'true';
            const retryOn: number[] | null = req.get('Retry-On') ? req.get('Retry-On')?.split(',').map(Number) ?? null : null;
            const existingActivityLogId: number | string | null = req.get('Nango-Activity-Log-Id') ?? null;

            if (!isSync) {
                metrics.increment(metrics.Types.PROXY, 1, { accountId: String(account.id) });
            }

            const { method } = req;
            const path = req.params[0] as string;
            const { query }: UrlWithParsedQuery = parseUrl(req.url, true) as unknown as UrlWithParsedQuery;
            const queryString = stringifyQuery(query);
            const endpoint = `${path}${queryString ? `?${queryString}` : ''}`;

            const log: ActivityLog = {
                level: 'debug',
                timestamp: Date.now(),
                environment_id: environment.id,
                action: LogActionEnum.PROXY,
                success: null,
                start: Date.now(),
                connection_id: connectionId || null,
                provider_config_key: providerConfigKey || null,
                method: (method?.toUpperCase() as HTTP_VERB) || 'GET',
                endpoint,
                messages: []
            };

            let activityLogId: number | null = null;

            activityLogId = existingActivityLogId ? Number(existingActivityLogId) : await createActivityLog(log);
            logCtx = existingActivityLogId
                ? await logContextGetter.get({ id: String(existingActivityLogId) })
                : await logContextGetter.create({ operation: { type: 'proxy' }, message: 'Proxy call' }, { account, environment }, { dryRun: isDryRun });

            const headers = parseHeaders(req);

            const externalConfig: UserProvidedProxyConfiguration = {
                endpoint,
                providerConfigKey,
                connectionId,
                retries: retries ? Number(retries) : 0,
                data: req.body,
                headers,
                baseUrlOverride,
                decompress: req.get('Decompress') === 'true',
                method: method.toUpperCase() as HTTP_VERB,
                retryOn
            };

            const credentialResponse = await connectionService.getConnectionCredentials({
                account,
                environment,
                connectionId,
                providerConfigKey,
                logContextGetter,
                instantRefresh: false,
                onRefreshSuccess: connectionRefreshSuccessHook,
                onRefreshFailed: connectionRefreshFailedHook
            });

            if (credentialResponse.isErr()) {
                await logCtx.error('Failed to get connection credentials', { error: credentialResponse.error });
                await logCtx.failed();
                throw new Error(`Failed to get connection credentials: '${credentialResponse.error.message}'`);
            }

            const { value: connection } = credentialResponse;

            const providerConfig = await configService.getProviderConfig(providerConfigKey, environment.id);

            if (!providerConfig) {
                if (activityLogId) {
                    await createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: environment.id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: 'Provider configuration not found'
                    });
                    await logCtx.error('Provider configuration not found');
                    await logCtx.failed();
                }

                throw new NangoError('unknown_provider_config');
            }

            if (activityLogId) {
                await updateProviderActivityLog(activityLogId, providerConfig.provider);
                await logCtx.enrichOperation({
                    integrationId: typeof providerConfig.id === 'number' ? providerConfig.id : null,
                    integrationName: providerConfig.unique_key ?? '',
                    providerName: providerConfig.provider,
                    connectionId: typeof connection.id === 'number' ? connection.id : null,
                    connectionName: connection.connection_id ?? ''
                });
            }

            const internalConfig: InternalProxyConfiguration = {
                existingActivityLogId: activityLogId,
                connection,
                provider: providerConfig.provider
            };

            const { success, error, response: proxyConfig, activityLogs } = proxyService.configure(externalConfig, internalConfig);
            if (activityLogId) {
                await updateEndpointActivityLog(activityLogId, externalConfig.endpoint);
                for (const log of activityLogs) {
                    switch (log.level) {
                        case 'error':
                            await createActivityLogMessageAndEnd(log);
                            await logCtx.error(log.content);
                            break;
                        default:
                            await createActivityLogMessage(log);
                            await logCtx.info(log.content);
                            break;
                    }
                }
            }
            if (!success || !proxyConfig || error) {
                errorManager.errResFromNangoErr(res, error);
                await logCtx.failed();
                return;
            }

            await this.sendToHttpMethod({
                res,
                method: method as HTTP_VERB,
                configBody: proxyConfig,
                activityLogId,
                environment_id: environment.id,
                isSync,
                isDryRun,
                logCtx
            });
        } catch (err) {
            const connectionId = req.get('Connection-Id') as string;
            const providerConfigKey = req.get('Provider-Config-Key') as string;

            errorManager.report(err, {
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.PROXY,
                environmentId: environment.id,
                metadata: {
                    connectionId,
                    providerConfigKey
                }
            });
            if (logCtx) {
                await logCtx.error('uncaught error', { error: err });
                await logCtx.failed();
            }
            next(err);
        }
    }

    /**
     * Send to http method
     */
    private sendToHttpMethod({
        res,
        method,
        configBody,
        activityLogId,
        environment_id,
        isSync,
        isDryRun,
        logCtx
    }: {
        res: Response;
        method: HTTP_VERB;
        configBody: ApplicationConstructedProxyConfiguration;
        activityLogId: number | null;
        environment_id: number;
        isSync?: boolean | undefined;
        isDryRun?: boolean | undefined;
        logCtx: LogContext;
    }) {
        const url = proxyService.constructUrl(configBody);

        return this.request({
            res,
            method,
            url,
            config: configBody,
            activityLogId,
            environment_id,
            isSync,
            isDryRun,
            data: configBody.data,
            logCtx
        });
    }

    private async handleResponse({
        res,
        responseStream,
        config,
        activityLogId,
        environment_id,
        url,
        isSync = false,
        isDryRun = false,
        logCtx
    }: {
        res: Response;
        responseStream: IncomingMessage;
        config: ApplicationConstructedProxyConfiguration;
        activityLogId: number | null;
        environment_id: number;
        url: string;
        isSync?: boolean | undefined;
        isDryRun?: boolean | undefined;
        logCtx: LogContext;
    }) {
        if (!isDryRun && activityLogId) {
            if (!isSync) {
                await updateSuccessActivityLog(activityLogId, true);
            }
            const safeHeaders = proxyService.stripSensitiveHeaders(config.headers, config);
            await createActivityLogMessageAndEnd({
                level: 'info',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `${config.method.toUpperCase()} request to ${url} was successful`,
                params: {
                    headers: JSON.stringify(safeHeaders)
                }
            });
            await logCtx.info(`${config.method.toUpperCase()} request to ${url} was successful`, { headers: JSON.stringify(safeHeaders) });
        }

        const contentType = responseStream.headers['content-type'];
        const isJsonResponse = contentType && contentType.includes('application/json');
        const isChunked = responseStream.headers['transfer-encoding'] === 'chunked';
        const isEncoded = Boolean(responseStream.headers['content-encoding']);

        if (isChunked || isEncoded) {
            const passThroughStream = new PassThrough();
            responseStream.pipe(passThroughStream);
            passThroughStream.pipe(res);
            res.writeHead(responseStream.statusCode || 200, responseStream.headers as OutgoingHttpHeaders);

            await logCtx.success();
            return;
        }

        let responseData = '';

        responseStream.on('data', (chunk: Buffer) => {
            responseData += chunk.toString();
        });

        responseStream.on('end', () => {
            if (!isJsonResponse) {
                res.send(responseData);
                logCtx.success().catch((error: unknown) => logger.error(error));
                return;
            }

            try {
                const parsedResponse: unknown = JSON.parse(responseData);
                res.json(parsedResponse);
                logCtx.success().catch((error: unknown) => logger.error(error));
            } catch (error: unknown) {
                logger.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to parse JSON response' }));
                logCtx.error('Failed to parse JSON response', { error }).catch((error: unknown) => logger.error(error));
                logCtx.failed().catch((error: unknown) => logger.error(error));
            }
        });
    }

    private async handleErrorResponse(
        res: Response,
        e: unknown,
        url: string,
        config: ApplicationConstructedProxyConfiguration,
        activityLogId: number | null,
        environment_id: number,
        logCtx: LogContext
    ) {
        const isHttpError = (error: unknown): error is HttpError => {
            return typeof error === 'object' && error !== null && 'message' in error;
        };

        if (isHttpError(e)) {
            const error = e;

            if (error.message) {
                const errorObject = { message: error.message, stack: error.stack, url, method: config.method };

                if (activityLogId) {
                    await createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `${config.method.toUpperCase()} request to ${url} failed`,
                        params: errorObject
                    });
                    await logCtx.error(`${config.method.toUpperCase()} request to ${url} failed`, errorObject);
                    await logCtx.failed();
                } else {
                    logger.error(`Error: ${config.method.toUpperCase()} request to ${url} failed with the following params: ${JSON.stringify(errorObject)}`);
                }

                res.writeHead(500, { 'Content-Type': 'application/json' });

                const stream = new Readable();
                stream.push(JSON.stringify(errorObject));
                stream.push(null);

                stream.pipe(res);

                return;
            }

            const errorData = error.message;
            const stringify = new Transform({
                transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
                    callback(null, chunk);
                }
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            const stream = new Readable();
            stream.push(JSON.stringify({ error: errorData }));
            stream.push(null);

            stream.pipe(stringify).pipe(res);
            stringify.on('data', (data) => {
                if (typeof data === 'string') {
                    void this.reportError(error, url, config, activityLogId, environment_id, data, logCtx);
                } else {
                    logger.error('Unexpected data type:', typeof data);
                }
            });
        } else {
            logger.error('Unknown error type:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown error occurred' }));
        }
    }

    private async request({
        res,
        method,
        url,
        config,
        activityLogId,
        environment_id,
        isSync,
        isDryRun,
        data,
        logCtx
    }: {
        res: Response;
        method: HTTP_VERB;
        url: string;
        config: ApplicationConstructedProxyConfiguration;
        activityLogId: number | null;
        environment_id: number;
        isSync?: boolean | undefined;
        isDryRun?: boolean | undefined;
        data?: unknown;
        logCtx: LogContext;
    }) {
        try {
            const activityLogs: ActivityLogMessage[] = [];
            const headers = proxyService.constructHeaders(config);
            const requestOptions: RequestOptions | HttpsRequestOptions = {
                method,
                headers,
                agent: url.startsWith('https') ? httpsAgent : httpAgent
            };
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                requestOptions.headers = { ...requestOptions.headers, 'Content-Type': 'application/json' };
            }
            const requestFunction = url.startsWith('https') ? httpsRequest : httpRequest;
            const parsedUrl = new URL(url);
            const responseStream: IncomingMessage = await backOff(
                () => {
                    return requestFunction({ ...requestOptions, path: parsedUrl.pathname + parsedUrl.search }, data ? JSON.stringify(data) : undefined);
                },
                { numOfAttempts: Number(config.retries), retry: proxyService.retry.bind(this, activityLogId, environment_id, config, activityLogs) }
            );
            await Promise.all(
                activityLogs.map(async (msg) => {
                    await createActivityLogMessage(msg);
                    await logCtx.log({
                        type: 'log',
                        level: oldLevelToNewLevel[msg.level],
                        message: msg.content,
                        createdAt: new Date(msg.timestamp).toISOString()
                    });
                })
            );

            await this.handleResponse({ res, responseStream, config, activityLogId, environment_id, url: parsedUrl.href, isSync, isDryRun, logCtx });
        } catch (error) {
            await this.handleErrorResponse(res, error, url, config, activityLogId, environment_id, logCtx);
        }
    }

    private async reportError(
        error: HttpError,
        url: string,
        config: ApplicationConstructedProxyConfiguration,
        activityLogId: number | null,
        environment_id: number,
        errorMessage: string,
        logCtx: LogContext | undefined
    ) {
        if (activityLogId) {
            const safeHeaders = proxyService.stripSensitiveHeaders(config.headers, config);
            await createActivityLogMessageAndEnd({
                level: 'error',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: JSON.stringify({
                    nangoComment: `The provider responded back with a ${error.response?.status ?? 'unknown status'} to the url: ${url}`,
                    providerResponse: errorMessage.toString()
                }),
                params: {
                    requestHeaders: JSON.stringify(safeHeaders, null, 2),
                    responseHeaders: JSON.stringify(error.response?.headers ?? {}, null, 2)
                }
            });
            await logCtx?.error('The provider responded back with an error code', {
                code: error.response?.status ?? 'unknown status',
                url,
                error: errorMessage,
                requestHeaders: safeHeaders,
                responseHeaders: error.response?.headers ?? {}
            });
            await logCtx?.failed();
        } else {
            const content = `The provider responded back with a ${error.response?.status ?? 'unknown status'} and the message ${errorMessage} to the url: ${url}.${
                config.template.docs ? ` Refer to the documentation at ${config.template.docs} for help` : ''
            }`;
            logger.error(content);
        }
    }
}

/**
 * Parse Headers
 */
export function parseHeaders(req: Pick<Request, 'rawHeaders'>) {
    const headers = req.rawHeaders;
    const HEADER_PROXY_LOWER = 'nango-proxy-';
    const HEADER_PROXY_UPPER = 'Nango-Proxy-';
    const forwardedHeaders: ForwardedHeaders = {};

    if (!headers) {
        return forwardedHeaders;
    }

    for (let i = 0, n = headers.length; i < n; i += 2) {
        const headerKey = headers[i];

        if (headerKey?.toLowerCase().startsWith(HEADER_PROXY_LOWER) || headerKey?.startsWith(HEADER_PROXY_UPPER)) {
            forwardedHeaders[headerKey.slice(HEADER_PROXY_LOWER.length)] = headers[i + 1] || '';
        }
    }

    return forwardedHeaders;
}

export default new ProxyController();
