var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { nanoid } from '@nangohq/utils';
import { Scheduler } from './scheduler.js';
import * as tasks from './models/tasks.js';
import { getTestDbClient } from './db/helpers.test.js';
describe('Scheduler', () => {
    const dbClient = getTestDbClient();
    const db = dbClient.db;
    const callbacks = {
        CREATED: vi.fn((task) => expect(task.state).toBe('CREATED')),
        STARTED: vi.fn((task) => expect(task.state).toBe('STARTED')),
        SUCCEEDED: vi.fn((task) => expect(task.state).toBe('SUCCEEDED')),
        FAILED: vi.fn((task) => expect(task.state).toBe('FAILED')),
        EXPIRED: vi.fn((task) => expect(task.state).toBe('EXPIRED')),
        CANCELLED: vi.fn((task) => expect(task.state).toBe('CANCELLED'))
    };
    const scheduler = new Scheduler({ dbClient, on: callbacks });
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.migrate();
    }));
    afterEach(() => {
        callbacks.CREATED.mockReset();
        callbacks.STARTED.mockReset();
        callbacks.SUCCEEDED.mockReset();
        callbacks.FAILED.mockReset();
        callbacks.EXPIRED.mockReset();
        callbacks.CANCELLED.mockReset();
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        scheduler.stop();
        yield dbClient.clearDatabase();
    }));
    it('mark task as SUCCEEDED', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler);
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        const succeeded = (yield scheduler.succeed({ taskId: task.id, output: { foo: 'bar' } })).unwrap();
        expect(succeeded.state).toBe('SUCCEEDED');
    }));
    it('should retry failed task if max retries is not reached', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler, { taskProps: { retryMax: 2, retryCount: 1 } });
        yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 });
        (yield scheduler.fail({ taskId: task.id, error: { message: 'failure happened' } })).unwrap();
        const retried = (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        expect(retried.length).toBe(1);
    }));
    it('should not retry failed task if reached max retries', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler, { taskProps: { retryMax: 2, retryCount: 2 } });
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        (yield scheduler.fail({ taskId: task.id, error: { message: 'failure happened' } })).unwrap();
        const retried = (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        expect(retried.length).toBe(0);
    }));
    it('should dequeue task', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler);
        const dequeued = (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        expect(dequeued.length).toBe(1);
    }));
    it('should call callback when task is created', () => __awaiter(void 0, void 0, void 0, function* () {
        yield immediate(scheduler);
        expect(callbacks.CREATED).toHaveBeenCalledOnce();
    }));
    it('should call callback when task is started', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler);
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        expect(callbacks.STARTED).toHaveBeenCalledOnce();
    }));
    it('should call callback when task is failed', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler);
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        (yield scheduler.fail({ taskId: task.id, error: { message: 'failure happened' } })).unwrap();
        expect(callbacks.FAILED).toHaveBeenCalledOnce();
    }));
    it('should call callback when task is succeeded', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler);
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        (yield scheduler.succeed({ taskId: task.id, output: { foo: 'bar' } })).unwrap();
        expect(callbacks.SUCCEEDED).toHaveBeenCalledOnce();
    }));
    it('should call callback when task is cancelled', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield immediate(scheduler);
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        (yield scheduler.cancel({ taskId: task.id, reason: 'cancelled by user' })).unwrap();
        expect(callbacks.CANCELLED).toHaveBeenCalledOnce();
    }));
    it('should call callback when task is expired', () => __awaiter(void 0, void 0, void 0, function* () {
        const timeout = 1;
        yield immediate(scheduler, { taskProps: { createdToStartedTimeoutSecs: timeout } });
        yield new Promise((resolve) => setTimeout(resolve, timeout * 1500));
        expect(callbacks.EXPIRED).toHaveBeenCalledOnce();
    }));
    it('should monitor and expires created tasks if timeout is reached', () => __awaiter(void 0, void 0, void 0, function* () {
        const timeout = 1;
        const task = yield immediate(scheduler, { taskProps: { createdToStartedTimeoutSecs: timeout } });
        yield new Promise((resolve) => setTimeout(resolve, timeout * 1500));
        const expired = (yield tasks.get(db, task.id)).unwrap();
        expect(expired.state).toBe('EXPIRED');
    }));
    it('should monitor and expires started tasks if timeout is reached', () => __awaiter(void 0, void 0, void 0, function* () {
        const timeout = 1;
        const task = yield immediate(scheduler, { taskProps: { startedToCompletedTimeoutSecs: timeout } });
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        yield new Promise((resolve) => setTimeout(resolve, timeout * 1500));
        const taskAfter = (yield tasks.get(db, task.id)).unwrap();
        expect(taskAfter.state).toBe('EXPIRED');
    }));
    it('should monitor and expires started tasks if heartbeat timeout is reached', () => __awaiter(void 0, void 0, void 0, function* () {
        const timeout = 1;
        const task = yield immediate(scheduler, { taskProps: { heartbeatTimeoutSecs: timeout } });
        (yield scheduler.dequeue({ groupKey: task.groupKey, limit: 1 })).unwrap();
        yield new Promise((resolve) => setTimeout(resolve, timeout * 1500));
        const taskAfter = (yield tasks.get(db, task.id)).unwrap();
        expect(taskAfter.state).toBe('EXPIRED');
    }));
    it('should not run an immediate task for a schedule if another task is already running', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield recurring({ scheduler });
        yield immediate(scheduler, { schedule }); // first task: OK
        yield expect(immediate(scheduler, { schedule })).rejects.toThrow();
    }));
    it('should change schedule state', () => __awaiter(void 0, void 0, void 0, function* () {
        const paused = yield recurring({ scheduler, state: 'PAUSED' });
        expect(paused.state).toBe('PAUSED');
        const unpaused = (yield scheduler.setScheduleState({ scheduleName: paused.name, state: 'STARTED' })).unwrap();
        expect(unpaused.state).toBe('STARTED');
        const deleted = (yield scheduler.setScheduleState({ scheduleName: unpaused.name, state: 'DELETED' })).unwrap();
        expect(deleted.state).toBe('DELETED');
        expect(deleted.deletedAt).not.toBe(null);
    }));
    it('should cancel tasks if schedule is deleted', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const schedule = yield recurring({ scheduler });
        yield immediate(scheduler, { schedule });
        const deleted = (yield scheduler.setScheduleState({ scheduleName: schedule.name, state: 'DELETED' })).unwrap();
        expect(deleted.state).toBe('DELETED');
        const tasks = (yield scheduler.searchTasks({ scheduleId: schedule.id })).unwrap();
        expect(tasks.length).toBe(1);
        expect((_a = tasks[0]) === null || _a === void 0 ? void 0 : _a.state).toBe('CANCELLED');
        expect(callbacks.CANCELLED).toHaveBeenCalledOnce();
    }));
    it('should update schedule frequency', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield recurring({ scheduler });
        const newFrequency = 1800000;
        const updated = (yield scheduler.setScheduleFrequency({ scheduleName: schedule.name, frequencyMs: newFrequency })).unwrap();
        expect(updated.frequencyMs).toBe(newFrequency);
    }));
    it('should search schedules by name', () => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const schedule = yield recurring({ scheduler });
        const found = (yield scheduler.searchSchedules({ names: [schedule.name], limit: 1 })).unwrap();
        expect(found.length).toBe(1);
        expect((_b = found[0]) === null || _b === void 0 ? void 0 : _b.id).toBe(schedule.id);
    }));
});
function recurring({ scheduler, state = 'PAUSED' }) {
    return __awaiter(this, void 0, void 0, function* () {
        const recurringProps = {
            name: nanoid(),
            state,
            startsAt: new Date(),
            frequencyMs: 900000,
            payload: { foo: 'bar' },
            groupKey: nanoid(),
            retryMax: 0,
            retryCount: 0,
            createdToStartedTimeoutSecs: 3600,
            startedToCompletedTimeoutSecs: 3600,
            heartbeatTimeoutSecs: 600
        };
        return (yield scheduler.recurring(recurringProps)).unwrap();
    });
}
function immediate(scheduler, props) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function* () {
        let taskProps;
        if (props && 'schedule' in props) {
            taskProps = {
                scheduleName: props.schedule.name
            };
        }
        else {
            taskProps = {
                name: ((_a = props === null || props === void 0 ? void 0 : props.taskProps) === null || _a === void 0 ? void 0 : _a.name) || nanoid(),
                payload: ((_b = props === null || props === void 0 ? void 0 : props.taskProps) === null || _b === void 0 ? void 0 : _b.payload) || {},
                groupKey: ((_c = props === null || props === void 0 ? void 0 : props.taskProps) === null || _c === void 0 ? void 0 : _c.groupKey) || nanoid(),
                retryMax: ((_d = props === null || props === void 0 ? void 0 : props.taskProps) === null || _d === void 0 ? void 0 : _d.retryMax) || 1,
                retryCount: ((_e = props === null || props === void 0 ? void 0 : props.taskProps) === null || _e === void 0 ? void 0 : _e.retryCount) || 0,
                createdToStartedTimeoutSecs: ((_f = props === null || props === void 0 ? void 0 : props.taskProps) === null || _f === void 0 ? void 0 : _f.createdToStartedTimeoutSecs) || 3600,
                startedToCompletedTimeoutSecs: ((_g = props === null || props === void 0 ? void 0 : props.taskProps) === null || _g === void 0 ? void 0 : _g.startedToCompletedTimeoutSecs) || 3600,
                heartbeatTimeoutSecs: ((_h = props === null || props === void 0 ? void 0 : props.taskProps) === null || _h === void 0 ? void 0 : _h.heartbeatTimeoutSecs) || 600
            };
        }
        return (yield scheduler.immediate(taskProps)).unwrap();
    });
}
//# sourceMappingURL=scheduler.integration.test.js.map