var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { nanoid } from '@nangohq/utils';
import * as tasks from './tasks.js';
import { taskStates } from '../types.js';
import { getTestDbClient } from '../db/helpers.test.js';
describe('Task', () => {
    const dbClient = getTestDbClient();
    const db = dbClient.db;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.migrate();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.clearDatabase();
    }));
    it('should be successfully created', () => __awaiter(void 0, void 0, void 0, function* () {
        const task = (yield tasks.create(db, {
            name: 'Test Task',
            payload: { foo: 'bar' },
            groupKey: 'groupA',
            retryMax: 3,
            retryCount: 1,
            startsAfter: new Date(),
            createdToStartedTimeoutSecs: 10,
            startedToCompletedTimeoutSecs: 20,
            heartbeatTimeoutSecs: 5,
            scheduleId: null
        })).unwrap();
        expect(task).toMatchObject({
            id: expect.any(String),
            name: 'Test Task',
            payload: { foo: 'bar' },
            groupKey: 'groupA',
            retryMax: 3,
            retryCount: 1,
            startsAfter: expect.toBeIsoDateTimezone(),
            createdAt: expect.toBeIsoDateTimezone(),
            createdToStartedTimeoutSecs: 10,
            startedToCompletedTimeoutSecs: 20,
            state: 'CREATED',
            lastStateTransitionAt: expect.toBeIsoDateTimezone(),
            lastHeartbeatAt: expect.toBeIsoDateTimezone(),
            output: null,
            terminated: false,
            scheduleId: null
        });
    }));
    it('should have their heartbeat updated', () => __awaiter(void 0, void 0, void 0, function* () {
        const t = yield startTask(db);
        yield new Promise((resolve) => void setTimeout(resolve, 20));
        const updated = (yield tasks.heartbeat(db, t.id)).unwrap();
        expect(updated.lastHeartbeatAt.getTime()).toBeGreaterThan(t.lastHeartbeatAt.getTime());
    }));
    it('should transition between valid states and error when transitioning between invalid states', () => __awaiter(void 0, void 0, void 0, function* () {
        const doTransition = ({ taskId, newState }) => __awaiter(void 0, void 0, void 0, function* () {
            return newState === 'CREATED' || newState === 'STARTED'
                ? yield tasks.transitionState(db, { taskId, newState })
                : yield tasks.transitionState(db, { taskId, newState, output: { foo: 'bar' } });
        });
        for (const from of taskStates) {
            for (const to of taskStates) {
                const t = yield createTaskWithState(db, from);
                if (tasks.validTaskStateTransitions.find((v) => v.from === from && v.to === to)) {
                    // sleep to ensure lastStateTransitionAt is different from the previous state
                    yield new Promise((resolve) => void setTimeout(resolve, 10));
                    const updated = yield doTransition({ taskId: t.id, newState: to });
                    expect(updated.unwrap().state).toBe(to);
                    expect(updated.unwrap().lastStateTransitionAt.getTime()).toBeGreaterThan(t.lastStateTransitionAt.getTime());
                }
                else {
                    const updated = yield doTransition({ taskId: t.id, newState: to });
                    expect(updated.isErr(), `transition from ${from} to ${to} failed`).toBe(true);
                }
            }
        }
    }));
    it('should be dequeued', () => __awaiter(void 0, void 0, void 0, function* () {
        const t0 = yield createTask(db, { groupKey: 'A' });
        const t1 = yield createTask(db);
        const t2 = yield createTask(db, { groupKey: t1.groupKey });
        yield createTask(db, { groupKey: t0.groupKey });
        yield createTask(db, { groupKey: t1.groupKey });
        let dequeued = (yield tasks.dequeue(db, { groupKey: t1.groupKey, limit: 2 })).unwrap();
        expect(dequeued).toHaveLength(2);
        expect(dequeued[0]).toMatchObject({ id: t1.id, state: 'STARTED' });
        expect(dequeued[1]).toMatchObject({ id: t2.id, state: 'STARTED' });
        dequeued = (yield tasks.dequeue(db, { groupKey: t1.groupKey, limit: 2 })).unwrap();
        expect(dequeued).toHaveLength(1); // only one task left
        dequeued = (yield tasks.dequeue(db, { groupKey: t1.groupKey, limit: 1 })).unwrap();
        expect(dequeued).toHaveLength(0); // no tasks left
    }));
    it('should not be dequeued if startsAfter is in the future', () => __awaiter(void 0, void 0, void 0, function* () {
        const tomorrow = (() => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            return date;
        })();
        const task = yield createTask(db, { startsAfter: tomorrow });
        const dequeued = (yield tasks.dequeue(db, { groupKey: task.groupKey, limit: 1 })).unwrap();
        expect(dequeued).toHaveLength(0);
    }));
    it('should expires tasks if createdToStartedTimeoutSecs is reached', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const timeout = 1;
        yield createTask(db, { createdToStartedTimeoutSecs: timeout });
        yield new Promise((resolve) => void setTimeout(resolve, timeout * 1100));
        const expired = (yield tasks.expiresIfTimeout(db)).unwrap();
        expect(expired).toHaveLength(1);
        expect((_a = expired[0]) === null || _a === void 0 ? void 0 : _a.output).toMatchObject({ reason: `createdToStartedTimeoutSecs_exceeded` });
    }));
    it('should expires tasks if startedToCompletedTimeoutSecs is reached', () => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const timeout = 1;
        yield startTask(db, { startedToCompletedTimeoutSecs: timeout });
        yield new Promise((resolve) => void setTimeout(resolve, timeout * 1100));
        const expired = (yield tasks.expiresIfTimeout(db)).unwrap();
        expect(expired).toHaveLength(1);
        expect((_b = expired[0]) === null || _b === void 0 ? void 0 : _b.output).toMatchObject({ reason: `startedToCompletedTimeoutSecs_exceeded` });
    }));
    it('should expires tasks if heartbeatTimeoutSecs is reached', () => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const timeout = 1;
        yield startTask(db, { heartbeatTimeoutSecs: timeout });
        yield new Promise((resolve) => void setTimeout(resolve, timeout * 1100));
        const expired = (yield tasks.expiresIfTimeout(db)).unwrap();
        expect(expired).toHaveLength(1);
        expect((_c = expired[0]) === null || _c === void 0 ? void 0 : _c.output).toMatchObject({ reason: `heartbeatTimeoutSecs_exceeded` });
    }));
    it('should search tasks', () => __awaiter(void 0, void 0, void 0, function* () {
        const t1 = yield createTaskWithState(db, 'STARTED');
        const t2 = yield createTaskWithState(db, 'CREATED');
        const t3 = yield createTaskWithState(db, 'CREATED');
        const l1 = (yield tasks.search(db)).unwrap();
        expect(l1.length).toBe(3);
        const l2 = (yield tasks.search(db, { groupKey: t1.groupKey })).unwrap();
        expect(l2.length).toBe(1);
        expect(l2.map((t) => t.id)).toStrictEqual([t1.id]);
        const l3 = (yield tasks.search(db, { states: ['CREATED'] })).unwrap();
        expect(l3.length).toBe(2);
        expect(l3.map((t) => t.id)).toStrictEqual([t2.id, t3.id]);
        const l4 = (yield tasks.search(db, { states: ['CREATED'], groupKey: 'unkown' })).unwrap();
        expect(l4.length).toBe(0);
        const l5 = (yield tasks.search(db, { ids: [t1.id, t2.id] })).unwrap();
        expect(l5.length).toBe(2);
        expect(l5.map((t) => t.id)).toStrictEqual([t1.id, t2.id]);
    }));
    it('should be successfully saving json output', () => __awaiter(void 0, void 0, void 0, function* () {
        const outputs = [1, 'one', true, null, ['a', 'b'], { a: 1, b: 2, s: 'two', arr: ['a', 'b'] }, [{ id: 'a' }, { id: 'b' }]];
        for (const output of outputs) {
            const task = yield createTaskWithState(db, 'STARTED');
            (yield tasks.transitionState(db, { taskId: task.id, newState: 'SUCCEEDED', output })).unwrap();
        }
    }));
});
function createTaskWithState(db, state) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (state) {
            case 'CREATED':
                return createTask(db);
            case 'STARTED':
                return startTask(db);
            case 'FAILED':
                return startTask(db).then((t) => __awaiter(this, void 0, void 0, function* () { return (yield tasks.transitionState(db, { taskId: t.id, newState: 'FAILED', output: { foo: 'bar' } })).unwrap(); }));
            case 'SUCCEEDED':
                return startTask(db).then((t) => __awaiter(this, void 0, void 0, function* () { return (yield tasks.transitionState(db, { taskId: t.id, newState: 'SUCCEEDED', output: { foo: 'bar' } })).unwrap(); }));
            case 'EXPIRED':
                return startTask(db).then((t) => __awaiter(this, void 0, void 0, function* () { return (yield tasks.transitionState(db, { taskId: t.id, newState: 'EXPIRED', output: { reason: `timeout_exceeded` } })).unwrap(); }));
            case 'CANCELLED':
                return startTask(db).then((t) => __awaiter(this, void 0, void 0, function* () { return (yield tasks.transitionState(db, { taskId: t.id, newState: 'CANCELLED', output: { reason: 'cancelled_via_ui' } })).unwrap(); }));
        }
    });
}
function createTask(db, props) {
    return __awaiter(this, void 0, void 0, function* () {
        return tasks
            .create(db, {
            name: (props === null || props === void 0 ? void 0 : props.name) || nanoid(),
            payload: (props === null || props === void 0 ? void 0 : props.payload) || {},
            groupKey: (props === null || props === void 0 ? void 0 : props.groupKey) || nanoid(),
            retryMax: (props === null || props === void 0 ? void 0 : props.retryMax) || 3,
            retryCount: (props === null || props === void 0 ? void 0 : props.retryCount) || 1,
            startsAfter: (props === null || props === void 0 ? void 0 : props.startsAfter) || new Date(),
            createdToStartedTimeoutSecs: (props === null || props === void 0 ? void 0 : props.createdToStartedTimeoutSecs) || 10,
            startedToCompletedTimeoutSecs: (props === null || props === void 0 ? void 0 : props.startedToCompletedTimeoutSecs) || 20,
            heartbeatTimeoutSecs: (props === null || props === void 0 ? void 0 : props.heartbeatTimeoutSecs) || 5,
            scheduleId: (props === null || props === void 0 ? void 0 : props.scheduleId) || null
        })
            .then((t) => t.unwrap());
    });
}
function startTask(db, props) {
    return __awaiter(this, void 0, void 0, function* () {
        return createTask(db, props).then((t) => __awaiter(this, void 0, void 0, function* () { return (yield tasks.transitionState(db, { taskId: t.id, newState: 'STARTED' })).unwrap(); }));
    });
}
//# sourceMappingURL=tasks.integration.test.js.map