var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { logContextGetter, migrateLogsMapping } from '@nangohq/logs';
import { seeders } from '@nangohq/shared';
import { multipleMigrations } from '@nangohq/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isError, isSuccess, runServer, shouldBeProtected, shouldRequireQueryEnv } from '../../../utils/tests.js';
let api;
describe('POST /logs/messages', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        yield migrateLogsMapping();
        api = yield runServer();
    }));
    afterAll(() => {
        api.server.close();
    });
    it('should be protected', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield api.fetch('/api/v1/logs/messages', { method: 'POST', query: { env: 'dev' }, body: { operationId: '1' } });
        shouldBeProtected(res);
    }));
    it('should enforce env query params', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        // @ts-expect-error missing query on purpose
        const res = yield api.fetch('/api/v1/logs/messages', { method: 'POST', token: env.secret_key, body: { operationId: '1' } });
        shouldRequireQueryEnv(res);
    }));
    it('should validate body', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield api.fetch('/api/v1/logs/messages', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            // @ts-expect-error on purpose
            body: { limit: 'a', foo: 'bar' }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'invalid_body',
                errors: [
                    {
                        code: 'invalid_type',
                        message: 'Required',
                        path: ['operationId']
                    },
                    {
                        code: 'invalid_type',
                        message: 'Expected number, received string',
                        path: ['limit']
                    },
                    {
                        code: 'unrecognized_keys',
                        message: "Unrecognized key(s) in object: 'foo'",
                        path: []
                    }
                ]
            }
        });
        expect(res.res.status).toBe(400);
    }));
    it('should search messages and get empty results', () => __awaiter(void 0, void 0, void 0, function* () {
        const { account, env } = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env });
        yield logCtx.success();
        const res = yield api.fetch('/api/v1/logs/messages', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            body: { operationId: logCtx.id, limit: 10 }
        });
        isSuccess(res.json);
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: [],
            pagination: { total: 0, cursorAfter: null, cursorBefore: null }
        });
    }));
    it('should search messages and get one result', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env, account } = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch('/api/v1/logs/messages', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            body: { operationId: logCtx.id, limit: 10 }
        });
        isSuccess(res.json);
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: [
                {
                    accountId: null,
                    accountName: null,
                    code: null,
                    integrationId: null,
                    integrationName: null,
                    providerName: null,
                    connectionId: null,
                    connectionName: null,
                    createdAt: expect.toBeIsoDate(),
                    endedAt: null,
                    environmentId: null,
                    environmentName: null,
                    error: null,
                    expiresAt: null,
                    id: expect.any(String),
                    jobId: null,
                    level: 'info',
                    message: 'test info',
                    meta: null,
                    operation: null,
                    parentId: logCtx.id,
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
                    userId: null
                }
            ],
            pagination: { total: 1, cursorBefore: expect.any(String), cursorAfter: null }
        });
    }));
    it('should search messages and not return results from an other account', () => __awaiter(void 0, void 0, void 0, function* () {
        const { account, env } = yield seeders.seedAccountEnvAndUser();
        const env2 = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch('/api/v1/logs/messages', {
            method: 'POST',
            query: { env: 'dev' },
            token: env2.env.secret_key,
            body: { operationId: logCtx.id, limit: 10 }
        });
        isError(res.json);
        expect(res.res.status).toBe(404);
        expect(res.json).toStrictEqual({ error: { code: 'not_found' } });
    }));
});
//# sourceMappingURL=searchMessages.integration.test.js.map