var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { multipleMigrations } from '@nangohq/database';
import { connectionService, seeders } from '@nangohq/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runServer, shouldBeProtected } from '../../utils/tests.js';
let api;
const endpoint = '/connection/metadata';
describe(`POST ${endpoint}`, () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        api = yield runServer();
    }));
    afterAll(() => {
        api.server.close();
    });
    it('should be protected', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield api.fetch(endpoint, {
            method: 'POST',
            body: {
                connection_id: '1',
                provider_config_key: 'test',
                metadata: {}
            }
        });
        shouldBeProtected(res);
    }));
    it('should validate body with an empty connection_id', () => __awaiter(void 0, void 0, void 0, function* () {
        const env = yield seeders.createEnvironmentSeed();
        const res = yield api.fetch(endpoint, {
            method: 'POST',
            token: env.secret_key,
            body: {
                connection_id: '',
                provider_config_key: 'test',
                metadata: {}
            }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'invalid_body',
                errors: [
                    {
                        code: 'too_small',
                        message: 'String must contain at least 1 character(s)',
                        path: ['connection_id']
                    }
                ]
            }
        });
        expect(res.res.status).toBe(400);
    }));
    it('should validate body with an empty provider config key', () => __awaiter(void 0, void 0, void 0, function* () {
        const env = yield seeders.createEnvironmentSeed();
        const res = yield api.fetch(endpoint, {
            method: 'POST',
            token: env.secret_key,
            body: {
                connection_id: 'abc',
                provider_config_key: '',
                metadata: {}
            }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'invalid_body',
                errors: [
                    {
                        code: 'too_small',
                        message: 'String must contain at least 1 character(s)',
                        path: ['provider_config_key']
                    }
                ]
            }
        });
        expect(res.res.status).toBe(400);
    }));
    it('should provide an unknown connection response if a bad connection is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const env = yield seeders.createEnvironmentSeed();
        const connection_id = 'abc';
        const provider_config_key = 'test';
        const res = yield api.fetch(endpoint, {
            method: 'POST',
            token: env.secret_key,
            body: {
                connection_id,
                provider_config_key,
                metadata: {}
            }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'unknown_connection',
                message: `Connection with connection id ${connection_id} and provider config key ${provider_config_key} not found. Please make sure the connection exists in the Nango dashboard`
            }
        });
        expect(res.res.status).toBe(404);
    }));
    it('should provide an unknown connection response if bad connections are provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const env = yield seeders.createEnvironmentSeed();
        const connection_id = ['abc', 'def'];
        const provider_config_key = 'test';
        const res = yield api.fetch(endpoint, {
            method: 'POST',
            token: env.secret_key,
            body: {
                connection_id,
                provider_config_key,
                metadata: {}
            }
        });
        expect(res.json).toStrictEqual({
            error: {
                code: 'unknown_connection',
                message: `Connection with connection id ${connection_id[0]} and provider config key ${provider_config_key} not found. Please make sure the connection exists in the Nango dashboard. No actions were taken on any of the connections as a result of this failure.`
            }
        });
        expect(res.res.status).toBe(404);
    }));
    it('Should replace existing metadata, overwriting anything existing', () => __awaiter(void 0, void 0, void 0, function* () {
        const env = yield seeders.createEnvironmentSeed();
        yield seeders.createConfigSeed(env, 'test-replace', 'google');
        const connections = yield seeders.createConnectionSeed(env, 'test-replace');
        const { connection_id, provider_config_key } = connections;
        const initialMetadata = {
            name: 'test',
            host: 'test'
        };
        const res = yield api.fetch(endpoint, {
            method: 'POST',
            token: env.secret_key,
            body: {
                connection_id,
                provider_config_key,
                metadata: initialMetadata
            }
        });
        expect(res.res.status).toBe(201);
        expect(res.json).toEqual({
            connection_id,
            provider_config_key,
            metadata: initialMetadata
        });
        const { response: connection } = yield connectionService.getConnection(connection_id, provider_config_key, env.id);
        expect(connection === null || connection === void 0 ? void 0 : connection.metadata).toEqual(initialMetadata);
        const newMetadata = {
            additionalName: 'test23'
        };
        const resTwo = yield api.fetch(endpoint, {
            method: 'POST',
            token: env.secret_key,
            body: {
                connection_id,
                provider_config_key,
                metadata: newMetadata
            }
        });
        expect(resTwo.res.status).toBe(201);
        expect(resTwo.json).toEqual({
            connection_id,
            provider_config_key,
            metadata: newMetadata
        });
        const { response: connectionTwo } = yield connectionService.getConnection(connection_id, provider_config_key, env.id);
        expect(connectionTwo === null || connectionTwo === void 0 ? void 0 : connectionTwo.metadata).toEqual(newMetadata);
    }));
});
//# sourceMappingURL=setMetadata.integration.test.js.map