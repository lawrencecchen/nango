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
import { isSuccess, runServer, shouldBeProtected, shouldRequireQueryEnv } from '../../../utils/tests.js';
let api;
describe('POST /logs/filters', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        yield migrateLogsMapping();
        api = yield runServer();
    }));
    afterAll(() => {
        api.server.close();
    });
    it('should be protected', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield api.fetch('/api/v1/logs/filters', { method: 'POST', query: { env: 'dev' }, body: { category: 'integration', search: '' } });
        shouldBeProtected(res);
    }));
    it('should enforce env query params', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        // @ts-expect-error missing query on purpose
        const res = yield api.fetch('/api/v1/logs/filters', { method: 'POST', token: env.secret_key, body: { category: 'config' } });
        shouldRequireQueryEnv(res);
    }));
    it('should validate body', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield api.fetch('/api/v1/logs/filters', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            // @ts-expect-error on purpose
            body: { category: 'a', foo: 'bar' }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'invalid_body',
                errors: [
                    {
                        code: 'invalid_enum_value',
                        message: "Invalid enum value. Expected 'integration' | 'connection' | 'syncConfig', received 'a'",
                        path: ['category']
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
    it('should search filters and get empty results', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield api.fetch('/api/v1/logs/filters', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            body: { category: 'integration', search: '' }
        });
        isSuccess(res.json);
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: []
        });
    }));
    it('should search filters and get one result', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env, account } = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env, integration: { id: 1, name: 'hello', provider: 'github' } });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch('/api/v1/logs/filters', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            body: { category: 'integration', search: '' }
        });
        isSuccess(res.json);
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: [{ key: 'hello', doc_count: 1 }]
        });
    }));
    it('should search filters with a query and get one result', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env, account } = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env, integration: { id: 1, name: 'hello', provider: 'github' } });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch('/api/v1/logs/filters', {
            method: 'POST',
            query: { env: 'dev' },
            token: env.secret_key,
            body: { category: 'integration', search: 'hel' }
        });
        isSuccess(res.json);
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: [{ key: 'hello', doc_count: 1 }]
        });
    }));
    it('should search messages and not return results from an other account', () => __awaiter(void 0, void 0, void 0, function* () {
        const { account, env } = yield seeders.seedAccountEnvAndUser();
        const env2 = yield seeders.seedAccountEnvAndUser();
        const logCtx = yield logContextGetter.create({ message: 'test 1', operation: { type: 'proxy' } }, { account, environment: env, integration: { id: 1, name: 'hello', provider: 'github' } });
        yield logCtx.info('test info');
        yield logCtx.success();
        const res = yield api.fetch('/api/v1/logs/filters', {
            method: 'POST',
            query: { env: 'dev' },
            token: env2.env.secret_key,
            body: { category: 'integration', search: '' }
        });
        isSuccess(res.json);
        expect(res.res.status).toBe(200);
        expect(res.json).toStrictEqual({
            data: []
        });
    }));
});
//# sourceMappingURL=searchFilters.integration.test.js.map