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
import { logger } from '../utils/logger.js';
import { db } from './client.js';
import { schema, config } from './config.js';
import { dirname } from '../env.js';
export function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info('[records] migration');
        const dir = path.join(dirname, 'records/dist/db/migrations');
        yield db.raw(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
        const [, pendingMigrations] = (yield db.migrate.list(Object.assign(Object.assign({}, config.migrations), { directory: dir })));
        if (pendingMigrations.length === 0) {
            logger.info('[records] nothing to do');
            return;
        }
        yield db.migrate.latest(Object.assign(Object.assign({}, config.migrations), { directory: dir }));
        logger.info('[records] migrations completed.');
    });
}
//# sourceMappingURL=migrate.js.map