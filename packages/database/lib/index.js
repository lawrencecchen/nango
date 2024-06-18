var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import knex from 'knex';
import { metrics, retry } from '@nangohq/utils';
import { defaultSchema, getDbConfig } from './getConfig.js';
export class KnexDatabase {
    constructor({ timeoutMs } = { timeoutMs: 60000 }) {
        const dbConfig = getDbConfig({ timeoutMs });
        this.knex = knex(dbConfig);
    }
    /**
     * Not enabled by default because shared is imported by everything
     */
    enableMetrics() {
        if (process.env['CI']) {
            return;
        }
        const pool = this.knex.client.pool;
        const acquisitionMap = new Map();
        setInterval(() => {
            metrics.gauge(metrics.Types.DB_POOL_USED, pool.numUsed());
            metrics.gauge(metrics.Types.DB_POOL_FREE, pool.numFree());
            metrics.gauge(metrics.Types.DB_POOL_WAITING, pool.numPendingAcquires());
        }, 1000);
        setInterval(() => {
            // We want to avoid storing orphan too long, it's alright if we loose some metrics
            acquisitionMap.clear();
        }, 60000);
        pool.on('acquireRequest', (evtId) => {
            acquisitionMap.set(evtId, Date.now());
        });
        pool.on('acquireSuccess', (evtId) => {
            const evt = acquisitionMap.get(evtId);
            if (!evt) {
                return;
            }
            metrics.duration(metrics.Types.DB_POOL_ACQUISITION_DURATION, Date.now() - evt);
            acquisitionMap.delete(evtId);
        });
    }
    migrate(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            return retry(() => __awaiter(this, void 0, void 0, function* () {
                return yield this.knex.migrate.latest({
                    directory: directory,
                    tableName: '_nango_auth_migrations',
                    schemaName: this.schema()
                });
            }), {
                maxAttempts: 4,
                delayMs: (attempt) => 500 * attempt,
                retryIf: () => true
            });
        });
    }
    schema() {
        return defaultSchema;
    }
}
const db = new KnexDatabase();
export default db;
export { db as database };
export const schema = () => db.knex.queryBuilder();
export const dbNamespace = '_nango_';
export const multipleMigrations = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db.knex.raw(`CREATE SCHEMA IF NOT EXISTS ${db.schema()}`);
        const [_, pendingMigrations] = yield db.knex.migrate.list({
            directory: String(process.env['NANGO_DB_MIGRATION_FOLDER'])
        });
        if (pendingMigrations.length === 0) {
            console.log('No pending migrations, skipping migration step.');
        }
        else {
            console.log('Migrations pending, running migrations.');
            yield db.knex.migrate.latest({
                directory: String(process.env['NANGO_DB_MIGRATION_FOLDER'])
            });
            console.log('Migrations completed.');
        }
    }
    catch (error) {
        console.error(error.message || error);
    }
});
//# sourceMappingURL=index.js.map