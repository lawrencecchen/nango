var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import * as jobService from '../services/sync/job.service.js';
import { SyncType, SyncStatus } from '../models/Sync.js';
export const createSyncJobSeeds = (syncId) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield jobService.createSyncJob(syncId, SyncType.INITIAL, SyncStatus.RUNNING, '', null));
});
export const deleteAllSyncJobSeeds = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db.knex.raw('TRUNCATE TABLE _nango_sync_jobs CASCADE');
});
//# sourceMappingURL=sync-job.seeder.js.map