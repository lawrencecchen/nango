var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { describe, beforeAll, it, expect, vi } from 'vitest';
import { afterEach } from 'node:test';
import * as model from './models/messages.js';
import { logger } from './utils.js';
import { deleteIndex, migrateMapping } from './es/helpers.js';
import { getOperation, listMessages, listOperations } from './models/messages.js';
import { logContextGetter } from './models/logContextGetter.js';
import { indexMessages } from './es/schema.js';
const account = { id: 1234, name: 'test' };
const environment = { id: 5678, name: 'dev' };
const operationPayload = {
    operation: {
        type: 'sync',
        action: 'run'
    },
    message: ''
};
describe('client', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteIndex({ prefix: indexMessages.index });
        yield migrateMapping();
    }));
    afterEach(() => {
        vi.clearAllMocks();
    });
    it('should list nothing', () => __awaiter(void 0, void 0, void 0, function* () {
        const list = yield listOperations({ accountId: account.id, limit: 1, states: ['all'] });
        expect(list).toStrictEqual({
            cursor: null,
            count: 0,
            items: []
        });
    }));
    it('should insert an operation', () => __awaiter(void 0, void 0, void 0, function* () {
        const spy = vi.spyOn(model, 'createMessage');
        const ctx = yield logContextGetter.create(operationPayload, { start: false, account, environment }, { logToConsole: false });
        expect(ctx).toMatchObject({ id: expect.any(String) });
        expect(spy).toHaveBeenCalled();
        const list = yield listOperations({ accountId: account.id, limit: 1, states: ['all'] });
        expect(list).toStrictEqual({
            cursor: null,
            count: 1,
            items: [
                {
                    accountId: 1234,
                    accountName: 'test',
                    code: null,
                    integrationId: null,
                    integrationName: null,
                    providerName: null,
                    connectionId: null,
                    connectionName: null,
                    createdAt: expect.toBeIsoDate(),
                    endedAt: null,
                    environmentId: 5678,
                    environmentName: 'dev',
                    error: null,
                    expiresAt: expect.toBeIsoDate(),
                    id: ctx.id,
                    jobId: null,
                    level: 'info',
                    message: '',
                    meta: null,
                    parentId: null,
                    request: null,
                    response: null,
                    source: 'internal',
                    startedAt: null,
                    state: 'waiting',
                    syncConfigId: null,
                    syncConfigName: null,
                    title: null,
                    type: 'log',
                    updatedAt: expect.toBeIsoDate(),
                    userId: null,
                    operation: { action: 'run', type: 'sync' }
                }
            ]
        });
    }));
    it('should respect dryRun=true', () => __awaiter(void 0, void 0, void 0, function* () {
        const spyMsg = vi.spyOn(model, 'createMessage');
        const spyLogInfo = vi.spyOn(logger, 'info');
        const spyLogError = vi.spyOn(logger, 'error');
        // Create operation
        expect(spyMsg).not.toHaveBeenCalled();
        const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { dryRun: true, logToConsole: true });
        expect(ctx).toMatchObject({ id: expect.any(String) });
        expect(spyMsg).not.toHaveBeenCalled();
        expect(spyLogInfo).toHaveBeenCalled();
        // Insert msg
        yield ctx.error('test');
        expect(spyMsg).not.toHaveBeenCalled();
        expect(spyLogInfo).toHaveBeenCalledTimes(1);
        expect(spyLogError).toHaveBeenCalledTimes(1);
    }));
    it('should respect logToConsole=false', () => __awaiter(void 0, void 0, void 0, function* () {
        const spy = vi.spyOn(logger, 'info');
        // Create operation
        expect(spy).not.toHaveBeenCalled();
        const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { dryRun: true, logToConsole: false });
        expect(ctx).toMatchObject({ id: expect.any(String) });
        expect(spy).not.toHaveBeenCalled();
        // Insert msg
        yield ctx.error('test');
        expect(spy).not.toHaveBeenCalled();
    }));
    describe('states', () => {
        it('should set operation as started', () => __awaiter(void 0, void 0, void 0, function* () {
            const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { logToConsole: false });
            yield ctx.start();
            const operation = yield getOperation({ id: ctx.id });
            expect(operation).toMatchObject({
                id: ctx.id,
                level: 'info',
                state: 'running',
                startedAt: expect.toBeIsoDate(),
                endedAt: null
            });
        }));
        it('should set operation as cancelled', () => __awaiter(void 0, void 0, void 0, function* () {
            const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { logToConsole: false });
            yield ctx.cancel();
            const operation = yield getOperation({ id: ctx.id });
            expect(operation).toMatchObject({
                id: ctx.id,
                level: 'info',
                state: 'cancelled',
                startedAt: expect.toBeIsoDate(),
                endedAt: expect.toBeIsoDate()
            });
        }));
        it('should set operation as timeout', () => __awaiter(void 0, void 0, void 0, function* () {
            const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { logToConsole: false });
            yield ctx.timeout();
            const operation = yield getOperation({ id: ctx.id });
            expect(operation).toMatchObject({
                id: ctx.id,
                level: 'info',
                state: 'timeout',
                startedAt: expect.toBeIsoDate(),
                endedAt: expect.toBeIsoDate()
            });
        }));
        it('should set operation as success', () => __awaiter(void 0, void 0, void 0, function* () {
            const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { logToConsole: false });
            yield ctx.success();
            const operation = yield getOperation({ id: ctx.id });
            expect(operation).toMatchObject({
                id: ctx.id,
                level: 'info',
                state: 'success',
                startedAt: expect.toBeIsoDate(),
                endedAt: expect.toBeIsoDate()
            });
        }));
        it('should set operation as failed', () => __awaiter(void 0, void 0, void 0, function* () {
            const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { logToConsole: false });
            yield ctx.failed();
            const operation = yield getOperation({ id: ctx.id });
            expect(operation).toMatchObject({
                id: ctx.id,
                level: 'info',
                state: 'failed',
                startedAt: expect.toBeIsoDate(),
                endedAt: expect.toBeIsoDate()
            });
        }));
    });
    describe('log type', () => {
        it('should log all types', () => __awaiter(void 0, void 0, void 0, function* () {
            const ctx = yield logContextGetter.create(operationPayload, { account, environment }, { logToConsole: false });
            yield ctx.trace('trace msg');
            yield ctx.debug('debug msg');
            yield ctx.info('info msg');
            yield ctx.warn('warn msg');
            yield ctx.error('error msg');
            const list = yield listMessages({ parentId: ctx.id, limit: 5 });
            expect(list).toMatchObject({
                count: 5,
                items: [
                    { parentId: ctx.id, level: 'error', message: 'error msg' },
                    { parentId: ctx.id, level: 'warn', message: 'warn msg' },
                    { parentId: ctx.id, level: 'info', message: 'info msg' },
                    { parentId: ctx.id, level: 'debug', message: 'debug msg' },
                    { parentId: ctx.id, level: 'debug', message: 'trace msg' }
                ]
            });
        }));
    });
});
//# sourceMappingURL=client.integration.test.js.map