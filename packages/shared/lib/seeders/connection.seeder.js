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
import connectionService from '../services/connection.service.js';
export const createConnectionSeeds = (env) => __awaiter(void 0, void 0, void 0, function* () {
    const connectionIds = [];
    for (let i = 0; i < 4; i++) {
        const name = Math.random().toString(36).substring(7);
        const result = yield connectionService.upsertConnection(`conn-${name}`, `provider-${name}`, 'google', {}, {}, env.id, 0);
        connectionIds.push(...result.map((res) => res.connection.id));
    }
    return connectionIds;
});
export const createConnectionSeed = (env, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const name = Math.random().toString(36).substring(7);
    const result = yield connectionService.upsertConnection(name, provider, 'google', {}, {}, env.id, 0);
    if (!result || result[0] === undefined) {
        throw new Error('Could not create connection seed');
    }
    return { id: result[0].connection.id, connection_id: name, provider_config_key: provider, environment_id: env.id };
});
export const deleteAllConnectionSeeds = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db.knex.raw('TRUNCATE TABLE _nango_connections CASCADE');
});
//# sourceMappingURL=connection.seeder.js.map