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
export const config = {
    transaction: false
};
export function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_group_key_state" ON ${TASKS_TABLE} USING BTREE (group_key, state);`);
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_group_key_created" ON ${TASKS_TABLE} USING BTREE (group_key) WHERE state = 'CREATED';`);
        yield knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_group_key_started" ON ${TASKS_TABLE} USING BTREE (group_key) WHERE state = 'STARTED';`);
    });
}
export function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`DROP INDEX IF EXISTS "idx_tasks_group_key_state";`);
        yield knex.raw(`DROP INDEX IF EXISTS "idx_tasks_group_key_created";`);
        yield knex.raw(`DROP INDEX IF EXISTS "idx_tasks_group_key_started";`);
    });
}
//# sourceMappingURL=20240530201334_tasks_indexes.js.map