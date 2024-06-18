var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import { getTestDbClient, Scheduler } from '@nangohq/scheduler';
import getPort from 'get-port';
import { nanoid } from '@nangohq/utils';
import { getServer } from '../server.js';
import { OrchestratorClient } from './client.js';
import { EventsHandler } from '../events.js';
const dbClient = getTestDbClient();
const eventsHandler = new EventsHandler({
    CREATED: () => { },
    STARTED: () => { },
    SUCCEEDED: () => { },
    FAILED: () => { },
    EXPIRED: () => { },
    CANCELLED: () => { }
});
const scheduler = new Scheduler({
    dbClient,
    on: eventsHandler.onCallbacks
});
describe('OrchestratorClient', () => __awaiter(void 0, void 0, void 0, function* () {
    const server = getServer(scheduler, eventsHandler);
    const port = yield getPort();
    const client = new OrchestratorClient({ baseUrl: `http://localhost:${port}` });
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.migrate();
        server.listen(port);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        scheduler.stop();
        yield dbClient.clearDatabase();
    }));
    describe('recurring schedule', () => {
        it('should be created', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield client.recurring({
                name: nanoid(),
                state: 'STARTED',
                startsAt: new Date(),
                frequencyMs: 300000,
                groupKey: nanoid(),
                retry: { max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'sync',
                    syncId: 'sync-a',
                    syncName: nanoid(),
                    syncJobId: 5678,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    debug: false
                }
            });
            expect(res.isOk()).toBe(true);
        }));
        it('should be updatable', () => __awaiter(void 0, void 0, void 0, function* () {
            const name = nanoid();
            yield client.recurring({
                name,
                state: 'STARTED',
                startsAt: new Date(),
                frequencyMs: 300000,
                groupKey: nanoid(),
                retry: { max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'sync',
                    syncId: 'sync-a',
                    syncName: nanoid(),
                    syncJobId: 5678,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    debug: false
                }
            });
            const res = yield client.updateSyncFrequency({ scheduleName: name, frequencyMs: 600000 });
            expect(res.isOk()).toBe(true);
        }));
        it('should be paused/unpaused/deleted', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduleName = nanoid();
            yield client.recurring({
                name: scheduleName,
                state: 'STARTED',
                startsAt: new Date(),
                frequencyMs: 300000,
                groupKey: nanoid(),
                retry: { max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'sync',
                    syncId: 'sync-a',
                    syncName: nanoid(),
                    syncJobId: 5678,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    debug: false
                }
            });
            const paused = yield client.pauseSync({ scheduleName });
            expect(paused.isOk(), `pausing failed ${JSON.stringify(paused)}`).toBe(true);
            const unpaused = yield client.unpauseSync({ scheduleName });
            expect(unpaused.isOk(), `pausing failed ${JSON.stringify(unpaused)}`).toBe(true);
            const deleted = yield client.deleteSync({ scheduleName });
            expect(deleted.isOk(), `pausing failed ${JSON.stringify(deleted)}`).toBe(true);
        }));
        it('should be searchable', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const name = nanoid();
            yield client.recurring({
                name,
                state: 'STARTED',
                startsAt: new Date(),
                frequencyMs: 300000,
                groupKey: nanoid(),
                retry: { max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'sync',
                    syncId: 'sync-a',
                    syncName: nanoid(),
                    syncJobId: 5678,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    debug: false
                }
            });
            const res = (yield client.searchSchedules({ scheduleNames: [name], limit: 1 })).unwrap();
            expect(res.length).toBe(1);
            expect((_a = res[0]) === null || _a === void 0 ? void 0 : _a.name).toBe(name);
        }));
    });
    describe('heartbeat', () => {
        it('should be successful', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduledTask = yield client.immediate({
                name: nanoid(),
                groupKey: nanoid(),
                retry: { count: 0, max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'action',
                    actionName: nanoid(),
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    activityLogId: 789,
                    input: { foo: 'bar' }
                }
            });
            const taskId = scheduledTask.unwrap().taskId;
            const beforeTask = yield scheduler.get({ taskId });
            const res = yield client.heartbeat({ taskId });
            const after = yield scheduler.get({ taskId });
            expect(res.isOk(), `heartbeat failed: ${res.isErr() ? JSON.stringify(res.error) : ''}`).toBe(true);
            expect(after.unwrap().lastHeartbeatAt.getTime()).toBeGreaterThan(beforeTask.unwrap().lastHeartbeatAt.getTime());
        }));
    });
    describe('executeAction', () => {
        it('should be successful when action task succeed', () => __awaiter(void 0, void 0, void 0, function* () {
            const groupKey = nanoid();
            const output = { count: 9 };
            const processor = new MockProcessor({
                groupKey,
                process: (task) => __awaiter(void 0, void 0, void 0, function* () {
                    yield scheduler.succeed({ taskId: task.id, output });
                })
            });
            try {
                const res = yield client.executeAction({
                    name: nanoid(),
                    groupKey: groupKey,
                    args: {
                        actionName: 'Action',
                        connection: {
                            id: 1234,
                            connection_id: 'C',
                            provider_config_key: 'P',
                            environment_id: 5678
                        },
                        activityLogId: 9876,
                        input: { foo: 'bar' }
                    }
                });
                expect(res.unwrap()).toEqual(output);
            }
            finally {
                processor.stop();
            }
        }));
        it('should return an error if action task fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const groupKey = nanoid();
            const errorPayload = { message: 'something bad happened' };
            const processor = new MockProcessor({
                groupKey,
                process: (task) => __awaiter(void 0, void 0, void 0, function* () {
                    yield scheduler.fail({ taskId: task.id, error: errorPayload });
                })
            });
            try {
                const res = yield client.executeAction({
                    name: nanoid(),
                    groupKey: groupKey,
                    args: {
                        actionName: 'Action',
                        connection: {
                            id: 1234,
                            connection_id: 'C',
                            provider_config_key: 'P',
                            environment_id: 5678
                        },
                        activityLogId: 9876,
                        input: { foo: 'bar' }
                    }
                });
                expect(res.isOk()).toBe(false);
                if (res.isErr()) {
                    expect(res.error.payload).toBe(res.error.payload);
                }
            }
            finally {
                processor.stop();
            }
        }));
    });
    describe('executeWebhook', () => {
        it('should be successful when action task succeed', () => __awaiter(void 0, void 0, void 0, function* () {
            const groupKey = nanoid();
            const output = { count: 9 };
            const processor = new MockProcessor({
                groupKey,
                process: (task) => __awaiter(void 0, void 0, void 0, function* () {
                    yield scheduler.succeed({ taskId: task.id, output });
                })
            });
            try {
                const res = yield client.executeWebhook({
                    name: nanoid(),
                    groupKey: groupKey,
                    args: {
                        webhookName: 'W',
                        parentSyncName: 'parent',
                        connection: {
                            id: 1234,
                            connection_id: 'C',
                            provider_config_key: 'P',
                            environment_id: 5678
                        },
                        activityLogId: 9876,
                        input: { foo: 'bar' }
                    }
                });
                expect(res.unwrap()).toEqual(output);
            }
            finally {
                processor.stop();
            }
        }));
        it('should return an error if action task fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const groupKey = nanoid();
            const errorPayload = { message: 'something bad happened' };
            const processor = new MockProcessor({
                groupKey,
                process: (task) => __awaiter(void 0, void 0, void 0, function* () {
                    yield scheduler.fail({ taskId: task.id, error: errorPayload });
                })
            });
            try {
                const res = yield client.executeWebhook({
                    name: nanoid(),
                    groupKey: groupKey,
                    args: {
                        webhookName: 'W',
                        parentSyncName: nanoid(),
                        connection: {
                            id: 1234,
                            connection_id: 'C',
                            provider_config_key: 'P',
                            environment_id: 5678
                        },
                        activityLogId: 9876,
                        input: { foo: 'bar' }
                    }
                });
                expect(res.isOk()).toBe(false);
                if (res.isErr()) {
                    expect(res.error.payload).toBe(res.error.payload);
                }
            }
            finally {
                processor.stop();
            }
        }));
    });
    describe('succeed', () => {
        it('should support big output', () => __awaiter(void 0, void 0, void 0, function* () {
            const groupKey = nanoid();
            const actionA = yield client.immediate({
                name: nanoid(),
                groupKey,
                retry: { count: 0, max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'action',
                    actionName: `A`,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    activityLogId: 789,
                    input: { foo: 'bar' }
                }
            });
            yield client.dequeue({ groupKey, limit: 1, longPolling: false });
            const res = yield client.succeed({ taskId: actionA.unwrap().taskId, output: { a: 'a'.repeat(10000000) } });
            expect(res.isOk()).toBe(true);
        }));
    });
    describe('search', () => {
        it('should returns task by ids', () => __awaiter(void 0, void 0, void 0, function* () {
            const groupKey = nanoid();
            const actionA = yield client.immediate({
                name: nanoid(),
                groupKey,
                retry: { count: 0, max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'action',
                    actionName: `A`,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    activityLogId: 789,
                    input: { foo: 'bar' }
                }
            });
            const actionB = yield client.immediate({
                name: nanoid(),
                groupKey,
                retry: { count: 0, max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'action',
                    actionName: `A`,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    activityLogId: 789,
                    input: { foo: 'bar' }
                }
            });
            const ids = [actionA.unwrap().taskId, actionB.unwrap().taskId];
            const res = yield client.searchTasks({ ids });
            expect(res.unwrap().length).toBe(2);
            expect(res.unwrap().map((task) => task.id)).toEqual(ids);
        }));
    });
    describe('dequeue', () => {
        it('should returns nothing if no scheduled task', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield client.dequeue({ groupKey: 'abc', limit: 1, longPolling: false });
            expect(res.unwrap()).toEqual([]);
        }));
        it('should return scheduled tasks', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const groupKey = nanoid();
            const scheduledAction = yield client.immediate({
                name: nanoid(),
                groupKey,
                retry: { count: 0, max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'action',
                    actionName: `A`,
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    activityLogId: 789,
                    input: { foo: 'bar' }
                }
            });
            const scheduledWebhook = yield client.immediate({
                name: nanoid(),
                groupKey,
                retry: { count: 0, max: 0 },
                timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
                args: {
                    type: 'webhook',
                    webhookName: `webhook-a`,
                    parentSyncName: 'parent',
                    connection: {
                        id: 123,
                        connection_id: 'C',
                        provider_config_key: 'P',
                        environment_id: 456
                    },
                    activityLogId: 789,
                    input: { foo: 'bar' }
                }
            });
            const res = yield client.dequeue({ groupKey, limit: 2, longPolling: false });
            expect(res.unwrap().length).toBe(2);
            expect((_a = res.unwrap()[0]) === null || _a === void 0 ? void 0 : _a.isAction()).toBe(true);
            expect((_b = res.unwrap()[1]) === null || _b === void 0 ? void 0 : _b.isWebhook()).toBe(true);
            expect(res.unwrap().map((task) => task.id)).toEqual([scheduledAction.unwrap().taskId, scheduledWebhook.unwrap().taskId]);
        }));
    });
}));
class MockProcessor {
    constructor({ groupKey, process }) {
        this.interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const tasks = (yield scheduler.searchTasks({ groupKey })).unwrap();
            for (const task of tasks) {
                switch (task.state) {
                    case 'CREATED':
                        scheduler.dequeue({ groupKey, limit: 1 });
                        break;
                    case 'STARTED':
                        process(task);
                        break;
                }
            }
        }), 100);
    }
    stop() {
        clearTimeout(this.interval);
    }
}
//# sourceMappingURL=client.integration.test.js.map