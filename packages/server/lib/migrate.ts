import { start as migrateLogs } from '@nangohq/logs';
import { migrate as migrateRecords } from '@nangohq/records';

import migrate from './utils/migrate.js';

await migrate();
await migrateLogs();
await migrateRecords();

process.exit(0);
