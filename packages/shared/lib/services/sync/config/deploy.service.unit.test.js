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
import { logContextGetter } from '@nangohq/logs';
import { SyncConfigType } from '../@nangohq/models/Sync.js';
import environmentService from '../../environment.service.js';
import * as SyncConfigService from './config.service.js';
import * as SyncService from '../sync.service.js';
import * as DeployConfigService from './deploy.service.js';
import connectionService from '../../connection.service.js';
import configService from '../../config.service.js';
import { mockAddEndTime, mockCreateActivityLog, mockUpdateSuccess } from '../../activity/mocks.js';
import { mockErrorManagerReport } from '../../../utils/error.manager.mocks.js';
import { Orchestrator } from '../../../clients/orchestrator.js';
const orchestratorClientNoop = {
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
const mockOrchestrator = new Orchestrator(orchestratorClientNoop);
describe('Sync config create', () => {
    const environment = { id: 1, name: '' };
    const account = { id: 1, name: '' };
    const debug = true;
    it('Create sync configs correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const syncs = [];
        const debug = true;
        vi.spyOn(environmentService, 'getAccountFromEnvironment').mockImplementation(() => {
            return Promise.resolve({ id: 1, name: '' });
        });
        mockCreateActivityLog();
        mockUpdateSuccess();
        mockAddEndTime();
        // empty sync config should return back an empty array
        const emptyConfig = yield DeployConfigService.deploy({
            account,
            environment,
            flows: syncs,
            nangoYamlBody: '',
            logContextGetter,
            orchestrator: mockOrchestrator,
            debug,
            postConnectionScriptsByProvider: []
        });
        expect(emptyConfig).not.toBe([]);
    }));
    it('Throws a provider not found error', () => __awaiter(void 0, void 0, void 0, function* () {
        const syncs = [
            {
                syncName: 'test-sync',
                type: SyncConfigType.SYNC,
                providerConfigKey: 'google-wrong',
                fileBody: {
                    js: 'integrations.js',
                    ts: 'integrations.ts'
                },
                models: ['Model_1', 'Model_2'],
                runs: 'every 6h',
                version: '1',
                model_schema: '[{ "name": "model", "fields": [{ "name": "some", "type": "value" }] }]'
            }
        ];
        vi.spyOn(configService, 'getProviderConfig').mockImplementation(() => {
            return Promise.resolve(null);
        });
        const { error } = yield DeployConfigService.deploy({
            account,
            environment,
            flows: syncs,
            nangoYamlBody: '',
            logContextGetter,
            orchestrator: mockOrchestrator,
            debug,
            postConnectionScriptsByProvider: []
        });
        expect(error === null || error === void 0 ? void 0 : error.message).toBe(`There is no Provider Configuration matching this key. Please make sure this value exists in the Nango dashboard {
  "providerConfigKey": "google-wrong"
}`);
    }));
    it('Throws an error at the end of the create sync process', () => __awaiter(void 0, void 0, void 0, function* () {
        const syncs = [
            {
                syncName: 'test-sync',
                type: SyncConfigType.SYNC,
                providerConfigKey: 'google',
                fileBody: {
                    js: 'integrations.js',
                    ts: 'integrations.ts'
                },
                models: ['Model_1', 'Model_2'],
                runs: 'every 6h',
                version: '1',
                model_schema: '[{ "name": "model", "fields": [{ "name": "some", "type": "value" }] }]'
            }
        ];
        mockErrorManagerReport();
        vi.spyOn(configService, 'getProviderConfig').mockImplementation(() => {
            return Promise.resolve({
                id: 1,
                unique_key: 'google',
                provider: 'google',
                oauth_client_id: '123',
                oauth_client_secret: '123',
                post_connection_scripts: null,
                environment_id: 1
            });
        });
        vi.spyOn(SyncConfigService, 'getSyncAndActionConfigsBySyncNameAndConfigId').mockImplementation(() => {
            return Promise.resolve([
                {
                    id: 1,
                    environment_id: 1,
                    sync_name: 'test-sync',
                    type: SyncConfigType.SYNC,
                    file_location: '/tmp/test-sync',
                    nango_config_id: 1,
                    models: ['Model_1', 'Model_2'],
                    model_schema: [{ name: 'model', fields: [{ name: 'some', type: 'value' }] }],
                    active: true,
                    runs: 'every 6h',
                    auto_start: true,
                    track_deletes: false,
                    version: '1',
                    enabled: true,
                    webhook_subscriptions: null
                }
            ]);
        });
        vi.spyOn(SyncConfigService, 'getSyncConfigByParams').mockImplementation(() => {
            return Promise.resolve({
                id: 1,
                environment_id: 1,
                sync_name: 'test-sync',
                type: SyncConfigType.SYNC,
                file_location: '/tmp/test-sync',
                nango_config_id: 1,
                models: ['Model_1', 'Model_2'],
                model_schema: [{ name: 'model', fields: [{ name: 'some', type: 'value' }] }],
                active: true,
                runs: 'every 6h',
                auto_start: true,
                track_deletes: false,
                version: '1',
                enabled: true,
                webhook_subscriptions: null
            });
        });
        vi.spyOn(SyncConfigService, 'getSyncAndActionConfigByParams').mockImplementation(() => {
            return Promise.resolve({
                id: 1,
                environment_id: 1,
                sync_name: 'test-sync',
                type: SyncConfigType.SYNC,
                file_location: '/tmp/test-sync',
                nango_config_id: 1,
                models: ['Model_1', 'Model_2'],
                model_schema: [{ name: 'model', fields: [{ name: 'some', type: 'value' }] }],
                active: true,
                runs: 'every 6h',
                auto_start: true,
                track_deletes: false,
                version: '1',
                enabled: true,
                webhook_subscriptions: null
            });
        });
        vi.spyOn(connectionService, 'shouldCapUsage').mockImplementation(() => {
            return Promise.resolve(false);
        });
        vi.spyOn(SyncService, 'getSyncsByProviderConfigAndSyncName').mockImplementation(() => {
            return Promise.resolve([]);
        });
        yield expect(DeployConfigService.deploy({
            environment,
            account,
            flows: syncs,
            nangoYamlBody: '',
            logContextGetter,
            orchestrator: mockOrchestrator,
            debug,
            postConnectionScriptsByProvider: []
        })).rejects.toThrowError('Error creating sync config from a deploy. Please contact support with the sync name and connection details');
    }));
});
//# sourceMappingURL=deploy.service.unit.test.js.map