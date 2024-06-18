var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { describe, it, beforeAll, expect, vi } from 'vitest';
import db, { multipleMigrations } from '@nangohq/database';
import { seeders, configService, connectionService, createSync, getSchedule, createSchedule, ScheduleStatus, SyncClient, DEMO_GITHUB_CONFIG_KEY, DEMO_SYNC_NAME, SyncConfigType } from '@nangohq/shared';
import { nanoid, Ok } from '@nangohq/utils';
import { exec } from './autoIdleDemo.js';
describe('Auto Idle Demo', () => __awaiter(void 0, void 0, void 0, function* () {
    let env;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        env = yield seeders.createEnvironmentSeed(0, 'dev');
        yield seeders.createConfigSeeds(env);
    }));
    it('should delete syncs', () => __awaiter(void 0, void 0, void 0, function* () {
        const syncClient = (yield SyncClient.getInstance());
        vi.spyOn(syncClient, 'runSyncCommand').mockImplementation(() => {
            return Promise.resolve(Ok(true));
        });
        const connName = nanoid();
        const config = yield configService.createProviderConfig({
            unique_key: DEMO_GITHUB_CONFIG_KEY,
            provider: 'github',
            environment_id: env.id,
            oauth_client_id: '',
            oauth_client_secret: ''
        });
        yield db.knex
            .from('_nango_sync_configs')
            .insert({
            created_at: new Date(),
            sync_name: DEMO_SYNC_NAME,
            nango_config_id: config[0].id,
            file_location: '_LOCAL_FILE_',
            version: '1',
            models: ['GithubIssueDemo'],
            active: true,
            runs: 'every 5 minutes',
            input: '',
            model_schema: [],
            environment_id: env.id,
            deleted: false,
            track_deletes: false,
            type: SyncConfigType.SYNC,
            auto_start: false,
            attributes: {},
            metadata: {},
            pre_built: true,
            is_public: false,
            enabled: true
        })
            .returning('id');
        const conn = yield connectionService.upsertConnection(connName, DEMO_GITHUB_CONFIG_KEY, 'github', {}, {}, env.id, 0);
        const connId = conn[0].connection.id;
        const sync = (yield createSync(connId, DEMO_SYNC_NAME));
        yield createSchedule(sync.id, '86400', 0, ScheduleStatus.RUNNING, nanoid());
        const schedBefore = yield getSchedule(sync.id);
        expect(schedBefore === null || schedBefore === void 0 ? void 0 : schedBefore.status).toBe(ScheduleStatus.RUNNING);
        // First execution nothings happen
        yield exec();
        const schedMid = yield getSchedule(sync.id);
        expect(schedMid === null || schedMid === void 0 ? void 0 : schedMid.status).toBe(ScheduleStatus.RUNNING);
        // Second execution it should pick the old sync
        yield db.knex.from('_nango_syncs').update({ updated_at: new Date(Date.now() - 86400 * 2 * 1000) });
        yield exec();
        const schedAfter = yield getSchedule(sync.id);
        expect(schedAfter === null || schedAfter === void 0 ? void 0 : schedAfter.status).toBe(ScheduleStatus.PAUSED);
    }));
}));
//# sourceMappingURL=autoIdleDemo.integration.test.js.map