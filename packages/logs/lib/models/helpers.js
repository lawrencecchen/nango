import { nanoid } from '@nangohq/utils';
import { z } from 'zod';
import { defaultOperationExpiration } from '../env.js';
export const operationIdRegex = z.string().regex(/([0-9]|[a-zA-Z0-9]{20})/);
export function getFormattedMessage(data, { account, user, environment, integration, connection, syncConfig, meta } = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const now = new Date();
    return {
        id: data.id || nanoid(),
        source: data.source || 'internal',
        level: data.level || 'info',
        operation: data.operation || null,
        type: data.type || 'log',
        message: data.message || '',
        title: data.title || null,
        code: data.code || null,
        state: data.state || 'waiting',
        accountId: (_b = (_a = account === null || account === void 0 ? void 0 : account.id) !== null && _a !== void 0 ? _a : data.accountId) !== null && _b !== void 0 ? _b : null,
        accountName: (account === null || account === void 0 ? void 0 : account.name) || data.accountName || null,
        environmentId: (_d = (_c = environment === null || environment === void 0 ? void 0 : environment.id) !== null && _c !== void 0 ? _c : data.environmentId) !== null && _d !== void 0 ? _d : null,
        environmentName: (environment === null || environment === void 0 ? void 0 : environment.name) || data.environmentName || null,
        integrationId: (_f = (_e = integration === null || integration === void 0 ? void 0 : integration.id) !== null && _e !== void 0 ? _e : data.integrationId) !== null && _f !== void 0 ? _f : null,
        integrationName: (integration === null || integration === void 0 ? void 0 : integration.name) || data.integrationName || null,
        providerName: (integration === null || integration === void 0 ? void 0 : integration.provider) || data.providerName || null,
        connectionId: (_h = (_g = connection === null || connection === void 0 ? void 0 : connection.id) !== null && _g !== void 0 ? _g : data.connectionId) !== null && _h !== void 0 ? _h : null,
        connectionName: (connection === null || connection === void 0 ? void 0 : connection.name) || data.connectionName || null,
        syncConfigId: (syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.id) || data.syncConfigId || null,
        syncConfigName: (syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.name) || data.syncConfigName || null,
        jobId: data.jobId || null,
        userId: (user === null || user === void 0 ? void 0 : user.id) || data.userId || null,
        parentId: data.parentId || null,
        error: data.error || null,
        request: data.request || null,
        response: data.response || null,
        meta: meta || data.meta || null,
        createdAt: data.createdAt || now.toISOString(),
        updatedAt: data.updatedAt || now.toISOString(),
        startedAt: data.startedAt || null,
        endedAt: data.endedAt || null,
        expiresAt: data.operation ? data.expiresAt || defaultOperationExpiration.sync() : null
    };
}
export const oldLevelToNewLevel = {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    verbose: 'debug',
    silly: 'debug',
    http: 'info'
};
export function getFullIndexName(prefix, createdAt) {
    return `${prefix}.${new Date(createdAt).toISOString().split('T')[0]}`;
}
export function createCursor({ sort }) {
    return Buffer.from(JSON.stringify(sort)).toString('base64');
}
export function parseCursor(str) {
    return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
}
//# sourceMappingURL=helpers.js.map