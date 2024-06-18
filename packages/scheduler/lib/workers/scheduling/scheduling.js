var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DbSchedule, SCHEDULES_TABLE } from '@nangohq/models/schedules.js';
import { Err, Ok, stringifyError } from '@nangohq/utils';
import { TASKS_TABLE } from '@nangohq/models/tasks.js';
export function dueSchedules(db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = db
                .with('due_dates', 
            // calculate the most recent due date for each schedule that is started/not deleted
            db
                .select('s.id', db.raw(`
                            s.starts_at + (FLOOR(EXTRACT(EPOCH FROM (NOW() - s.starts_at)) / EXTRACT(EPOCH FROM s.frequency)) * s.frequency) AS dueAt
                        `))
                .from({ s: SCHEDULES_TABLE })
                .where({ state: 'STARTED' })
                .whereRaw('s.starts_at <= NOW()')
                // Locking schedules to prevent any concurrent update or concurrent scheduling of tasks
                .forUpdate()
                .skipLocked())
                .select('*')
                .from({ s: SCHEDULES_TABLE })
                .joinRaw('JOIN due_dates lrt ON s.id = lrt.id')
                // filter out schedules that have a running task
                .whereNotExists(db
                .select('id')
                .from({ t: TASKS_TABLE })
                .whereRaw('t.schedule_id = s.id')
                .where(function () {
                this.where({ state: 'CREATED' }).orWhere({ state: 'STARTED' });
            }))
                // filter out schedules that have tasks started after the due date
                .whereNotExists(db.select('id').from({ t: TASKS_TABLE }).whereRaw('t.schedule_id = s.id').andWhere('t.starts_after', '>=', db.raw('lrt.dueAt')));
            const schedules = yield query;
            return Ok(schedules.map(DbSchedule.from));
        }
        catch (err) {
            console.log(err);
            return Err(new Error(`Error getting due schedules: ${stringifyError(err)}`));
        }
    });
}
//# sourceMappingURL=scheduling.js.map