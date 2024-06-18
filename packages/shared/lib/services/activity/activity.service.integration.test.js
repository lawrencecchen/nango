var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll } from 'vitest';
import db, { multipleMigrations } from '@nangohq/database';
import * as ActivityService from './activity.service.js';
describe('Activity service integration tests', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
    }));
    it('Should not create an activity without an environment id', () => __awaiter(void 0, void 0, void 0, function* () {
        const log = {};
        const logId = yield ActivityService.createActivityLog(log);
        expect(logId).toBeNull();
    }));
    it('Should create an activity log and retrieve its ID', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_environments');
        const log = {
            environment_id: result[0].id
        };
        const logId = yield ActivityService.createActivityLog(log);
        expect(logId).not.toBeNull();
    }));
    it('Should update provider for a given activity log ID', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_environments');
        const log = {
            environment_id: result[0].id
        };
        const createdLog = yield ActivityService.createActivityLog(log);
        const provider = 'newProvider';
        yield ActivityService.updateProvider(createdLog, provider);
        const updatedLog = yield db.knex
            .from('_nango_activity_logs')
            .where({ id: createdLog })
            .first();
        expect(updatedLog.provider).toEqual(provider);
    }));
});
//# sourceMappingURL=activity.service.integration.test.js.map