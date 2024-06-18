var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SCHEDULES_TABLE } from '@nangohq/models/schedules.js';
import { TASKS_TABLE } from '@nangohq/models/tasks.js';
export const config = {
    transaction: false
};
export function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`
            ALTER TABLE ${SCHEDULES_TABLE}
            ADD COLUMN IF NOT EXISTS schedule_id uuid,
            ADD COLUMN IF NOT EXISTS group_key varchar(255) NOT NULL,
            ADD COLUMN IF NOT EXISTS retry_max integer NOT NULL default(0),
            ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL default(0),
            ADD COLUMN IF NOT EXISTS created_to_started_timeout_secs integer NOT NULL,
            ADD COLUMN IF NOT EXISTS started_to_completed_timeout_secs integer NOT NULL,
            ADD COLUMN IF NOT EXISTS heartbeat_timeout_secs integer NOT NULL;
        `);
        // Tasks indexes
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_schedule_id" ON ${TASKS_TABLE} USING BTREE (schedule_id);`);
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_starts_after" ON ${TASKS_TABLE} USING BTREE (starts_after);`);
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_state" ON ${TASKS_TABLE} USING BTREE (state);`);
        // Schedules indexes
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_schedules_state_started" ON ${SCHEDULES_TABLE} USING BTREE (state) WHERE state = 'STARTED';`);
    });
}
export function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`DROP INDEX IF EXISTS "idx_tasks_schedule_id";`);
        yield knex.raw(`DROP INDEX IF EXISTS "idx_tasks_starts_after";`);
        yield knex.raw(`DROP INDEX IF EXISTS "idx_tasks_state";`);
        yield knex.raw(`DROP INDEX IF EXISTS "idx_schedules_state_started";`);
        yield knex.raw(`
            ALTER TABLE ${SCHEDULES_TABLE}
            DROP COLUMN IF EXISTS schedule_id,
            DROP COLUMN IF EXISTS group_key,
            DROP COLUMN IF EXISTS retry_max,
            DROP COLUMN IF EXISTS retry_count,
            DROP COLUMN IF EXISTS created_to_started_timeout_secs,
            DROP COLUMN IF EXISTS started_to_completed_timeout_secs,
            DROP COLUMN IF EXISTS heartbeat_timeout_secs;
        `);
    });
}
//# sourceMappingURL=20240605205506_schedules_index.js.map