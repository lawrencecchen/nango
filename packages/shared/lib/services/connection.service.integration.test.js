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
import connectionService from './connection.service.js';
import { createConfigSeeds } from '../seeders/config.seeder.js';
import { createConnectionSeeds } from '../seeders/connection.seeder.js';
import { createEnvironmentSeed } from '../seeders/environment.seeder.js';
describe('Connection service integration tests', () => __awaiter(void 0, void 0, void 0, function* () {
    let env;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        env = yield createEnvironmentSeed();
        yield createConfigSeeds(env);
    }));
    describe('Metadata simple operations', () => __awaiter(void 0, void 0, void 0, function* () {
        it('Should replace existing metadata, overwriting anything existing', () => __awaiter(void 0, void 0, void 0, function* () {
            const connections = yield createConnectionSeeds(env);
            const initialMetadata = {
                name: 'test',
                host: 'test'
            };
            const newMetadata = {
                additionalName: 'test23'
            };
            const [connectionId] = connections;
            const connection = { id: connectionId };
            yield db.knex.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
                yield connectionService.replaceMetadata([connection.id], initialMetadata, trx);
                yield connectionService.replaceMetadata([connection.id], newMetadata, trx);
            }));
            const dbConnection = yield connectionService.getConnectionById(connectionId);
            const updatedMetadata = dbConnection === null || dbConnection === void 0 ? void 0 : dbConnection.metadata;
            expect(updatedMetadata).toEqual(newMetadata);
        }));
        it('Should update metadata and not overwrite', () => __awaiter(void 0, void 0, void 0, function* () {
            const connections = yield createConnectionSeeds(env);
            const initialMetadata = {
                name: 'test',
                host: 'test'
            };
            const newMetadata = {
                additionalName: 'test23'
            };
            const connectionId = connections[1];
            const dbConnection = (yield connectionService.getConnectionById(connectionId));
            yield db.knex.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
                yield connectionService.replaceMetadata([dbConnection.id], initialMetadata, trx);
            }));
            const updatedMetadataConnection = (yield connectionService.getConnectionById(connectionId));
            yield connectionService.updateMetadata([updatedMetadataConnection], newMetadata);
            const updatedDbConnection = yield connectionService.getConnectionById(connectionId);
            const updatedMetadata = updatedDbConnection === null || updatedDbConnection === void 0 ? void 0 : updatedDbConnection.metadata;
            expect(updatedMetadata).toEqual(Object.assign(Object.assign({}, initialMetadata), newMetadata));
        }));
    }));
}));
//# sourceMappingURL=connection.service.integration.test.js.map