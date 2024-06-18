var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { axiosInstance as axios, getLogger } from '@nangohq/utils';
import { backOff } from 'exponential-backoff';
import FormData from 'form-data';
import configService from './config.service.js';
import { interpolateIfNeeded, connectionCopyWithParsedConnectionConfig, mapProxyBaseUrlInterpolationFormat } from '../utils/utils.js';
import { NangoError } from '../utils/error.js';
const logger = getLogger('Proxy');
class ProxyService {
    constructor() {
        this.retryHandler = (activityLogId, environment_id, error, type, retryHeader) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const activityLogs = [];
            if (type === 'at') {
                const resetTimeEpoch = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.headers[retryHeader]) || ((_b = error.response) === null || _b === void 0 ? void 0 : _b.headers[retryHeader.toLowerCase()]);
                if (resetTimeEpoch) {
                    const currentEpochTime = Math.floor(Date.now() / 1000);
                    const retryAtEpoch = Number(resetTimeEpoch);
                    if (retryAtEpoch > currentEpochTime) {
                        const waitDuration = retryAtEpoch - currentEpochTime;
                        const content = `Rate limit reset time was parsed successfully, retrying after ${waitDuration} seconds`;
                        activityLogs.push({
                            level: 'error',
                            environment_id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content
                        });
                        yield new Promise((resolve) => setTimeout(resolve, waitDuration * 1000));
                        return { shouldRetry: true, activityLogs };
                    }
                }
            }
            if (type === 'after') {
                const retryHeaderVal = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.headers[retryHeader]) || ((_d = error.response) === null || _d === void 0 ? void 0 : _d.headers[retryHeader.toLowerCase()]);
                if (retryHeaderVal) {
                    const retryAfter = Number(retryHeaderVal);
                    const content = `Retry header was parsed successfully, retrying after ${retryAfter} seconds`;
                    activityLogs.push({
                        level: 'error',
                        environment_id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content
                    });
                    yield new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return { shouldRetry: true, activityLogs };
                }
            }
            return { shouldRetry: true, activityLogs };
        });
        /**
         * Retry
         * @desc if retries are set the retry function to determine if retries are
         * actually kicked off or not
         * @param {AxiosError} error
         * @param {attemptNumber} number
         */
        this.retry = (activityLogId, environment_id, config, activityLogs, error, attemptNumber) => __awaiter(this, void 0, void 0, function* () {
            var _e, _f, _g, _h, _j, _k;
            if (((_e = error.response) === null || _e === void 0 ? void 0 : _e.status.toString().startsWith('5')) ||
                // Note that Github issues a 403 for both rate limits and improper scopes
                (((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) === 403 && error.response.headers['x-ratelimit-remaining'] && error.response.headers['x-ratelimit-remaining'] === '0') ||
                ((_g = error.response) === null || _g === void 0 ? void 0 : _g.status) === 429 ||
                ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED'].includes(error.code) ||
                ((_h = config.retryOn) === null || _h === void 0 ? void 0 : _h.includes(Number((_j = error.response) === null || _j === void 0 ? void 0 : _j.status)))) {
                if (config.retryHeader) {
                    const type = config.retryHeader.at ? 'at' : 'after';
                    const retryHeader = config.retryHeader.at ? config.retryHeader.at : config.retryHeader.after;
                    const { shouldRetry, activityLogs: retryActivityLogs } = yield this.retryHandler(activityLogId, environment_id, error, type, retryHeader);
                    retryActivityLogs.forEach((a) => activityLogs.push(a));
                    return shouldRetry;
                }
                if (config.template.proxy && config.template.proxy.retry && (config.template.proxy.retry.at || config.template.proxy.retry.after)) {
                    const type = config.template.proxy.retry.at ? 'at' : 'after';
                    const retryHeader = config.template.proxy.retry.at ? config.template.proxy.retry.at : config.template.proxy.retry.after;
                    const { shouldRetry, activityLogs: retryActivityLogs } = yield this.retryHandler(activityLogId, environment_id, error, type, retryHeader);
                    retryActivityLogs.forEach((a) => activityLogs.push(a));
                    return shouldRetry;
                }
                const content = `API received an ${((_k = error.response) === null || _k === void 0 ? void 0 : _k.status) || error.code} error, ${config.retries && config.retries > 0
                    ? `retrying with exponential backoffs for a total of ${attemptNumber} out of ${config.retries} times`
                    : 'but no retries will occur because retries defaults to 0 or were set to 0'}`;
                activityLogs.push({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content
                });
                return true;
            }
            return false;
        });
    }
    route(externalConfig, internalConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { success, error, response: proxyConfig, activityLogs: configureActivityLogs } = this.configure(externalConfig, internalConfig);
            if (!success || error || !proxyConfig) {
                throw new Error(`Proxy configuration is missing: ${error}`);
            }
            return yield this.sendToHttpMethod(proxyConfig, internalConfig).then((resp) => {
                return { response: resp.response, activityLogs: [...configureActivityLogs, ...resp.activityLogs] };
            });
        });
    }
    configure(externalConfig, internalConfig) {
        var _a, _b;
        const activityLogs = [];
        let data = externalConfig.data;
        const { endpoint: passedEndpoint, providerConfigKey, connectionId, method, retries, headers, baseUrlOverride, retryOn } = externalConfig;
        const { connection, provider, existingActivityLogId: activityLogId } = internalConfig;
        if (!passedEndpoint && !baseUrlOverride) {
            if (activityLogId) {
                activityLogs.push({
                    level: 'error',
                    environment_id: connection.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: 'Proxy: a API URL endpoint is missing.'
                });
            }
            return { success: false, error: new NangoError('missing_endpoint'), response: null, activityLogs };
        }
        if (!connectionId) {
            if (activityLogId) {
                activityLogs.push({
                    level: 'error',
                    environment_id: connection.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `The connection id value is missing. If you're making a HTTP request then it should be included in the header 'Connection-Id'. If you're using the SDK the connectionId property should be specified.`
                });
            }
            return { success: false, error: new NangoError('missing_connection_id'), response: null, activityLogs };
        }
        if (!providerConfigKey) {
            if (activityLogId) {
                activityLogs.push({
                    level: 'error',
                    environment_id: connection.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `The provider config key value is missing. If you're making a HTTP request then it should be included in the header 'Provider-Config-Key'. If you're using the SDK the providerConfigKey property should be specified.`
                });
            }
            return { success: false, error: new NangoError('missing_provider_config_key'), response: null, activityLogs };
        }
        if (activityLogId) {
            activityLogs.push({
                level: 'debug',
                environment_id: connection.environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `Connection id: '${connectionId}' and provider config key: '${providerConfigKey}' parsed and received successfully`
            });
        }
        let endpoint = passedEndpoint;
        let token;
        switch (connection.credentials.type) {
            case 'OAUTH2':
                {
                    const credentials = connection.credentials;
                    token = credentials.access_token;
                }
                break;
            case 'OAUTH1': {
                const error = new Error('OAuth1 is not supported yet in the proxy.');
                const nangoError = new NangoError('pass_through_error', error);
                return { success: false, error: nangoError, response: null, activityLogs };
            }
            case 'BASIC':
                token = connection.credentials;
                break;
            case 'API_KEY':
                token = connection.credentials;
                break;
            case 'APP':
                {
                    const credentials = connection.credentials;
                    token = credentials.access_token;
                }
                break;
            case 'OAUTH2_CC':
                {
                    const credentials = connection.credentials;
                    token = credentials.token;
                }
                break;
        }
        activityLogs.push({
            level: 'debug',
            environment_id: connection.environment_id,
            activity_log_id: activityLogId,
            timestamp: Date.now(),
            content: 'Proxy: token retrieved successfully'
        });
        let template;
        try {
            template = configService.getTemplate(provider);
        }
        catch (_c) {
            logger.error('failed to getTemplate');
        }
        if (!template || ((!template.proxy || !template.proxy.base_url) && !baseUrlOverride)) {
            activityLogs.push({
                level: 'error',
                environment_id: connection.environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `${Date.now()} The proxy is either not supported for the provider ${provider} or it does not have a default base URL configured (use the baseUrlOverride config param to specify a base URL).`
            });
            return { success: false, error: new NangoError('missing_base_api_url'), response: null, activityLogs };
        }
        activityLogs.push({
            level: 'debug',
            environment_id: connection.environment_id,
            activity_log_id: activityLogId,
            timestamp: Date.now(),
            content: `Proxy: API call configuration constructed successfully with the base api url set to ${baseUrlOverride || ((_a = template.proxy) === null || _a === void 0 ? void 0 : _a.base_url)}`
        });
        if (!baseUrlOverride && ((_b = template.proxy) === null || _b === void 0 ? void 0 : _b.base_url) && endpoint.includes(template.proxy.base_url)) {
            endpoint = endpoint.replace(template.proxy.base_url, '');
        }
        activityLogs.push({
            level: 'debug',
            environment_id: connection.environment_id,
            activity_log_id: activityLogId,
            timestamp: Date.now(),
            content: `Endpoint set to ${endpoint} with retries set to ${retries} ${retryOn ? `and retryOn set to ${retryOn}` : ''}`
        });
        if (headers && headers['Content-Type'] === 'multipart/form-data') {
            const formData = new FormData();
            Object.keys(data).forEach((key) => {
                formData.append(key, data[key]);
            });
            data = formData;
        }
        const configBody = {
            endpoint,
            method: method === null || method === void 0 ? void 0 : method.toUpperCase(),
            template,
            token: token || '',
            provider: provider,
            providerConfigKey,
            connectionId,
            headers: headers,
            data,
            retries: retries || 0,
            baseUrlOverride: baseUrlOverride,
            // decompress is used only when the call is truly a proxy call
            // Coming from a flow it is not a proxy call since the worker
            // makes the request so we don't allow an override in that case
            decompress: externalConfig.decompress === 'true' || externalConfig.decompress === true,
            connection,
            params: externalConfig.params,
            paramsSerializer: externalConfig.paramsSerializer,
            responseType: externalConfig.responseType,
            retryOn: retryOn && Array.isArray(retryOn) ? retryOn.map(Number) : null
        };
        return { success: true, error: null, response: configBody, activityLogs };
    }
    /**
     * Send to http method
     * @desc route the call to a HTTP request based on HTTP method passed in
     * @param {Request} req Express request object
     * @param {Response} res Express response object
     * @param {NextFuncion} next callback function to pass control to the next middleware function in the pipeline.
     * @param {HTTP_VERB} method
     * @param {ApplicationConstructedProxyConfiguration} configBody
     */
    sendToHttpMethod(configBody, internalConfig) {
        const options = {
            headers: configBody.headers
        };
        if (configBody.params) {
            options.params = configBody.params;
        }
        if (configBody.paramsSerializer) {
            options.paramsSerializer = configBody.paramsSerializer;
        }
        if (configBody.responseType) {
            options.responseType = configBody.responseType;
        }
        if (configBody.data) {
            options.data = configBody.data;
        }
        const { existingActivityLogId: activityLogId, connection } = internalConfig;
        const { method } = configBody;
        options.url = this.constructUrl(configBody);
        options.method = method;
        const headers = this.constructHeaders(configBody);
        options.headers = Object.assign(Object.assign({}, options.headers), headers);
        return this.request(configBody, activityLogId, connection.environment_id, options);
    }
    stripSensitiveHeaders(headers, config) {
        var _a;
        const safeHeaders = Object.assign({}, headers);
        if (!config.token) {
            if ((_a = safeHeaders['Authorization']) === null || _a === void 0 ? void 0 : _a.includes('Bearer')) {
                safeHeaders['Authorization'] = safeHeaders['Authorization'].replace(/Bearer.*/, 'Bearer xxxx');
            }
            return safeHeaders;
        }
        Object.keys(safeHeaders).forEach((header) => {
            if (safeHeaders[header] === config.token) {
                safeHeaders[header] = 'xxxx';
            }
            const headerValue = safeHeaders[header];
            if (headerValue === null || headerValue === void 0 ? void 0 : headerValue.includes(config.token)) {
                safeHeaders[header] = headerValue.replace(config.token, 'xxxx');
            }
        });
        return safeHeaders;
    }
    request(config, activityLogId, environment_id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const activityLogs = [];
            try {
                const response = yield backOff(() => {
                    return axios.request(options);
                }, { numOfAttempts: Number(config.retries), retry: this.retry.bind(this, activityLogId, environment_id, config, activityLogs) });
                const handling = this.handleResponse(config, activityLogId, environment_id, options.url);
                return { response, activityLogs: [...activityLogs, ...handling.activityLogs] };
            }
            catch (e) {
                const handling = this.handleErrorResponse(e, options.url, config, activityLogId, environment_id);
                return { response: handling.response, activityLogs: [...activityLogs, ...handling.activityLogs] };
            }
        });
    }
    /**
     * Construct URL
     * @param {ApplicationConstructedProxyConfiguration} config
     *
     */
    constructUrl(config) {
        const { connection } = config;
        const { template: { proxy: { base_url: templateApiBase } = {} } = {}, endpoint: apiEndpoint } = config;
        const apiBase = config.baseUrlOverride || templateApiBase;
        const base = (apiBase === null || apiBase === void 0 ? void 0 : apiBase.substr(-1)) === '/' ? apiBase.slice(0, -1) : apiBase;
        let endpoint = apiEndpoint.charAt(0) === '/' ? apiEndpoint.slice(1) : apiEndpoint;
        if (config.template.auth_mode === 'API_KEY' && 'proxy' in config.template && 'query' in config.template.proxy) {
            const apiKeyProp = Object.keys(config.template.proxy.query)[0];
            const token = config.token;
            endpoint += endpoint.includes('?') ? '&' : '?';
            endpoint += `${apiKeyProp}=${token.apiKey}`;
        }
        const fullEndpoint = interpolateIfNeeded(`${mapProxyBaseUrlInterpolationFormat(base)}${endpoint ? '/' : ''}${endpoint}`, connectionCopyWithParsedConnectionConfig(connection));
        return fullEndpoint;
    }
    /**
     * Construct Headers
     * @param {ApplicationConstructedProxyConfiguration} config
     */
    constructHeaders(config) {
        var _a;
        let headers = {};
        switch (config.template.auth_mode) {
            case 'BASIC':
                {
                    const token = config.token;
                    headers = {
                        Authorization: `Basic ${Buffer.from(`${token.username}:${(_a = token.password) !== null && _a !== void 0 ? _a : ''}`).toString('base64')}`
                    };
                }
                break;
            case 'API_KEY':
                headers = {};
                break;
            default:
                headers = {
                    Authorization: `Bearer ${config.token}`
                };
                break;
        }
        // even if the auth mode isn't api key a header might exist in the proxy
        // so inject it if so
        if ('proxy' in config.template && 'headers' in config.template.proxy) {
            headers = Object.entries(config.template.proxy.headers).reduce((acc, [key, value]) => {
                // allows oauth2 acessToken key to be interpolated and injected
                // into the header in addition to api key values
                let tokenPair;
                switch (config.template.auth_mode) {
                    case 'OAUTH2':
                        tokenPair = { accessToken: config.token };
                        break;
                    case 'API_KEY':
                    case 'BASIC':
                    case 'OAUTH2_CC':
                        if (value.includes('connectionConfig')) {
                            value = value.replace(/connectionConfig\./g, '');
                            tokenPair = config.connection.connection_config;
                        }
                        else {
                            tokenPair = config.token;
                        }
                        break;
                    default:
                        tokenPair = config.token;
                        break;
                }
                acc[key] = interpolateIfNeeded(value, tokenPair);
                return acc;
            }, Object.assign({}, headers));
        }
        if (config.headers) {
            const { headers: configHeaders } = config;
            headers = Object.assign(Object.assign({}, headers), configHeaders);
        }
        return headers;
    }
    handleResponse(config, activityLogId, environment_id, url) {
        const safeHeaders = this.stripSensitiveHeaders(config.headers, config);
        const activityLog = {
            level: 'info',
            environment_id,
            activity_log_id: activityLogId,
            timestamp: Date.now(),
            content: `${config.method.toUpperCase()} request to ${url} was successful`,
            params: {
                headers: JSON.stringify(safeHeaders)
            }
        };
        return {
            activityLogs: [activityLog]
        };
    }
    reportError(error, url, config, activityLogId, environment_id, errorMessage) {
        var _a, _b;
        const activities = [];
        if (activityLogId) {
            const safeHeaders = this.stripSensitiveHeaders(config.headers, config);
            activities.push({
                level: 'error',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: errorMessage.toString(),
                params: {
                    requestHeaders: JSON.stringify(safeHeaders, null, 2),
                    responseHeaders: JSON.stringify((_a = error.response) === null || _a === void 0 ? void 0 : _a.headers, null, 2)
                }
            });
        }
        else {
            const content = `The provider responded back with a ${(_b = error.response) === null || _b === void 0 ? void 0 : _b.status} and the message ${errorMessage} to the url: ${url}.${config.template.docs ? ` Refer to the documentation at ${config.template.docs} for help` : ''}`;
            console.error(content);
        }
        return activities;
    }
    handleErrorResponse(error, url, config, activityLogId, environment_id) {
        var _a;
        const activityLogs = [];
        if (!((_a = error.response) === null || _a === void 0 ? void 0 : _a.data)) {
            const { message, stack, config: { method }, code, status } = error.toJSON();
            const errorObject = { message, stack, code, status, url, method };
            if (activityLogId) {
                activityLogs.push({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `${method.toUpperCase()} request to ${url} failed`,
                    params: errorObject
                });
            }
            else {
                console.error(`Error: ${method.toUpperCase()} request to ${url} failed with the following params: ${JSON.stringify(errorObject)}`);
            }
            activityLogs.push(...this.reportError(error, url, config, activityLogId, environment_id, message));
        }
        else {
            const { message, config: { method } } = error.toJSON();
            const errorData = error.response.data;
            if (activityLogId) {
                activityLogs.push({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `${method.toUpperCase()} request to ${url} failed`,
                    params: JSON.stringify(errorData.error || errorData, null, 2)
                });
            }
            else {
                console.error(`Error: ${method.toUpperCase()} request to ${url} failed with the following params: ${JSON.stringify(errorData)}`);
            }
            activityLogs.push(...this.reportError(error, url, config, activityLogId, environment_id, message));
        }
        return {
            response: error,
            activityLogs
        };
    }
}
export default new ProxyService();
//# sourceMappingURL=proxy.service.js.map