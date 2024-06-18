var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll, afterAll, vi } from 'vitest';
import fetch from 'node-fetch';
import db, { multipleMigrations } from '@nangohq/database';
import { environmentService, connectionService, createSync, createSyncJob, SyncType, SyncStatus, accountService } from '@nangohq/shared';
import { logContextGetter, migrateLogsMapping } from '@nangohq/logs';
import { migrate as migrateRecords } from '@nangohq/records';
import { server } from './server.js';
const mockSecretKey = 'secret-key';
describe('Persist API', () => {
    const port = 3096;
    const serverUrl = `http://localhost:${port}`;
    let seed;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        yield migrateRecords();
        yield migrateLogsMapping();
        seed = yield initDb();
        server.listen(port);
        vi.spyOn(environmentService, 'getAccountAndEnvironmentBySecretKey').mockImplementation((secretKey) => {
            if (secretKey === mockSecretKey) {
                return Promise.resolve({ account: seed.account, environment: seed.env });
            }
            return Promise.resolve(null);
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield clearDb();
    }));
    it('should server /health', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield fetch(`${serverUrl}/health`);
        expect(response.status).toEqual(200);
        expect(yield response.json()).toEqual({ status: 'ok' });
    }));
    it('should log', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/log`, {
            method: 'POST',
            body: JSON.stringify({ activityLogId: seed.activityLogId, level: 'info', msg: 'Hello, world!' }),
            headers: {
                Authorization: `Bearer ${mockSecretKey}`,
                'Content-Type': 'application/json'
            }
        });
        expect(response.status).toEqual(201);
    }));
    it('should refuse huge log', () => __awaiter(void 0, void 0, void 0, function* () {
        const msg = [];
        for (let index = 0; index < 150000; index++) {
            msg.push(index);
        }
        const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/log`, {
            method: 'POST',
            body: JSON.stringify({ activityLogId: seed.activityLogId, level: 'info', msg: msg.join(',') }),
            headers: {
                Authorization: `Bearer ${mockSecretKey}`,
                'Content-Type': 'application/json'
            }
        });
        expect(response.status).toEqual(400);
        expect(yield response.json()).toStrictEqual({ error: 'Entity too large' });
    }));
    describe('save records', () => {
        it('should error if no records', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/connection/${seed.connection.id}/sync/${seed.sync.id}/job/${seed.syncJob.id}/records`, {
                method: 'POST',
                body: JSON.stringify({
                    model: 'MyModel',
                    records: [],
                    providerConfigKey: seed.connection.provider_config_key,
                    connectionId: seed.connection.connection_id,
                    lastSyncDate: new Date(),
                    trackDeletes: false,
                    softDelete: true,
                    activityLogId: seed.activityLogId
                }),
                headers: {
                    Authorization: `Bearer ${mockSecretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            expect(response.status).toEqual(400);
            const respBody = (yield response.json());
            expect(respBody).toMatchObject([
                {
                    type: 'Body',
                    errors: {
                        issues: [
                            {
                                code: 'too_small',
                                minimum: 1,
                                type: 'array',
                                message: 'Array must contain at least 1 element(s)',
                                path: ['records']
                            }
                        ],
                        name: 'ZodError'
                    }
                }
            ]);
        }));
        it('should save records', () => __awaiter(void 0, void 0, void 0, function* () {
            const model = 'MyModel';
            const records = [
                { id: 1, name: 'r1' },
                { id: 2, name: 'r2' }
            ];
            const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/connection/${seed.connection.id}/sync/${seed.sync.id}/job/${seed.syncJob.id}/records`, {
                method: 'POST',
                body: JSON.stringify({
                    model,
                    records: records,
                    providerConfigKey: seed.connection.provider_config_key,
                    connectionId: seed.connection.connection_id,
                    activityLogId: seed.activityLogId,
                    lastSyncDate: new Date(),
                    trackDeletes: false
                }),
                headers: {
                    Authorization: `Bearer ${mockSecretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            expect(response.status).toEqual(201);
        }));
    });
    it('should delete records ', () => __awaiter(void 0, void 0, void 0, function* () {
        const model = 'MyModel';
        const records = [
            { id: 1, name: 'r1' },
            { id: 2, name: 'r2' }
        ];
        const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/connection/${seed.connection.id}/sync/${seed.sync.id}/job/${seed.syncJob.id}/records`, {
            method: 'DELETE',
            body: JSON.stringify({
                model,
                records: records,
                providerConfigKey: seed.connection.provider_config_key,
                connectionId: seed.connection.connection_id,
                activityLogId: seed.activityLogId,
                lastSyncDate: new Date(),
                trackDeletes: false
            }),
            headers: {
                Authorization: `Bearer ${mockSecretKey}`,
                'Content-Type': 'application/json'
            }
        });
        expect(response.status).toEqual(201);
    }));
    it('should update records ', () => __awaiter(void 0, void 0, void 0, function* () {
        const model = 'MyModel';
        const records = [
            { id: 1, name: 'new1' },
            { id: 2, name: 'new2' }
        ];
        const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/connection/${seed.connection.id}/sync/${seed.sync.id}/job/${seed.syncJob.id}/records`, {
            method: 'PUT',
            body: JSON.stringify({
                model,
                records: records,
                providerConfigKey: seed.connection.provider_config_key,
                connectionId: seed.connection.connection_id,
                activityLogId: seed.activityLogId,
                lastSyncDate: new Date(),
                trackDeletes: false,
                softDelete: true
            }),
            headers: {
                Authorization: `Bearer ${mockSecretKey}`,
                'Content-Type': 'application/json'
            }
        });
        expect(response.status).toEqual(201);
    }));
    it('should fail if passing incorrect authorization header ', () => __awaiter(void 0, void 0, void 0, function* () {
        const recordsUrl = `${serverUrl}/environment/${seed.env.id}/connection/${seed.connection.id}/sync/${seed.sync.id}/job/${seed.syncJob.id}/records`;
        const reqs = [`POST ${serverUrl}/environment/${seed.env.id}/log`, `POST ${recordsUrl}`, `PUT ${recordsUrl}`, `DELETE ${recordsUrl}`];
        for (const req of reqs) {
            const [method, url] = req.split(' ');
            if (method && url) {
                const res = yield fetch(url, {
                    method,
                    headers: { Authorization: `Bearer WRONG_SECRET_KEY` }
                });
                expect(res.status).toEqual(401);
            }
            else {
                throw new Error('Invalid request');
            }
        }
    }));
    it('should fail with invalid records ', () => __awaiter(void 0, void 0, void 0, function* () {
        const model = 'MyModel';
        const records = [{ id: 'id'.repeat(200), name: 'new1' }];
        const response = yield fetch(`${serverUrl}/environment/${seed.env.id}/connection/${seed.connection.id}/sync/${seed.sync.id}/job/${seed.syncJob.id}/records`, {
            method: 'PUT',
            body: JSON.stringify({
                model,
                records: records,
                providerConfigKey: seed.connection.provider_config_key,
                connectionId: seed.connection.connection_id,
                activityLogId: seed.activityLogId,
                lastSyncDate: new Date(),
                trackDeletes: false,
                softDelete: true
            }),
            headers: {
                Authorization: `Bearer ${mockSecretKey}`,
                'Content-Type': 'application/json'
            }
        });
        expect(response.status).toEqual(400);
        expect(yield response.json()).toStrictEqual([
            {
                errors: {
                    issues: [
                        {
                            code: 'too_big',
                            exact: false,
                            inclusive: true,
                            maximum: 255,
                            message: 'String must contain at most 255 character(s)',
                            path: ['records', 0, 'id'],
                            type: 'string'
                        }
                    ],
                    name: 'ZodError'
                },
                type: 'Body'
            }
        ]);
    }));
});
const initDb = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const env = yield environmentService.createEnvironment(0, 'testEnv');
    if (!env)
        throw new Error('Environment not created');
    const logCtx = yield logContextGetter.create({ operation: { type: 'sync', action: 'run' }, message: 'Sync' }, { account: { id: env.account_id, name: '' }, environment: { id: env.id, name: env.name } });
    const connectionRes = yield connectionService.upsertConnection(`conn-test`, `provider-test`, 'google', {}, {}, env.id, 0);
    const connectionId = (_a = connectionRes[0]) === null || _a === void 0 ? void 0 : _a.connection.id;
    if (!connectionId)
        throw new Error('Connection not created');
    const connection = (yield connectionService.getConnectionById(connectionId));
    if (!connection)
        throw new Error('Connection not found');
    const sync = yield createSync(connectionId, 'sync-test');
    if (!(sync === null || sync === void 0 ? void 0 : sync.id))
        throw new Error('Sync not created');
    const syncJob = (yield createSyncJob(sync.id, SyncType.INITIAL, SyncStatus.RUNNING, `job-test`, connection));
    if (!syncJob)
        throw new Error('Sync job not created');
    return {
        account: (yield accountService.getAccountById(0)),
        env,
        activityLogId: logCtx.id,
        connection,
        sync,
        syncJob
    };
});
const clearDb = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db.knex.raw(`DROP SCHEMA nango CASCADE`);
});
//# sourceMappingURL=server.integration.test.js.map