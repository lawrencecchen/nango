var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import db, { multipleMigrations } from '@nangohq/database';
import { SyncStatus, SyncType } from '@nangohq/models/Sync.js';
import { LogContext, logContextGetter } from '@nangohq/logs';
import { records as recordsService, format as recordsFormatter, migrate as migrateRecords, clearDbTestsOnly as clearRecordsDb } from '@nangohq/records';
import * as jobService from './job.service.js';
import SyncRun from './run.service.js';
import { createEnvironmentSeed } from '../../seeders/environment.seeder.js';
import { createConnectionSeeds } from '../../seeders/connection.seeder.js';
import { createSyncSeeds } from '../../seeders/sync.seeder.js';
import { createSyncJobSeeds } from '../../seeders/sync-job.seeder.js';
import connectionService from '../connection.service.js';
import { createActivityLog } from '../activity/activity.service.js';
import { SlackService } from '../notification/slack.service.js';
class integrationServiceMock {
    runScript() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                success: true
            };
        });
    }
    cancelScript() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
}
const orchestratorClient = {
    recurring: () => Promise.resolve({}),
    executeAction: () => Promise.resolve({}),
    executeWebhook: () => Promise.resolve({}),
    executePostConnection: () => Promise.resolve({}),
    executeSync: () => Promise.resolve({}),
    cancel: () => Promise.resolve({}),
    pauseSync: () => Promise.resolve({}),
    unpauseSync: () => Promise.resolve({}),
    deleteSync: () => Promise.resolve({}),
    updateSyncFrequency: () => Promise.resolve({}),
    searchSchedules: () => Promise.resolve({})
};
const slackService = new SlackService({ orchestratorClient, logContextGetter });
const integrationService = new integrationServiceMock();
const sendSyncWebhookMock = (_params) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve();
});
describe('Running sync', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield initDb();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield clearDb();
        yield clearRecordsDb();
    }));
    describe(`with track_deletes=false`, () => {
        const trackDeletes = false;
        it(`should report no records have changed`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRecords = [
                { id: '1', name: 'a' },
                { id: '2', name: 'b' }
            ];
            const expectedResult = { added: 0, updated: 0, deleted: 0 };
            const { records } = yield verifySyncRun(rawRecords, rawRecords, trackDeletes, expectedResult);
            records.forEach((record) => {
                expect(record._nango_metadata.first_seen_at).toEqual(record._nango_metadata.last_modified_at);
                expect(record._nango_metadata.deleted_at).toBeNull();
                expect(record._nango_metadata.last_action).toEqual('ADDED');
            });
        }));
        it(`should report one record has been added and one modified`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRecords = [
                { id: '1', name: 'a' },
                { id: '2', name: 'b' }
            ];
            const newRecords = [
                { id: '1', name: 'A' },
                { id: '3', name: 'c' }
            ];
            const expectedResult = { added: 1, updated: 1, deleted: 0 };
            const { records } = yield verifySyncRun(rawRecords, newRecords, trackDeletes, expectedResult);
            const record1 = records.find((record) => record.id == '1');
            if (!record1)
                throw new Error('record1 is not defined');
            expect(record1['name']).toEqual('A');
            expect(record1._nango_metadata.first_seen_at < record1._nango_metadata.last_modified_at).toBeTruthy();
            expect(record1._nango_metadata.deleted_at).toBeNull();
            expect(record1._nango_metadata.last_action).toEqual('UPDATED');
            const record2 = records.find((record) => record.id == '2');
            if (!record2)
                throw new Error('record2 is not defined');
            expect(record2._nango_metadata.first_seen_at).toEqual(record2._nango_metadata.last_modified_at);
            expect(record2._nango_metadata.last_action).toEqual('ADDED'); // record was added as part of the initial save
            const record3 = records.find((record) => record.id == '3');
            if (!record3)
                throw new Error('record3 is not defined');
            expect(record3._nango_metadata.first_seen_at).toEqual(record3._nango_metadata.last_modified_at);
            expect(record3._nango_metadata.last_action).toEqual('ADDED');
        }));
    });
    describe(`with track_deletes=true`, () => {
        const trackDeletes = true;
        it(`should report no records have changed`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRecords = [
                { id: '1', name: 'a' },
                { id: '2', name: 'b' }
            ];
            const expectedResult = { added: 0, updated: 0, deleted: 0 };
            const { records } = yield verifySyncRun(rawRecords, rawRecords, trackDeletes, expectedResult);
            expect(records).lengthOf(2);
            records.forEach((record) => {
                expect(record._nango_metadata.first_seen_at).toEqual(record._nango_metadata.last_modified_at);
                expect(record._nango_metadata.deleted_at).toBeNull();
                expect(record._nango_metadata.last_action).toEqual('ADDED');
            });
        }));
        it(`should report one record has been added, one updated and one deleted`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRecords = [
                { id: '1', name: 'a' },
                { id: '2', name: 'b' }
            ];
            const newRecords = [
                { id: '1', name: 'A' },
                { id: '3', name: 'c' }
            ];
            const expectedResult = { added: 1, updated: 1, deleted: 1 };
            const { records } = yield verifySyncRun(rawRecords, newRecords, trackDeletes, expectedResult);
            const record1 = records.find((record) => record.id == '1');
            if (!record1)
                throw new Error('record1 is not defined');
            expect(record1['name']).toEqual('A');
            expect(record1._nango_metadata.first_seen_at < record1._nango_metadata.last_modified_at).toBeTruthy();
            expect(record1._nango_metadata.deleted_at).toBeNull();
            expect(record1._nango_metadata.last_action).toEqual('UPDATED');
            const record2 = records.find((record) => record.id == '2');
            if (!record2)
                throw new Error('record2 is not defined');
            expect(record2._nango_metadata.first_seen_at < record2._nango_metadata.last_modified_at).toBeTruthy();
            expect(record2._nango_metadata.deleted_at).not.toBeNull();
            expect(record2._nango_metadata.last_action).toEqual('DELETED');
            const record3 = records.find((record) => record.id == '3');
            if (!record3)
                throw new Error('record3 is not defined');
            expect(record3._nango_metadata.first_seen_at).toEqual(record3._nango_metadata.last_modified_at);
            expect(record3._nango_metadata.last_action).toEqual('ADDED');
        }));
        it(`should undelete record`, () => __awaiter(void 0, void 0, void 0, function* () {
            const initialRecords = [
                { id: '1', name: 'a' },
                { id: '2', name: 'b' }
            ];
            const expectedResult = { added: 0, updated: 0, deleted: 0 };
            const { connection, sync, model, activityLogId } = yield verifySyncRun(initialRecords, initialRecords, false, expectedResult);
            // records '2' is going to be deleted
            const newRecords = [{ id: '1', name: 'a' }];
            yield runJob(newRecords, activityLogId, model, connection, sync, trackDeletes, false);
            const records = yield getRecords(connection, model);
            const record = records.find((record) => record.id == '2');
            if (!record)
                throw new Error('record is not defined');
            expect(record._nango_metadata.first_seen_at < record._nango_metadata.last_modified_at).toBeTruthy();
            expect(record._nango_metadata.deleted_at).not.toBeNull();
            expect(record._nango_metadata.last_action).toEqual('DELETED');
            // records '2' should be back
            const result = yield runJob(initialRecords, activityLogId, model, connection, sync, trackDeletes, false);
            expect(result).toEqual({ added: 1, updated: 0, deleted: 0 });
            const recordsAfter = yield getRecords(connection, model);
            const recordAfter = recordsAfter.find((record) => record.id == '2');
            if (!recordAfter)
                throw new Error('record is not defined');
            expect(recordAfter._nango_metadata.first_seen_at).toEqual(recordAfter._nango_metadata.last_modified_at);
            expect(recordAfter._nango_metadata.deleted_at).toBeNull();
            expect(recordAfter._nango_metadata.last_action).toEqual('ADDED');
        }));
    });
    describe(`with softDelete=true`, () => {
        const softDelete = true;
        it(`should report records have been deleted`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRecords = [
                { id: '1', name: 'a' },
                { id: '2', name: 'b' }
            ];
            const expectedResult = { added: 0, updated: 0, deleted: 2 };
            const { records } = yield verifySyncRun(rawRecords, rawRecords, false, expectedResult, softDelete);
            expect(records).lengthOf(2);
            records.forEach((record) => {
                expect(record._nango_metadata.deleted_at).toEqual(record._nango_metadata.last_modified_at);
                expect(record._nango_metadata.deleted_at).not.toBeNull();
                expect(record._nango_metadata.last_action).toEqual('DELETED');
            });
        }));
    });
});
describe('SyncRun', () => {
    it('should initialize correctly', () => {
        const config = {
            integrationService: integrationService,
            recordsService,
            slackService,
            writeToDb: true,
            nangoConnection: {
                id: 1,
                connection_id: '1234',
                provider_config_key: 'test_key',
                environment_id: 1
            },
            syncName: 'test_sync',
            sendSyncWebhook: sendSyncWebhookMock,
            syncType: SyncType.INCREMENTAL,
            syncId: 'some-sync',
            syncJobId: 123,
            activityLogId: 123,
            logCtx: new LogContext({ parentId: String(123), operation: {} }),
            loadLocation: '/tmp',
            debug: true
        };
        const syncRun = new SyncRun(config);
        expect(syncRun).toBeTruthy();
        expect(syncRun.writeToDb).toEqual(true);
        expect(syncRun.nangoConnection.connection_id).toEqual('1234');
        expect(syncRun.syncName).toEqual('test_sync');
        expect(syncRun.syncType).toEqual(SyncType.INCREMENTAL);
        expect(syncRun.syncId).toEqual('some-sync');
        expect(syncRun.syncJobId).toEqual(123);
        expect(syncRun.activityLogId).toEqual(123);
        expect(syncRun.loadLocation).toEqual('/tmp');
        expect(syncRun.debug).toEqual(true);
    });
});
const initDb = () => __awaiter(void 0, void 0, void 0, function* () {
    yield multipleMigrations();
    yield migrateRecords();
});
const clearDb = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db.knex.raw(`DROP SCHEMA nango CASCADE`);
    // TODO: clear records???
});
const runJob = (rawRecords, activityLogId, model, connection, sync, trackDeletes, softDelete) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    // create new sync job
    const syncJob = (yield jobService.createSyncJob(sync.id, SyncType.INCREMENTAL, SyncStatus.RUNNING, 'test-job-id', connection));
    if (!syncJob) {
        throw new Error('Fail to create sync job');
    }
    const config = {
        integrationService: integrationService,
        recordsService,
        slackService,
        writeToDb: true,
        nangoConnection: connection,
        syncName: sync.name,
        sendSyncWebhook: sendSyncWebhookMock,
        syncType: SyncType.INITIAL,
        syncId: sync.id,
        syncJobId: syncJob.id,
        activityLogId,
        logCtx: new LogContext({ parentId: String(activityLogId), operation: {} })
    };
    const syncRun = new SyncRun(config);
    // format and upsert records
    const formatting = recordsFormatter.formatRecords({
        data: rawRecords,
        connectionId: connection.id,
        model,
        syncId: sync.id,
        syncJobId: syncJob.id,
        softDelete
    });
    if (formatting.isErr()) {
        throw new Error(`failed to format records`);
    }
    const upserting = yield recordsService.upsert({ records: formatting.value, connectionId: connection.id, model, softDelete });
    if (upserting.isErr()) {
        throw new Error(`failed to upsert records: ${upserting.error.message}`);
    }
    const summary = upserting.value;
    const updatedResults = {
        [model]: {
            added: summary.addedKeys.length,
            updated: summary.updatedKeys.length,
            deleted: ((_a = summary.deletedKeys) === null || _a === void 0 ? void 0 : _a.length) || 0
        }
    };
    yield jobService.updateSyncJobResult(syncJob.id, updatedResults, model);
    // finish the sync
    yield syncRun.finishFlow([model], new Date(), `v1`, 10, trackDeletes);
    const syncJobResult = yield jobService.getLatestSyncJob(sync.id);
    return {
        added: ((_c = (_b = syncJobResult === null || syncJobResult === void 0 ? void 0 : syncJobResult.result) === null || _b === void 0 ? void 0 : _b[model]) === null || _c === void 0 ? void 0 : _c.added) || 0,
        updated: ((_e = (_d = syncJobResult === null || syncJobResult === void 0 ? void 0 : syncJobResult.result) === null || _d === void 0 ? void 0 : _d[model]) === null || _e === void 0 ? void 0 : _e.updated) || 0,
        deleted: ((_g = (_f = syncJobResult === null || syncJobResult === void 0 ? void 0 : syncJobResult.result) === null || _f === void 0 ? void 0 : _f[model]) === null || _g === void 0 ? void 0 : _g.deleted) || 0
    };
});
const verifySyncRun = (initialRecords, newRecords, trackDeletes, expectedResult, softDelete = false) => __awaiter(void 0, void 0, void 0, function* () {
    // Write initial records
    const { connection, model, sync, activityLogId } = yield populateRecords(initialRecords);
    // Run job to save new records
    const result = yield runJob(newRecords, activityLogId, model, connection, sync, trackDeletes, softDelete);
    expect(result).toEqual(expectedResult);
    const records = yield getRecords(connection, model);
    return { connection, model, sync, activityLogId, records };
});
const getRecords = (connection, model) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield recordsService.getRecords({ connectionId: connection.id, model });
    if (res.isOk()) {
        return res.value.records;
    }
    throw new Error('cannot fetch records');
});
function populateRecords(toInsert) {
    return __awaiter(this, void 0, void 0, function* () {
        const { records, meta: { env, model, connectionId, sync, syncJob } } = yield mockRecords(toInsert);
        const connection = yield connectionService.getConnectionById(connectionId);
        if (!connection) {
            throw new Error(`Connection '${connectionId}' not found`);
        }
        const activityLogId = yield createActivityLog({
            level: 'info',
            success: false,
            environment_id: env.id,
            action: 'sync',
            start: Date.now(),
            end: Date.now(),
            timestamp: Date.now(),
            connection_id: connection.connection_id,
            provider: connection.provider_config_key,
            provider_config_key: connection.provider_config_key
        });
        if (!activityLogId) {
            throw new Error('Failed to create activity log');
        }
        const chunkSize = 1000;
        for (let i = 0; i < records.length; i += chunkSize) {
            const res = yield recordsService.upsert({ records: records.slice(i, i + chunkSize), connectionId, model });
            if (res.isErr()) {
                throw new Error(`Failed to upsert records: ${res.error.message}`);
            }
        }
        return {
            connection: connection,
            model,
            sync,
            syncJob,
            activityLogId
        };
    });
}
function mockRecords(records) {
    return __awaiter(this, void 0, void 0, function* () {
        const envName = Math.random().toString(36).substring(7);
        const env = yield createEnvironmentSeed(0, envName);
        const connections = yield createConnectionSeeds(env);
        const [connectionId] = connections;
        if (!connectionId) {
            throw new Error('Failed to create connection');
        }
        const sync = yield createSyncSeeds(connectionId);
        if (!sync.id) {
            throw new Error('Failed to create sync');
        }
        const job = yield createSyncJobSeeds(sync.id);
        if (!job.id) {
            throw new Error('Failed to create job');
        }
        const model = Math.random().toString(36).substring(7);
        const formattedRecords = recordsFormatter.formatRecords({ data: records, connectionId, model, syncId: sync.id, syncJobId: job.id });
        if (formattedRecords.isErr()) {
            throw new Error(`Failed to format records: ${formattedRecords.error.message}`);
        }
        return {
            meta: {
                env,
                connectionId,
                model,
                sync,
                syncJob: job
            },
            records: formattedRecords.value
        };
    });
}
//# sourceMappingURL=run.service.integration.test.js.map