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
import { multipleMigrations } from '@nangohq/database';
import { seeders } from '@nangohq/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runServer, shouldBeProtected, shouldRequireQueryEnv } from '../../../utils/tests.js';
let api;
describe('GET /logs/operations/:operationId', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        yield migrateLogsMapping();
        api = yield runServer();
    }));
    afterAll(() => {
        api.server.close();
    });
    it('should be protected', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield api.fetch('/api/v1/logs/operations/:operationId', { query: { env: 'dev' }, params: { operationId: '1' } });
        shouldBeProtected(res);
    }));
    it('should enforce env query params', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield api.fetch('/api/v1/logs/operations/:operationId', 
        // @ts-expect-error missing query on purpose
        { token: env.secret_key, params: { operationId: '1' } });
        shouldRequireQueryEnv(res);
    }));
    it('should validate query params', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield api.fetch('/api/v1/logs/operations/:operationId', {
            query: {
                env: 'dev',
                // @ts-expect-error on purpose
                foo: 'bar'
            },
            token: env.secret_key,
            params: { operationId: '1' }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'invalid_query_params',
                errors: [
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
    it('should get empty result', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield api.fetch('/api/v1/logs/operations/:operationId', {
            query: { env: 'dev' },
            token: env.secret_key,
            params: { operationId: '1' }
        });
        expect(res.res.status).toBe(404);
        expect(res.json).toStrictEqual({
            error: { code: 'not_found' }
        });
    }));
    it('should get one result', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env, account } = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch(`/api/v1/logs/operations/:operationId`, {
            query: { env: 'dev' },
            token: env.secret_key,
            params: { operationId: logCtx.id }
        });
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: {
                accountId: env.account_id,
                accountName: account.name,
                code: null,
                integrationId: null,
                integrationName: null,
                providerName: null,
                connectionId: null,
                connectionName: null,
                createdAt: expect.toBeIsoDate(),
                endedAt: expect.toBeIsoDate(),
                environmentId: env.id,
                environmentName: 'dev',
                error: null,
                expiresAt: expect.toBeIsoDate(),
                id: logCtx.id,
                jobId: null,
                level: 'info',
                message: 'test 1',
                meta: null,
                operation: {
                    type: 'proxy'
                },
                parentId: null,
                request: null,
                response: null,
                source: 'internal',
                startedAt: expect.toBeIsoDate(),
                state: 'success',
                syncConfigId: null,
                syncConfigName: null,
                title: null,
                type: 'log',
                updatedAt: expect.toBeIsoDate(),
                userId: null
            }
        });
    }));
    it('should not return result from an other account', () => __awaiter(void 0, void 0, void 0, function* () {
        const { account, env } = yield seeders.seedAccountEnvAndUser();
        const env2 = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch(`/api/v1/logs/operations/:operationId`, {
            query: { env: 'dev' },
            token: env2.env.secret_key,
            params: { operationId: logCtx.id }
        });
        expect(res.res.status).toBe(404);
        expect(res.json).toStrictEqual({
            error: { code: 'not_found' }
        });
    }));
});
//# sourceMappingURL=getOperation.integration.test.js.map