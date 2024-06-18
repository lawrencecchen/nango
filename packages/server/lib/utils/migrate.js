var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getLogger } from '@nangohq/utils';
const logger = getLogger('Server');
import { encryptionManager } from '@nangohq/shared';
import { KnexDatabase } from '@nangohq/database';
export default function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = new KnexDatabase({ timeoutMs: 0 }); // Disable timeout for migrations
        logger.info('Migrating database ...');
        yield db.knex.raw(`CREATE SCHEMA IF NOT EXISTS ${db.schema()}`);
        yield db.migrate(process.env['NANGO_DB_MIGRATION_FOLDER'] || '../database/lib/migrations');
        yield encryptionManager.encryptDatabaseIfNeeded();
        logger.info('✅ Migrated database');
    });
}
//# sourceMappingURL=migrate.js.map