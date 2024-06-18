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
export function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`
        ALTER TABLE ${SCHEDULES_TABLE}
        DROP COLUMN IF EXISTS retry_count;
    `);
    });
}
export function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.raw(`
        ALTER TABLE ${SCHEDULES_TABLE}
        ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL default(0);
    `);
    });
}
//# sourceMappingURL=20240613023845_remove_schedules_retry_count.js.map