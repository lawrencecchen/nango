var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Readable, Transform, PassThrough } from 'stream';
import url from 'url';
import querystring from 'querystring';
import { backOff } from 'exponential-backoff';
import { NangoError, updateProvider as updateProviderActivityLog, updateEndpoint as updateEndpointActivityLog, createActivityLog, createActivityLogMessageAndEnd, createActivityLogMessage, updateSuccess as updateSuccessActivityLog, LogActionEnum, errorManager, ErrorSourceEnum, proxyService, connectionService, configService } from '@nangohq/shared';
import { metrics, getLogger, axiosInstance as axios } from '@nangohq/utils';
import { logContextGetter, oldLevelToNewLevel } from '@nangohq/logs';
import { connectionRefreshFailed as connectionRefreshFailedHook, connectionRefreshSuccess as connectionRefreshSuccessHook } from '../hooks/hooks.js';
const logger = getLogger('Proxy.Controller');
class ProxyController {
    /**
     * Route Call
     * @desc Parse incoming request from the SDK or HTTP request and route the
     * call on the provided method after verifying the necessary parameters are set.
     * @param {Request} req Express request object
     * @param {Response} res Express response object
     * @param {NextFuncion} next callback function to pass control to the next middleware function in the pipeline.
     */
    routeCall(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { environment, account } = res.locals;
            let logCtx;
            try {
                const connectionId = req.get('Connection-Id');
                const providerConfigKey = req.get('Provider-Config-Key');
                const retries = req.get('Retries');
                const baseUrlOverride = req.get('Base-Url-Override');
                const decompress = req.get('Decompress');
                const isSync = req.get('Nango-Is-Sync') === 'true';
                const isDryRun = req.get('Nango-Is-Dry-Run') === 'true';
                const retryOn = req.get('Retry-On') ? req.get('Retry-On').split(',').map(Number) : null;
                const existingActivityLogId = req.get('Nango-Activity-Log-Id');
                const logAction = isSync ? LogActionEnum.SYNC : LogActionEnum.PROXY;
                if (!isSync) {
                    metrics.increment(metrics.Types.PROXY, 1, { accountId: account.id });
                }
                const log = {
                    level: 'debug',
                    success: false,
                    action: logAction,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    method: req.method,
                    connection_id: connectionId,
                    provider_config_key: providerConfigKey,
                    environment_id: environment.id
                };
                let activityLogId = null;
                if (!isDryRun) {
                    activityLogId = existingActivityLogId ? Number(existingActivityLogId) : yield createActivityLog(log);
                }
                logCtx = existingActivityLogId
                    ? yield logContextGetter.get({ id: String(existingActivityLogId) })
                    : yield logContextGetter.create({ operation: { type: 'proxy' }, message: 'Proxy call' }, { account, environment }, { dryRun: isDryRun });
                const { method } = req;
                const path = req.params[0];
                const { query } = url.parse(req.url, true);
                const queryString = querystring.stringify(query);
                const endpoint = `${path}${queryString ? `?${queryString}` : ''}`;
                const headers = parseHeaders(req);
                const externalConfig = {
                    endpoint,
                    providerConfigKey,
                    connectionId,
                    retries: retries ? Number(retries) : 0,
                    data: req.body,
                    headers,
                    baseUrlOverride,
                    decompress: decompress === 'true' ? true : false,
                    method: method.toUpperCase(),
                    retryOn
                };
                const credentialResponse = yield connectionService.getConnectionCredentials({
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
                    yield logCtx.error('Failed to get connection credentials', { error: credentialResponse.error });
                    yield logCtx.failed();
                    throw new Error(`Failed to get connection credentials: '${credentialResponse.error.message}'`);
                }
                const { value: connection } = credentialResponse;
                const providerConfig = yield configService.getProviderConfig(providerConfigKey, environment.id);
                if (!providerConfig) {
                    if (activityLogId) {
                        yield createActivityLogMessageAndEnd({
                            level: 'error',
                            environment_id: environment.id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: 'Provider configuration not found'
                        });
                        yield logCtx.error('Provider configuration not found');
                        yield logCtx.failed();
                    }
                    throw new NangoError('unknown_provider_config');
                }
                if (activityLogId) {
                    yield updateProviderActivityLog(activityLogId, providerConfig.provider);
                    yield logCtx.enrichOperation({
                        integrationId: providerConfig.id,
                        integrationName: providerConfig.unique_key,
                        providerName: providerConfig.provider,
                        connectionId: connection.id,
                        connectionName: connection.connection_id
                    });
                }
                const internalConfig = {
                    existingActivityLogId: activityLogId,
                    connection,
                    provider: providerConfig.provider
                };
                const { success, error, response: proxyConfig, activityLogs } = proxyService.configure(externalConfig, internalConfig);
                if (activityLogId) {
                    yield updateEndpointActivityLog(activityLogId, externalConfig.endpoint);
                    for (const log of activityLogs) {
                        switch (log.level) {
                            case 'error':
                                yield createActivityLogMessageAndEnd(log);
                                yield logCtx.error(log.content);
                                break;
                            default:
                                yield createActivityLogMessage(log);
                                yield logCtx.info(log.content);
                                break;
                        }
                    }
                }
                if (!success || !proxyConfig || error) {
                    errorManager.errResFromNangoErr(res, error);
                    yield logCtx.failed();
                    return;
                }
                yield this.sendToHttpMethod({
                    res,
                    method: method,
                    configBody: proxyConfig,
                    activityLogId,
                    environment_id: environment.id,
                    isSync,
                    isDryRun,
                    logCtx
                });
            }
            catch (err) {
                const connectionId = req.get('Connection-Id');
                const providerConfigKey = req.get('Provider-Config-Key');
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
                    yield logCtx.error('uncaught error', { error: err });
                    yield logCtx.failed();
                }
                next(err);
            }
        });
    }
    /**
     * Send to http method
     */
    sendToHttpMethod({ res, method, configBody, activityLogId, environment_id, isSync, isDryRun, logCtx }) {
        var _a;
        const url = proxyService.constructUrl(configBody);
        let decompress = false;
        if (configBody.decompress === true || ((_a = configBody.template.proxy) === null || _a === void 0 ? void 0 : _a.decompress) === true) {
            decompress = true;
        }
        return this.request({
            res,
            method,
            url,
            config: configBody,
            activityLogId,
            environment_id,
            decompress,
            isSync,
            isDryRun,
            data: configBody.data,
            logCtx
        });
    }
    handleResponse({ res, responseStream, config, activityLogId, environment_id, url, isSync = false, isDryRun = false, logCtx }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isDryRun && activityLogId) {
                if (!isSync) {
                    yield updateSuccessActivityLog(activityLogId, true);
                }
                const safeHeaders = proxyService.stripSensitiveHeaders(config.headers, config);
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `${config.method.toUpperCase()} request to ${url} was successful`,
                    params: {
                        headers: JSON.stringify(safeHeaders)
                    }
                });
                yield logCtx.info(`${config.method.toUpperCase()} request to ${url} was successful`, { headers: JSON.stringify(safeHeaders) });
            }
            const contentType = responseStream.headers['content-type'];
            const isJsonResponse = contentType && contentType.includes('application/json');
            const isChunked = responseStream.headers['transfer-encoding'] === 'chunked';
            const isEncoded = Boolean(responseStream.headers['content-encoding']);
            if (isChunked || isEncoded) {
                const passThroughStream = new PassThrough();
                responseStream.data.pipe(passThroughStream);
                passThroughStream.pipe(res);
                res.writeHead(responseStream.status, responseStream.headers);
                yield logCtx.success();
                return;
            }
            let responseData = '';
            responseStream.data.on('data', (chunk) => {
                responseData += chunk.toString();
            });
            responseStream.data.on('end', () => __awaiter(this, void 0, void 0, function* () {
                if (!isJsonResponse) {
                    res.send(responseData);
                    yield logCtx.success();
                    return;
                }
                try {
                    const parsedResponse = JSON.parse(responseData);
                    res.json(parsedResponse);
                    yield logCtx.success();
                }
                catch (error) {
                    logger.error(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to parse JSON response' }));
                    yield logCtx.error('Failed to parse JSON response', { error });
                    yield logCtx.failed();
                }
            }));
        });
    }
    handleErrorResponse(res, e, url, config, activityLogId, environment_id, logCtx) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const error = e;
            if (!((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) && error.toJSON) {
                const { message, stack, config: { method }, code, status } = error.toJSON();
                const errorObject = { message, stack, code, status, url, method };
                if (activityLogId) {
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `${method.toUpperCase()} request to ${url} failed`,
                        params: errorObject
                    });
                    yield logCtx.error(`${method.toUpperCase()} request to ${url} failed`, errorObject);
                    yield logCtx.failed();
                }
                else {
                    console.error(`Error: ${method.toUpperCase()} request to ${url} failed with the following params: ${JSON.stringify(errorObject)}`);
                }
                const responseStatus = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500;
                const responseHeaders = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.headers) || {};
                res.writeHead(responseStatus, responseHeaders);
                const stream = new Readable();
                stream.push(JSON.stringify(errorObject));
                stream.push(null);
                stream.pipe(res);
                return;
            }
            const errorData = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data;
            const stringify = new Transform({
                transform(chunk, _encoding, callback) {
                    callback(null, chunk);
                }
            });
            if ((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) {
                res.writeHead(error.response.status, error.response.headers);
            }
            if (errorData) {
                errorData.pipe(stringify).pipe(res);
                stringify.on('data', (data) => {
                    void this.reportError(error, url, config, activityLogId, environment_id, data, logCtx);
                });
            }
            else {
                if (activityLogId) {
                    yield logCtx.error('Unknown error');
                    yield logCtx.failed();
                }
            }
        });
    }
    request({ res, method, url, config, activityLogId, environment_id, decompress, isSync, isDryRun, data, logCtx }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activityLogs = [];
                const headers = proxyService.constructHeaders(config);
                const requestConfig = {
                    method,
                    url,
                    responseType: 'stream',
                    headers,
                    decompress
                };
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                    requestConfig.data = data || {};
                }
                const responseStream = yield backOff(() => {
                    return axios(requestConfig);
                }, { numOfAttempts: Number(config.retries), retry: proxyService.retry.bind(this, activityLogId, environment_id, config, activityLogs) });
                yield Promise.all(activityLogs.map((msg) => __awaiter(this, void 0, void 0, function* () {
                    yield createActivityLogMessage(msg);
                    yield logCtx.log({
                        type: 'log',
                        level: oldLevelToNewLevel[msg.level],
                        message: msg.content,
                        createdAt: new Date(msg.timestamp).toISOString()
                    });
                })));
                yield this.handleResponse({ res, responseStream, config, activityLogId, environment_id, url, isSync, isDryRun, logCtx });
            }
            catch (error) {
                yield this.handleErrorResponse(res, error, url, config, activityLogId, environment_id, logCtx);
            }
        });
    }
    reportError(error, url, config, activityLogId, environment_id, errorMessage, logCtx) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (activityLogId) {
                const safeHeaders = proxyService.stripSensitiveHeaders(config.headers, config);
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: JSON.stringify({
                        nangoComment: `The provider responded back with a ${(_a = error.response) === null || _a === void 0 ? void 0 : _a.status} to the url: ${url}`,
                        providerResponse: errorMessage.toString()
                    }),
                    params: {
                        requestHeaders: JSON.stringify(safeHeaders, null, 2),
                        responseHeaders: JSON.stringify((_b = error.response) === null || _b === void 0 ? void 0 : _b.headers, null, 2)
                    }
                });
                yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error('The provider responded back with an error code', {
                    code: (_c = error.response) === null || _c === void 0 ? void 0 : _c.status,
                    url,
                    error: errorMessage,
                    requestHeaders: safeHeaders,
                    responseHeaders: (_d = error.response) === null || _d === void 0 ? void 0 : _d.headers
                }));
                yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.failed());
            }
            else {
                const content = `The provider responded back with a ${(_e = error.response) === null || _e === void 0 ? void 0 : _e.status} and the message ${errorMessage} to the url: ${url}.${config.template.docs ? ` Refer to the documentation at ${config.template.docs} for help` : ''}`;
                console.error(content);
            }
        });
    }
}
/**
 * Parse Headers
 */
export function parseHeaders(req) {
    const headers = req.rawHeaders;
    const HEADER_PROXY_LOWER = 'nango-proxy-';
    const HEADER_PROXY_UPPER = 'Nango-Proxy-';
    const forwardedHeaders = {};
    if (!headers) {
        return forwardedHeaders;
    }
    for (let i = 0, n = headers.length; i < n; i += 2) {
        const headerKey = headers[i];
        if ((headerKey === null || headerKey === void 0 ? void 0 : headerKey.toLowerCase().startsWith(HEADER_PROXY_LOWER)) || (headerKey === null || headerKey === void 0 ? void 0 : headerKey.startsWith(HEADER_PROXY_UPPER))) {
            forwardedHeaders[headerKey.slice(HEADER_PROXY_LOWER.length)] = headers[i + 1] || '';
        }
    }
    return forwardedHeaders;
}
export default new ProxyController();
//# sourceMappingURL=proxy.controller.js.map