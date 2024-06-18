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
import * as syncService from '../services/sync/sync.service.js';
export const createSyncSeeds = (connectionId = 1) => __awaiter(void 0, void 0, void 0, function* () {
    const syncName = Math.random().toString(36).substring(7);
    return (yield syncService.createSync(connectionId, syncName));
});
export const deleteAllSyncSeeds = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db.knex.raw('TRUNCATE TABLE _nango_syncs CASCADE');
});
//# sourceMappingURL=sync.seeder.js.map