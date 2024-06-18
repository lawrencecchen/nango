var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, vi } from 'vitest';
import { SyncType } from '@nangohq/models/Sync.js';
import SyncRun from './run.service.js';
import environmentService from '../environment.service.js';
import LocalFileService from '../file/local.service.js';
import * as configService from './config/config.service.js';
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
const integrationService = new integrationServiceMock();
const recordsService = {
    markNonCurrentGenerationRecordsAsDeleted: ({ connectionId: _connectionId, model: _model, syncId: _syncId, generation: _generation }) => {
        return Promise.resolve([]);
    }
};
describe('SyncRun', () => {
    const dryRunConfig = {
        integrationService: integrationService,
        recordsService,
        writeToDb: false,
        nangoConnection: {
            id: 1,
            connection_id: '1234',
            provider_config_key: 'test_key',
            environment_id: 1
        },
        syncName: 'test_sync',
        syncType: SyncType.INCREMENTAL,
        syncId: 'some-sync',
        syncJobId: 123,
        debug: true
    };
    it('should initialize correctly', () => {
        const config = {
            integrationService: integrationService,
            recordsService,
            writeToDb: false,
            nangoConnection: {
                id: 1,
                connection_id: '1234',
                provider_config_key: 'test_key',
                environment_id: 1
            },
            syncName: 'test_sync',
            syncType: SyncType.INCREMENTAL,
            syncId: 'some-sync',
            syncJobId: 123,
            loadLocation: '/tmp',
            debug: true
        };
        const syncRun = new SyncRun(config);
        expect(syncRun).toBeTruthy();
        expect(syncRun.writeToDb).toEqual(false);
        expect(syncRun.nangoConnection.connection_id).toEqual('1234');
        expect(syncRun.syncName).toEqual('test_sync');
        expect(syncRun.syncType).toEqual(SyncType.INCREMENTAL);
        expect(syncRun.syncId).toEqual('some-sync');
        expect(syncRun.syncJobId).toEqual(123);
        expect(syncRun.activityLogId).toBeUndefined();
        expect(syncRun.loadLocation).toEqual('/tmp');
        expect(syncRun.debug).toEqual(true);
    });
    it('should mock the run method in dry run mode with different fail and success conditions', () => __awaiter(void 0, void 0, void 0, function* () {
        const syncRun = new SyncRun(dryRunConfig);
        vi.spyOn(environmentService, 'getAccountAndEnvironment').mockImplementation(() => {
            return Promise.resolve({
                account: {
                    id: 1,
                    name: 'test',
                    uuid: '1234'
                },
                environment: {
                    id: 1,
                    name: 'test',
                    secret_key: 'secret'
                }
            });
        });
        vi.spyOn(configService, 'getSyncConfig').mockImplementation(() => {
            return Promise.resolve({
                integrations: {
                    test_key: {
                        test_sync: {
                            runs: 'every 6h',
                            returns: ['Foo']
                        }
                    }
                },
                models: {
                    Foo: {
                        name: 'Foo'
                    }
                }
            });
        });
        vi.spyOn(LocalFileService, 'checkForIntegrationDistFile').mockImplementation(() => {
            return {
                result: true,
                path: '/tmp'
            };
        });
        vi.spyOn(integrationService, 'runScript').mockImplementation(() => {
            return Promise.resolve({
                success: true,
                response: { success: true }
            });
        });
        const run = yield syncRun.run();
        expect(run).toEqual({ success: true });
        // if integration file not found it should return false
        vi.spyOn(LocalFileService, 'checkForIntegrationDistFile').mockImplementation(() => {
            return {
                result: false,
                path: '/tmp'
            };
        });
        const failRun = yield syncRun.run();
        expect(failRun.response).toEqual(false);
        // @ts-expect-error - if run script returns null then fail
        vi.spyOn(integrationService, 'runScript').mockImplementation(() => {
            return Promise.resolve(null);
        });
        const { response } = yield syncRun.run();
        expect(response).toEqual(false);
    }));
});
//# sourceMappingURL=run.service.unit.test.js.map