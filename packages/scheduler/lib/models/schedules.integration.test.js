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
import * as schedules from './schedules.js';
import { getTestDbClient } from '../db/helpers.test.js';
describe('Schedules', () => {
    const dbClient = getTestDbClient();
    const db = dbClient.db;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.migrate();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.clearDatabase();
    }));
    it('should be successfully created', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        expect(schedule).toMatchObject({
            id: expect.any(String),
            name: 'Test Schedule',
            state: 'STARTED',
            payload: { foo: 'bar' },
            startsAt: expect.toBeIsoDateTimezone(),
            frequencyMs: 300000,
            createdAt: expect.toBeIsoDateTimezone(),
            updatedAt: expect.toBeIsoDateTimezone(),
            deletedAt: null
        });
    }));
    it('should be successfully retrieved', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        const retrieved = (yield schedules.get(db, schedule.id)).unwrap();
        expect(retrieved).toMatchObject(schedule);
    }));
    it('should be successfully deleted', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        const deleted = (yield schedules.remove(db, schedule.id)).unwrap();
        expect(deleted.state).toBe('DELETED');
        expect(deleted.updatedAt.getTime()).toBeGreaterThan(schedule.updatedAt.getTime());
        expect(deleted.deletedAt).toBeInstanceOf(Date);
    }));
    it('should be successfully paused/unpaused', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        const paused = (yield schedules.transitionState(db, schedule.id, 'PAUSED')).unwrap();
        expect(paused.state).toBe('PAUSED');
        expect(paused.updatedAt.getTime()).toBeGreaterThan(schedule.updatedAt.getTime());
        const unpaused = (yield schedules.transitionState(db, schedule.id, 'STARTED')).unwrap();
        expect(unpaused.state).toBe('STARTED');
        expect(unpaused.updatedAt.getTime()).toBeGreaterThan(schedule.updatedAt.getTime());
    }));
    it('should fail when pausing/unpausing a deleted schedule', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        yield schedules.remove(db, schedule.id);
        const paused = yield schedules.transitionState(db, schedule.id, 'PAUSED');
        expect(paused.isErr()).toBe(true);
        const unpaused = yield schedules.transitionState(db, schedule.id, 'STARTED');
        expect(unpaused.isErr()).toBe(true);
    }));
    it('should be successfully updated', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        const updated = (yield schedules.update(db, { id: schedule.id, frequencyMs: 600000, payload: { i: 2 } })).unwrap();
        expect(updated.frequencyMs).toBe(600000);
        expect(updated.payload).toMatchObject({ i: 2 });
        expect(updated.updatedAt.getTime()).toBeGreaterThan(schedule.updatedAt.getTime());
    }));
    it('should be searchable', () => __awaiter(void 0, void 0, void 0, function* () {
        const schedule = yield createSchedule(db);
        const byName = (yield schedules.search(db, { names: [schedule.name], limit: 10 })).unwrap();
        expect(byName).toEqual([schedule]);
        const started = (yield schedules.search(db, { state: 'STARTED', limit: 10 })).unwrap();
        expect(started).toEqual([schedule]);
        const deleted = (yield schedules.search(db, { state: 'DELETED', limit: 10 })).unwrap();
        expect(deleted).toEqual([]);
    }));
});
function createSchedule(db) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield schedules.create(db, {
            name: 'Test Schedule',
            state: 'STARTED',
            payload: { foo: 'bar' },
            startsAt: new Date(),
            frequencyMs: 300000,
            groupKey: 'test-group-key',
            retryMax: 1,
            createdToStartedTimeoutSecs: 1,
            startedToCompletedTimeoutSecs: 1,
            heartbeatTimeoutSecs: 1
        })).unwrap();
    });
}
//# sourceMappingURL=schedules.integration.test.js.map