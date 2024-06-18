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
export function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            yield trx.raw(`
            CREATE TYPE schedule_states AS ENUM (
                'PAUSED',
                'STARTED',
                'DELETED'
            );
        `);
            yield trx.raw(`
            CREATE TABLE IF NOT EXISTS ${SCHEDULES_TABLE} (
                id uuid PRIMARY KEY,
                name varchar(255) NOT NULL,
                state schedule_states NOT NULL,
                starts_at timestamp with time zone NOT NULL,
                frequency interval NOT NULL,
                payload json NOT NULL,
                created_at timestamp with time zone NOT NULL,
                updated_at timestamp with time zone NOT NULL,
                deleted_at timestamp with time zone NULL
            );
        `);
            // add foreign key schedule_id to tasks_table, cascade delete and nullable
            yield trx.raw(`
            ALTER TABLE ${TASKS_TABLE}
            ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES ${SCHEDULES_TABLE}(id) ON DELETE CASCADE;
        `);
            // TODO: add indexes
        }));
    });
}
export function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`DROP TABLE IF EXISTS ${SCHEDULES_TABLE}`);
        yield knex.raw(`DROP TYPE IF EXISTS schedule_states`);
    });
}
//# sourceMappingURL=20240604135056_schedules_model.js.map