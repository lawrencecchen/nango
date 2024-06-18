var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import * as https from 'node:https';
import { Nango, getUserAgent } from '@nangohq/node';
import axios from 'axios';
import { getLogger, metrics } from '@nangohq/utils';
import configService from '../services/config.service.js';
import paginateService from '../services/paginate.service.js';
import proxyService from '../services/proxy.service.js';
import { getPersistAPIUrl, safeStringify } from '../utils/utils.js';
const logger = getLogger('SDK');
var PaginationType;
(function (PaginationType) {
    PaginationType["CURSOR"] = "cursor";
    PaginationType["LINK"] = "link";
    PaginationType["OFFSET"] = "offset";
})(PaginationType || (PaginationType = {}));
var AuthModes;
(function (AuthModes) {
    AuthModes["OAuth1"] = "OAUTH1";
    AuthModes["OAuth2"] = "OAUTH2";
    AuthModes["OAuth2CC"] = "OAUTH2_CC";
    AuthModes["Basic"] = "BASIC";
    AuthModes["ApiKey"] = "API_KEY";
    AuthModes["AppStore"] = "APP_STORE";
    AuthModes["App"] = "APP";
    AuthModes["Custom"] = "CUSTOM";
    AuthModes["None"] = "NONE";
})(AuthModes || (AuthModes = {}));
export class ActionError extends Error {
    constructor(payload) {
        super();
        this.type = 'action_script_runtime_error';
        if (payload) {
            this.payload = payload;
        }
    }
}
const MEMOIZED_CONNECTION_TTL = 60000;
export const defaultPersistApi = axios.create({
    baseURL: getPersistAPIUrl(),
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
        'User-Agent': getUserAgent('sdk')
    },
    validateStatus: (_status) => {
        return true;
    }
});
function transformResponseToAxiosResponse(response) {
    return {
        data: response.json(),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: {},
        request: {} // Add any additional request info if needed
    };
}
export class NangoAction {
    constructor(config, { persistApi } = { persistApi: defaultPersistApi }) {
        this.attributes = {};
        this.ActionError = ActionError;
        this.memoizedConnections = new Map();
        this.connectionId = config.connectionId;
        this.providerConfigKey = config.providerConfigKey;
        this.persistApi = persistApi;
        if (config.activityLogId) {
            this.activityLogId = config.activityLogId;
        }
        this.nango = new Nango(Object.assign({ isSync: true }, config), {
            userAgent: 'sdk'
        });
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
    stringify() {
        return JSON.stringify(this, (key, value) => {
            if (key === 'secretKey') {
                return '********';
            }
            return value;
        });
    }
    proxyConfig(config) {
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
        return Object.assign(Object.assign({}, config), { providerConfigKey: config.providerConfigKey, connectionId: config.connectionId, headers: Object.assign(Object.assign({}, (config.headers || {})), { 'user-agent': this.nango.userAgent }) });
    }
    exitSyncIfAborted() {
        var _a;
        if ((_a = this.abortSignal) === null || _a === void 0 ? void 0 : _a.aborted) {
            process.exit(0);
        }
    }
    proxy(config) {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            if (this.dryRun) {
                const response = yield this.nango.proxy(config);
                if (response instanceof Response) {
                    return transformResponseToAxiosResponse(response);
                }
                return response;
            }
            else {
                const { connectionId, providerConfigKey } = config;
                const connection = yield this.getConnection(providerConfigKey, connectionId);
                if (!connection) {
                    throw new Error(`Connection not found using the provider config key ${this.providerConfigKey} and connection id ${this.connectionId}`);
                }
                const proxyConfig = this.proxyConfig(config);
                const { response, activityLogs: activityLogs } = yield proxyService.route(proxyConfig, {
                    existingActivityLogId: this.activityLogId,
                    connection,
                    provider: this.provider
                });
                if (activityLogs) {
                    // Save buffered logs
                    for (const log of activityLogs) {
                        if (log.level === 'debug') {
                            continue;
                        }
                        if (!this.dryRun) {
                            yield this.sendLogToPersist(log.content, { level: log.level, timestamp: log.timestamp });
                        }
                        else {
                            logger[log.level in logger ? log.level : 'debug'](log.content);
                        }
                    }
                }
                if (response instanceof Error) {
                    throw response;
                }
                if (response instanceof Response) {
                    return transformResponseToAxiosResponse(response);
                }
                return response;
            }
        });
    }
    get(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxy(Object.assign(Object.assign({}, config), { method: 'GET' }));
        });
    }
    post(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxy(Object.assign(Object.assign({}, config), { method: 'POST' }));
        });
    }
    put(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxy(Object.assign(Object.assign({}, config), { method: 'PUT' }));
        });
    }
    patch(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxy(Object.assign(Object.assign({}, config), { method: 'PATCH' }));
        });
    }
    delete(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.proxy(Object.assign(Object.assign({}, config), { method: 'DELETE' }));
        });
    }
    getToken() {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            return this.nango.getToken(this.providerConfigKey, this.connectionId);
        });
    }
    getConnection(providerConfigKeyOverride, connectionIdOverride) {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            const providerConfigKey = providerConfigKeyOverride || this.providerConfigKey;
            const connectionId = connectionIdOverride || this.connectionId;
            const credentialsPair = `${providerConfigKey}${connectionId}`;
            const cachedConnection = this.memoizedConnections.get(credentialsPair);
            if (!cachedConnection || Date.now() - cachedConnection.timestamp > MEMOIZED_CONNECTION_TTL) {
                const connection = yield this.nango.getConnection(providerConfigKey, connectionId);
                this.memoizedConnections.set(credentialsPair, { connection, timestamp: Date.now() });
                return connection;
            }
            return cachedConnection.connection;
        });
    }
    setMetadata(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            try {
                const response = yield this.nango.setMetadata(this.providerConfigKey, this.connectionId, metadata);
                if (response instanceof Response) {
                    return transformResponseToAxiosResponse(response);
                }
                return response;
            }
            finally {
                this.memoizedConnections.delete(`${this.providerConfigKey}${this.connectionId}`);
            }
        });
    }
    updateMetadata(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            try {
                const response = yield this.nango.updateMetadata(this.providerConfigKey, this.connectionId, metadata);
                if (response instanceof Response) {
                    return transformResponseToAxiosResponse(response);
                }
                return response;
            }
            finally {
                this.memoizedConnections.delete(`${this.providerConfigKey}${this.connectionId}`);
            }
        });
    }
    /**
     * @deprecated please use setMetadata instead.
     */
    setFieldMapping(fieldMapping) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.warn('setFieldMapping is deprecated. Please use setMetadata instead.');
            return this.setMetadata(fieldMapping);
        });
    }
    getMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            return (yield this.getConnection(this.providerConfigKey, this.connectionId)).metadata;
        });
    }
    getWebhookURL() {
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            if (this.memoizedIntegration) {
                return this.memoizedIntegration.webhook_url;
            }
            const { config: integration } = yield this.nango.getIntegration(this.providerConfigKey, true);
            if (!integration || !integration.provider) {
                throw Error(`There was no provider found for the provider config key: ${this.providerConfigKey}`);
            }
            this.memoizedIntegration = integration;
            return this.memoizedIntegration.webhook_url;
        });
    }
    /**
     * @deprecated please use getMetadata instead.
     */
    getFieldMapping() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.warn('getFieldMapping is deprecated. Please use getMetadata instead.');
            const metadata = yield this.getMetadata();
            return metadata['fieldMapping'] || {};
        });
    }
    log(...args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            if (args.length === 0) {
                return;
            }
            const lastArg = args[args.length - 1];
            const isUserDefinedLevel = (object) => {
                return lastArg && typeof lastArg === 'object' && 'level' in object;
            };
            const userDefinedLevel = isUserDefinedLevel(lastArg) ? lastArg : undefined;
            if (userDefinedLevel) {
                args.pop();
            }
            const content = safeStringify(args);
            if (this.dryRun) {
                logger.info([...args]);
                return;
            }
            yield this.sendLogToPersist(content, { level: (_a = userDefinedLevel === null || userDefinedLevel === void 0 ? void 0 : userDefinedLevel.level) !== null && _a !== void 0 ? _a : 'info', timestamp: Date.now() });
        });
    }
    getEnvironmentVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.environmentId) {
                throw new Error('There is no current environment to get variables from');
            }
            return yield this.nango.getEnvironmentVariables();
        });
    }
    getFlowAttributes() {
        if (!this.syncJobId) {
            throw new Error('There is no current sync to get attributes from');
        }
        return this.attributes;
    }
    paginate(config) {
        var _a, _b;
        return __asyncGenerator(this, arguments, function* paginate_1() {
            const template = configService.getTemplate(this.provider);
            const templatePaginationConfig = (_a = template.proxy) === null || _a === void 0 ? void 0 : _a.paginate;
            if (!templatePaginationConfig && (!config.paginate || !config.paginate.type)) {
                throw Error('There was no pagination configuration for this integration or configuration passed in.');
            }
            const paginationConfig = Object.assign(Object.assign({}, (templatePaginationConfig || {})), (config.paginate || {}));
            paginateService.validateConfiguration(paginationConfig);
            config.method = config.method || 'GET';
            const configMethod = config.method.toLocaleLowerCase();
            const passPaginationParamsInBody = ['post', 'put', 'patch'].includes(configMethod);
            const updatedBodyOrParams = (_b = (passPaginationParamsInBody ? config.data : config.params)) !== null && _b !== void 0 ? _b : {};
            const limitParameterName = paginationConfig.limit_name_in_request;
            if (paginationConfig['limit']) {
                updatedBodyOrParams[limitParameterName] = paginationConfig['limit'];
            }
            const proxyConfig = this.proxyConfig(config);
            switch (paginationConfig.type.toLowerCase()) {
                case PaginationType.CURSOR:
                    return yield __await(yield __await(yield* __asyncDelegator(__asyncValues(paginateService.cursor(proxyConfig, paginationConfig, updatedBodyOrParams, passPaginationParamsInBody, this.proxy.bind(this))))));
                case PaginationType.LINK:
                    return yield __await(yield __await(yield* __asyncDelegator(__asyncValues(paginateService.link(proxyConfig, paginationConfig, updatedBodyOrParams, passPaginationParamsInBody, this.proxy.bind(this))))));
                case PaginationType.OFFSET:
                    return yield __await(yield __await(yield* __asyncDelegator(__asyncValues(paginateService.offset(proxyConfig, paginationConfig, updatedBodyOrParams, passPaginationParamsInBody, this.proxy.bind(this))))));
                default:
                    throw Error(`'${paginationConfig.type} ' pagination is not supported. Please, make sure it's one of ${Object.values(PaginationType)}`);
            }
        });
    }
    triggerAction(providerConfigKey, connectionId, actionName, input) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.nango.triggerAction(providerConfigKey, connectionId, actionName, input);
        });
    }
    triggerSync(providerConfigKey, connectionId, syncName, fullResync) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dryRun && this.dryRunService) {
                return this.dryRunService.run({
                    sync: syncName,
                    connectionId,
                    autoConfirm: true,
                    debug: false
                });
            }
            else {
                return this.nango.triggerSync(providerConfigKey, [syncName], connectionId, fullResync);
            }
        });
    }
    sendLogToPersist(content, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.persistApi({
                method: 'POST',
                url: `/environment/${this.environmentId}/log`,
                headers: {
                    Authorization: `Bearer ${this.nango.secretKey}`
                },
                data: {
                    activityLogId: this.activityLogId,
                    level: (_a = options.level) !== null && _a !== void 0 ? _a : 'info',
                    timestamp: options.timestamp,
                    msg: content
                }
            });
            if (response.status > 299) {
                logger.error(`Request to persist API (log) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`, this.stringify());
                throw new Error(`Failed to log: ${JSON.stringify(response.data)}`);
            }
        });
    }
}
export class NangoSync extends NangoAction {
    constructor(config) {
        super(config);
        this.track_deletes = false;
        this.logMessages = {
            counts: { updated: 0, added: 0, deleted: 0 },
            messages: []
        };
        this.stubbedMetadata = undefined;
        this.batchSize = 1000;
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
    batchSend(results, model) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.warn('batchSend will be deprecated in future versions. Please use batchSave instead.');
            return this.batchSave(results, model);
        });
    }
    batchSave(results, model) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
                (_a = this.logMessages) === null || _a === void 0 ? void 0 : _a.messages.push(`A batch save call would save the following data to the ${model} model:`);
                for (const msg of results) {
                    (_b = this.logMessages) === null || _b === void 0 ? void 0 : _b.messages.push(msg);
                }
                if (this.logMessages && this.logMessages.counts) {
                    this.logMessages.counts.added = Number(this.logMessages.counts.added) + results.length;
                }
                return null;
            }
            for (let i = 0; i < results.length; i += this.batchSize) {
                const batch = results.slice(i, i + this.batchSize);
                const response = yield this.persistApi({
                    method: 'POST',
                    url: `/environment/${this.environmentId}/connection/${this.nangoConnectionId}/sync/${this.syncId}/job/${this.syncJobId}/records`,
                    headers: {
                        Authorization: `Bearer ${this.nango.secretKey}`
                    },
                    data: {
                        model,
                        records: batch,
                        providerConfigKey: this.providerConfigKey,
                        connectionId: this.connectionId,
                        activityLogId: this.activityLogId
                    }
                });
                if (response.status > 299) {
                    logger.error(`Request to persist API (batchSave) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`, this.stringify());
                    throw new Error(`cannot save records for sync '${this.syncId}': ${JSON.stringify(response.data)}`);
                }
            }
            return true;
        });
    }
    batchDelete(results, model) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
                (_a = this.logMessages) === null || _a === void 0 ? void 0 : _a.messages.push(`A batch delete call would delete the following data:`);
                for (const msg of results) {
                    (_b = this.logMessages) === null || _b === void 0 ? void 0 : _b.messages.push(msg);
                }
                if (this.logMessages && this.logMessages.counts) {
                    this.logMessages.counts.deleted = Number(this.logMessages.counts.deleted) + results.length;
                }
                return null;
            }
            for (let i = 0; i < results.length; i += this.batchSize) {
                const batch = results.slice(i, i + this.batchSize);
                const response = yield this.persistApi({
                    method: 'DELETE',
                    url: `/environment/${this.environmentId}/connection/${this.nangoConnectionId}/sync/${this.syncId}/job/${this.syncJobId}/records`,
                    headers: {
                        Authorization: `Bearer ${this.nango.secretKey}`
                    },
                    data: {
                        model,
                        records: batch,
                        providerConfigKey: this.providerConfigKey,
                        connectionId: this.connectionId,
                        activityLogId: this.activityLogId
                    }
                });
                if (response.status > 299) {
                    logger.error(`Request to persist API (batchDelete) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`, this.stringify());
                    throw new Error(`cannot delete records for sync '${this.syncId}': ${JSON.stringify(response.data)}`);
                }
            }
            return true;
        });
    }
    batchUpdate(results, model) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
                (_a = this.logMessages) === null || _a === void 0 ? void 0 : _a.messages.push(`A batch update call would update the following data to the ${model} model:`);
                for (const msg of results) {
                    (_b = this.logMessages) === null || _b === void 0 ? void 0 : _b.messages.push(msg);
                }
                if (this.logMessages && this.logMessages.counts) {
                    this.logMessages.counts.updated = Number(this.logMessages.counts.updated) + results.length;
                }
                return null;
            }
            for (let i = 0; i < results.length; i += this.batchSize) {
                const batch = results.slice(i, i + this.batchSize);
                const response = yield this.persistApi({
                    method: 'PUT',
                    url: `/environment/${this.environmentId}/connection/${this.nangoConnectionId}/sync/${this.syncId}/job/${this.syncJobId}/records`,
                    headers: {
                        Authorization: `Bearer ${this.nango.secretKey}`
                    },
                    data: {
                        model,
                        records: batch,
                        providerConfigKey: this.providerConfigKey,
                        connectionId: this.connectionId,
                        activityLogId: this.activityLogId
                    }
                });
                if (response.status > 299) {
                    logger.error(`Request to persist API (batchUpdate) failed: errorCode=${response.status} response='${JSON.stringify(response.data)}'`, this.stringify());
                    throw new Error(`cannot update records for sync '${this.syncId}': ${JSON.stringify(response.data)}`);
                }
            }
            return true;
        });
    }
    getMetadata() {
        const _super = Object.create(null, {
            getMetadata: { get: () => super.getMetadata }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.exitSyncIfAborted();
            if (this.dryRun && this.stubbedMetadata) {
                return this.stubbedMetadata;
            }
            return _super.getMetadata.call(this);
        });
    }
}
const TELEMETRY_ALLOWED_METHODS = [
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
export function instrumentSDK(rawNango) {
    return new Proxy(rawNango, {
        get(target, propKey) {
            // Method name is not matching the allowList we don't do anything else
            if (!TELEMETRY_ALLOWED_METHODS.includes(propKey)) {
                return target[propKey];
            }
            return metrics.time(`${metrics.Types.RUNNER_SDK}.${propKey}`, target[propKey].bind(target));
        }
    });
}
/* eslint-enable no-inner-declarations */
//# sourceMappingURL=sync.js.map