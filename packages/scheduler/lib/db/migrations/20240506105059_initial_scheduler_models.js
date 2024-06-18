var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TASKS_TABLE } from '@nangohq/models/tasks.js';
export function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            yield trx.raw(`
            CREATE TYPE task_states AS ENUM (
                'CREATED',
                'STARTED',
                'SUCCEEDED',
                'FAILED',
                'EXPIRED',
                'CANCELLED'
            );
        `);
            yield trx.raw(`
            CREATE TABLE ${TASKS_TABLE} (
                id uuid PRIMARY KEY,
                name varchar(255) NOT NULL,
                payload json NOT NULL,
                group_key varchar(255) NOT NULL,
                retry_max integer NOT NULL default(0),
                retry_count integer NOT NULL default(0),
                starts_after timestamp with time zone NOT NULL,
                created_to_started_timeout_secs integer NOT NULL,
                started_to_completed_timeout_secs integer NOT NULL,
                heartbeat_timeout_secs integer NOT NULL,
                created_at timestamp with time zone NOT NULL,
                state task_states NOT NULL,
                last_state_transition_at timestamp with time zone NOT NULL,
                last_heartbeat_at timestamp with time zone NOT NULL,
                output json NULL,
                terminated boolean
            );
        `);
        }));
    });
}
export function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`DROP TABLE IF EXISTS ${TASKS_TABLE}`);
        yield knex.raw(`DROP TYPE IF EXISTS task_states`);
    });
}
//# sourceMappingURL=20240506105059_initial_scheduler_models.js.map