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
import { multipleMigrations } from '@nangohq/database';
import { NangoAction } from './sync.js';
import connectionService from '../services/connection.service.js';
import environmentService from '../services/environment.service.js';
import { createConnectionSeeds } from '../seeders/connection.seeder.js';
import { createConfigSeeds } from '../seeders/config.seeder.js';
import { createEnvironmentSeed } from '../seeders/environment.seeder.js';
describe('Connection service integration tests', () => {
    let env;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        env = yield createEnvironmentSeed();
        yield createConfigSeeds(env);
    }));
    describe('Nango object tests', () => {
        it('Should retrieve connections correctly if different connection credentials are passed in', () => __awaiter(void 0, void 0, void 0, function* () {
            const connections = yield createConnectionSeeds(env);
            const [nangoConnectionId, secondNangoConnectionId] = connections;
            const establishedConnection = yield connectionService.getConnectionById(nangoConnectionId);
            if (!establishedConnection) {
                throw new Error('Connection not established');
            }
            const environment = yield environmentService.getById(establishedConnection.environment_id);
            if (!environment) {
                throw new Error('Environment not found');
            }
            const nangoProps = {
                host: 'http://localhost:3003',
                accountId: environment.account_id,
                connectionId: String(establishedConnection.connection_id),
                environmentId: environment.id,
                providerConfigKey: String(establishedConnection === null || establishedConnection === void 0 ? void 0 : establishedConnection.provider_config_key),
                provider: 'hubspot',
                activityLogId: 1,
                secretKey: '****',
                nangoConnectionId: nangoConnectionId,
                syncId: 'aaa-bbb-ccc',
                syncJobId: 2,
                lastSyncDate: new Date()
            };
            const nango = new NangoAction(nangoProps);
            // @ts-expect-error we are overriding a private method here
            nango.nango.getConnection = (providerConfigKey, connectionId) => __awaiter(void 0, void 0, void 0, function* () {
                const { response } = yield connectionService.getConnection(connectionId, providerConfigKey, environment.id);
                return response;
            });
            const connection = yield nango.getConnection();
            expect(connection).toBeDefined();
            expect(connection.connection_id).toBe(establishedConnection.connection_id);
            expect(connection.provider_config_key).toBe(establishedConnection.provider_config_key);
            const secondEstablishedConnection = yield connectionService.getConnectionById(secondNangoConnectionId);
            if (!secondEstablishedConnection) {
                throw new Error('Connection not established');
            }
            const secondConnection = yield nango.getConnection(secondEstablishedConnection.provider_config_key, String(secondEstablishedConnection.connection_id));
            expect(secondConnection).toBeDefined();
            expect(secondConnection.connection_id).toBe(secondEstablishedConnection.connection_id);
            expect(secondConnection.provider_config_key).toBe(secondEstablishedConnection.provider_config_key);
        }));
    });
});
//# sourceMappingURL=sync.integration.test.js.map