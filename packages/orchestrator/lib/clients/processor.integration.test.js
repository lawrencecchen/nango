var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll, afterAll, vi } from 'vitest';
import { getTestDbClient, Scheduler } from '@nangohq/scheduler';
import getPort from 'get-port';
import { Ok, Err, nanoid } from '@nangohq/utils';
import { tracer } from 'dd-trace';
import { getServer } from '../server.js';
import { OrchestratorClient } from './client.js';
import { OrchestratorProcessor } from './processor.js';
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
const port = await getPort();
const orchestratorClient = new OrchestratorClient({ baseUrl: `http://localhost:${port}` });
describe('OrchestratorProcessor', () => __awaiter(void 0, void 0, void 0, function* () {
    const server = getServer(scheduler, eventsHandler);
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dbClient.migrate();
        server.listen(port);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        scheduler.stop();
        yield dbClient.clearDatabase();
    }));
    it('should process tasks and mark them as successful if processing succeed', () => __awaiter(void 0, void 0, void 0, function* () {
        const groupKey = nanoid();
        const mockProcess = vi.fn(() => __awaiter(void 0, void 0, void 0, function* () { return Ok({ foo: 'bar' }); }));
        const n = 10;
        yield processN(mockProcess, groupKey, n);
        expect(mockProcess).toHaveBeenCalledTimes(n);
        const tasks = yield scheduler.searchTasks({ groupKey });
        for (const task of tasks.unwrap()) {
            expect(task.state).toBe('SUCCEEDED');
        }
    }));
    it('should process tasks and mark them as failed if processing failed', () => __awaiter(void 0, void 0, void 0, function* () {
        const groupKey = nanoid();
        const mockProcess = vi.fn(() => __awaiter(void 0, void 0, void 0, function* () { return Err('Failed'); }));
        const n = 10;
        yield processN(mockProcess, groupKey, n);
        expect(mockProcess).toHaveBeenCalledTimes(n);
        const tasks = yield scheduler.searchTasks({ groupKey });
        for (const task of tasks.unwrap()) {
            expect(task.state).toBe('FAILED');
        }
    }));
    it('should cancel terminated tasks', () => __awaiter(void 0, void 0, void 0, function* () {
        const groupKey = nanoid();
        const mockAbort = vi.fn((_taskId) => { });
        const mockProcess = vi.fn((task) => __awaiter(void 0, void 0, void 0, function* () {
            let aborted = false;
            task.abortController.signal.onabort = () => {
                aborted = true;
                mockAbort(task.id);
            };
            yield new Promise((resolve) => setTimeout(resolve, 500));
            if (aborted) {
                return Err('Aborted');
            }
            return Ok({ foo: 'bar' });
        }));
        // Cancel all tasks after 100 ms
        const cancellingTimeout = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            const tasks = yield scheduler.searchTasks({ groupKey });
            for (const task of tasks.unwrap()) {
                yield scheduler.cancel({ taskId: task.id, reason: { message: 'Cancelling task' } });
            }
        }), 100);
        const n = 5;
        yield processN(mockProcess, groupKey, n);
        expect(mockProcess).toHaveBeenCalledTimes(n);
        const tasks = yield scheduler.searchTasks({ groupKey, state: 'CANCELLED' });
        for (const task of tasks.unwrap()) {
            expect(mockAbort).toHaveBeenCalledWith(task.id);
        }
        clearTimeout(cancellingTimeout);
    }));
}));
function processN(handler, groupKey, n) {
    return __awaiter(this, void 0, void 0, function* () {
        const processor = new OrchestratorProcessor({
            handler,
            opts: { orchestratorClient, groupKey, maxConcurrency: n, checkForTerminatedInterval: 100 }
        });
        processor.start({ tracer });
        for (let i = 0; i < n; i++) {
            yield immediateTask({ groupKey });
        }
        // Wait so the processor can process all tasks
        yield new Promise((resolve) => setTimeout(resolve, 1000));
        return processor;
    });
}
function immediateTask({ groupKey }) {
    return __awaiter(this, void 0, void 0, function* () {
        return scheduler.immediate({
            groupKey,
            name: nanoid(),
            retryMax: 0,
            retryCount: 0,
            createdToStartedTimeoutSecs: 30,
            startedToCompletedTimeoutSecs: 30,
            heartbeatTimeoutSecs: 30,
            payload: {
                type: 'action',
                activityLogId: 1234,
                actionName: 'Task',
                connection: {
                    id: 1234,
                    connection_id: 'C',
                    provider_config_key: 'P',
                    environment_id: 5678
                },
                input: { foo: 'bar' }
            }
        });
    });
}
//# sourceMappingURL=processor.integration.test.js.map