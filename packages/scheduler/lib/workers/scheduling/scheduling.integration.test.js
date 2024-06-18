var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DbSchedule, SCHEDULES_TABLE } from '@nangohq/models/schedules.js';
import { uuidv7 } from 'uuidv7';
import { TASKS_TABLE, DbTask } from '@nangohq/models/tasks.js';
import { getTestDbClient } from '../../db/helpers.test.js';
import { dueSchedules } from './scheduling.js';
describe('dueSchedules', () => {
    const dbClient = getTestDbClient();
    const db = dbClient.db;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.migrate();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.clearDatabase();
    }));
    it('should not return schedule that is deleted', () => __awaiter(void 0, void 0, void 0, function* () {
        yield addSchedule(db, { state: 'DELETED', frequency: '3 minutes' });
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(0);
    }));
    it('should not return schedule that is paused', () => __awaiter(void 0, void 0, void 0, function* () {
        yield addSchedule(db, { state: 'PAUSED', frequency: '3 minutes' });
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(0);
    }));
    it('should not return schedule that is set to start in the future', () => __awaiter(void 0, void 0, void 0, function* () {
        yield addSchedule(db, { state: 'STARTED', frequency: '3 minutes', startsAt: Seconds.after(1 * 60) });
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(0);
    }));
    it('should not return schedule that have a recent task completed', () => __awaiter(void 0, void 0, void 0, function* () {
        const startsAt = Seconds.ago(-5 * 60); // 5 minutes ago
        const schedule = yield addSchedule(db, { startsAt, frequency: '10 minutes' });
        yield addTask(db, {
            scheduleId: schedule.id,
            state: 'SUCCEEDED',
            startsAfter: startsAt,
            lastStateTransitionAt: Seconds.after(20, startsAt)
        });
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(0);
    }));
    it('should not return schedule that have a task running', () => __awaiter(void 0, void 0, void 0, function* () {
        const startsAt = Seconds.ago(-5 * 60); // 5 minutes ago
        const schedule = yield addSchedule(db, { startsAt, frequency: '10 minutes' });
        yield addTask(db, {
            scheduleId: schedule.id,
            state: 'STARTED',
            startsAfter: startsAt,
            lastStateTransitionAt: startsAt
        });
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(0);
    }));
    it('should return schedule that has never run', () => __awaiter(void 0, void 0, void 0, function* () {
        yield addSchedule(db);
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(1);
    }));
    it('should return schedule that has not run recently', () => __awaiter(void 0, void 0, void 0, function* () {
        const startsAt = Seconds.ago(6 * 60); // 10 minutes ago
        const schedule = yield addSchedule(db, { startsAt, frequency: '5 minutes' });
        yield addTask(db, {
            scheduleId: schedule.id,
            state: 'SUCCEEDED',
            startsAfter: startsAt,
            lastStateTransitionAt: Seconds.after(20, startsAt)
        });
        const due = yield dueSchedules(db);
        expect(due.isOk()).toBe(true);
        expect(due.unwrap().length).toBe(1);
    }));
});
const Seconds = {
    after: (seconds, date = new Date()) => {
        return new Date(date.getTime() + seconds * 1000);
    },
    ago: (seconds, date = new Date()) => {
        return new Date(date.getTime() - seconds * 1000);
    }
};
function addSchedule(db, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const schedule = {
            id: uuidv7(),
            name: Math.random().toString(36).substring(7),
            state: (params === null || params === void 0 ? void 0 : params.state) || 'STARTED',
            starts_at: (params === null || params === void 0 ? void 0 : params.startsAt) || new Date(),
            frequency: (params === null || params === void 0 ? void 0 : params.frequency) || '5 minutes',
            payload: {},
            group_key: Math.random().toString(36).substring(7),
            retry_max: 0,
            created_to_started_timeout_secs: 1,
            started_to_completed_timeout_secs: 1,
            heartbeat_timeout_secs: 1,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: (params === null || params === void 0 ? void 0 : params.state) === 'DELETED' ? new Date() : null
        };
        const res = yield db.from(SCHEDULES_TABLE).insert(schedule).returning('*');
        const inserted = res[0];
        if (!inserted) {
            throw new Error('Failed to insert schedule');
        }
        return DbSchedule.from(inserted);
    });
}
function addTask(db, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = {
            id: uuidv7(),
            schedule_id: (params === null || params === void 0 ? void 0 : params.scheduleId) || uuidv7(),
            group_key: Math.random().toString(36).substring(7),
            name: Math.random().toString(36).substring(7),
            state: (params === null || params === void 0 ? void 0 : params.state) || 'CREATED',
            payload: {},
            retry_max: 0,
            retry_count: 0,
            created_at: (params === null || params === void 0 ? void 0 : params.startsAfter) || new Date(),
            last_state_transition_at: (params === null || params === void 0 ? void 0 : params.lastStateTransitionAt) || new Date(),
            starts_after: (params === null || params === void 0 ? void 0 : params.startsAfter) || new Date(),
            created_to_started_timeout_secs: 1,
            started_to_completed_timeout_secs: 1,
            heartbeat_timeout_secs: 1,
            last_heartbeat_at: new Date(),
            output: {},
            terminated: (params === null || params === void 0 ? void 0 : params.state) !== 'CREATED' && (params === null || params === void 0 ? void 0 : params.state) !== 'STARTED'
        };
        const res = yield db.from(TASKS_TABLE).insert(task).returning('*');
        const inserted = res[0];
        if (!inserted) {
            throw new Error('Failed to insert task');
        }
        return DbTask.from(inserted);
    });
}
//# sourceMappingURL=scheduling.integration.test.js.map