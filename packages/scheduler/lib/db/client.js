var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'node:path';
import knex from 'knex';
import { fileURLToPath } from 'node:url';
import { isTest } from '@nangohq/utils';
import { logger } from '../utils/logger.js';
const runningMigrationOnly = process.argv.some((v) => v === 'migrate:latest');
const isJS = !runningMigrationOnly;
export class DatabaseClient {
    constructor({ url, schema, poolMax = 50 }) {
        this.url = url;
        this.schema = schema;
        this.config = {
            client: 'postgres',
            connection: {
                connectionString: url,
                statement_timeout: 60000
            },
            searchPath: schema,
            pool: { min: 2, max: poolMax },
            migrations: {
                extension: isJS ? 'js' : 'ts',
                directory: 'migrations',
                tableName: 'migrations',
                loadExtensions: [isJS ? '.js' : '.ts'],
                schemaName: schema
            }
        };
        this.db = knex(this.config);
    }
    migrate() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('[scheduler] migration');
            const filename = fileURLToPath(import.meta.url);
            const dirname = path.dirname(path.join(filename, '../../'));
            const dir = path.join(dirname, 'dist/db/migrations');
            yield this.db.raw(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`);
            const [, pendingMigrations] = (yield this.db.migrate.list(Object.assign(Object.assign({}, this.config.migrations), { directory: dir })));
            if (pendingMigrations.length === 0) {
                logger.info('[scheduler] nothing to do');
                return;
            }
            yield this.db.migrate.latest(Object.assign(Object.assign({}, this.config.migrations), { directory: dir }));
            logger.info('[scheduler] migrations completed.');
        });
    }
    /*********************************/
    /* WARNING: to use only in tests */
    /*********************************/
    clearDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isTest) {
                yield this.db.raw(`DROP SCHEMA IF EXISTS ${this.schema} CASCADE`);
            }
        });
    }
}
//# sourceMappingURL=client.js.map