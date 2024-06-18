var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isMainThread } from 'node:worker_threads';
import { Err, Ok, stringifyError } from '@nangohq/utils';
import { uuidv7 } from 'uuidv7';
import * as tasks from './models/tasks.js';
import * as schedules from './models/schedules.js';
import { MonitorWorker } from './workers/monitor/monitor.worker.js';
import { SchedulingWorker } from './workers/scheduling/scheduling.worker.js';
import { logger } from './utils/logger.js';
export class Scheduler {
    /**
     * Scheduler
     * @constructor
     * @param on - Callbacks for task state transitions
     * @returns Scheduler
     * @example
     * const scheduler = new Scheduler({
     *    on: {
     *        CREATED: (task: Task) => console.log(`Task ${task.id} created`),
     *        STARTED: (task: Task) => console.log(`Task ${task.id} started`),
     *        SUCCEEDED: (task: Task) => console.log(`Task ${task.id} succeeded`),
     *        FAILED: (task: Task) => console.log(`Task ${task.id} failed`),
     *        EXPIRED: (task: Task) => console.log(`Task ${task.id} expired`),
     *        CANCELLED: (task: Task) => console.log(`Task ${task.id} cancelled`)
     *    }
     * });
     */
    constructor({ dbClient, on }) {
        this.monitor = null;
        this.scheduling = null;
        if (isMainThread) {
            this.onCallbacks = on;
            this.dbClient = dbClient;
            this.monitor = new MonitorWorker({ databaseUrl: dbClient.url, databaseSchema: dbClient.schema });
            this.monitor.on((message) => __awaiter(this, void 0, void 0, function* () {
                const { ids } = message;
                const fetched = yield tasks.search(this.dbClient.db, { ids, limit: ids.length });
                if (fetched.isErr()) {
                    logger.error(`Error fetching tasks expired by monitor: ${stringifyError(fetched.error)}`);
                    return;
                }
                for (const task of fetched.value) {
                    this.onCallbacks[task.state](task);
                }
            }));
            this.monitor.start();
            this.scheduling = new SchedulingWorker({ databaseUrl: dbClient.url, databaseSchema: dbClient.schema });
            this.scheduling.on((message) => __awaiter(this, void 0, void 0, function* () {
                const { ids } = message;
                const fetched = yield tasks.search(this.dbClient.db, { ids, limit: ids.length });
                if (fetched.isErr()) {
                    logger.error(`Error fetching tasks created by scheduling: ${stringifyError(fetched.error)}`);
                    return;
                }
                for (const task of fetched.value) {
                    this.onCallbacks[task.state](task);
                }
            }));
            // TODO: ensure there is only one instance of the scheduler
            this.scheduling.start();
        }
        else {
            throw new Error('Scheduler must be instantiated in the main thread');
        }
    }
    stop() {
        var _a, _b;
        (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = this.scheduling) === null || _b === void 0 ? void 0 : _b.stop();
    }
    /**
     * Get a task
     * @param taskId - Task ID
     * @example
     * const task = await scheduler.get({ taskId: '00000000-0000-0000-0000-000000000000' });
     */
    get({ taskId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return tasks.get(this.dbClient.db, taskId);
        });
    }
    /**
     * Search tasks
     * @param params
     * @param params.ids - Task IDs
     * @param params.groupKey - Group key
     * @param params.state - Task state
     * @example
     * const tasks = await scheduler.search({ groupKey: 'test', state: 'CREATED' });
     */
    searchTasks(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return tasks.search(this.dbClient.db, params);
        });
    }
    /**
     * Search schedules
     * @param params
     * @param params.names - Schedule names
     * @example
     * const tasks = await scheduler.searchSchedules({ names: ['scheduleA'] });
     */
    searchSchedules(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return schedules.search(this.dbClient.db, params);
        });
    }
    /**
     * Schedule a task immediately
     * @param props - Scheduling properties or schedule name
     * @returns Task
     * @example
     * const schedulingProps = {
     *         name: 'myName',
     *         payload: {foo: 'bar'},
     *         groupKey: 'myGroupKey',
     *         retryMax: 1,
     *         retryCount: 0,
     *         createdToStartedTimeoutSecs: 1,
     *         startedToCompletedTimeoutSecs: 1,
     *         heartbeatTimeoutSecs: 1
     * };
     * const scheduled = await scheduler.immediate(schedulingProps);
     */
    immediate(props) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dbClient.db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                let taskProps;
                if ('scheduleName' in props) {
                    // forUpdate = true so that the schedule is locked to prevent any concurrent update or concurrent scheduling of tasks
                    const getSchedules = yield schedules.search(trx, { names: [props.scheduleName], limit: 1, forUpdate: true });
                    if (getSchedules.isErr()) {
                        return Err(getSchedules.error);
                    }
                    const schedule = getSchedules.value[0];
                    if (!schedule) {
                        return Err(new Error(`Schedule '${props.scheduleName}' not found`));
                    }
                    // Not scheduling a task if another task for the same schedule is already running
                    const running = yield tasks.search(trx, {
                        scheduleId: schedule.id,
                        states: ['CREATED', 'STARTED']
                    });
                    if (running.isErr()) {
                        return Err(running.error);
                    }
                    if (running.value.length > 0) {
                        return Err(new Error(`Task for schedule '${props.scheduleName}' is already running: ${(_a = running.value[0]) === null || _a === void 0 ? void 0 : _a.id}`));
                    }
                    taskProps = {
                        name: `${schedule.name}:${uuidv7()}`,
                        payload: schedule.payload,
                        groupKey: schedule.groupKey,
                        retryMax: schedule.retryMax,
                        retryCount: 0,
                        createdToStartedTimeoutSecs: schedule.createdToStartedTimeoutSecs,
                        startedToCompletedTimeoutSecs: schedule.startedToCompletedTimeoutSecs,
                        heartbeatTimeoutSecs: schedule.heartbeatTimeoutSecs,
                        startsAfter: new Date(),
                        scheduleId: schedule.id
                    };
                }
                else {
                    taskProps = Object.assign(Object.assign({}, props), { startsAfter: new Date(), scheduleId: null });
                }
                const created = yield tasks.create(trx, taskProps);
                if (created.isOk()) {
                    const task = created.value;
                    this.onCallbacks[task.state](task);
                }
                return created;
            }));
        });
    }
    /**
     * Create a recurring schedule
     * @param props - Schedule properties
     * @returns Schedule
     * @example
     * const schedulingProps = {
     *    name: 'schedule-name',
     *    startsAt: new Date(),
     *    frequencyMs: 300_00,
     *    payload: {foo: 'bar'}
     *    groupKey: 'myGroupKey',
     *    retryMax: 1,
     *    retryCount: 0,
     *    createdToStartedTimeoutSecs: 1,
     *    startedToCompletedTimeoutSecs: 1,
     *    heartbeatTimeoutSecs: 1
     * };
     * const schedule = await scheduler.recurring(schedulingProps);
     */
    recurring(props) {
        return __awaiter(this, void 0, void 0, function* () {
            return schedules.create(this.dbClient.db, props);
        });
    }
    /**
     * Dequeue tasks
     * @param groupKey - Group key
     * @param limit - Limit
     * @returns Task[]
     * @example
     * const dequeued = await scheduler.dequeue({ groupKey: 'test', limit: 1 });
     */
    dequeue({ groupKey, limit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const dequeued = yield tasks.dequeue(this.dbClient.db, { groupKey, limit });
            if (dequeued.isOk()) {
                dequeued.value.forEach((task) => this.onCallbacks[task.state](task));
            }
            return dequeued;
        });
    }
    /**
     * Task Heartbeat
     * @param taskId - Task ID
     * @returns Task
     * @example
     * const heartbeat = await scheduler.heartbeat({ taskId: 'test' });
     */
    heartbeat({ taskId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return tasks.heartbeat(this.dbClient.db, taskId);
        });
    }
    /**
     * Mark task as Succeeded
     * @param taskId - Task ID
     * @param output - Output
     * @returns Task
     * @example
     * const succeed = await scheduler.succeed({ taskId: '00000000-0000-0000-0000-000000000000', output: {foo: 'bar'} });
     */
    succeed({ taskId, output }) {
        return __awaiter(this, void 0, void 0, function* () {
            const succeeded = yield tasks.transitionState(this.dbClient.db, { taskId, newState: 'SUCCEEDED', output });
            if (succeeded.isOk()) {
                const task = succeeded.value;
                this.onCallbacks[task.state](task);
            }
            return succeeded;
        });
    }
    /**
     * Fail a task
     * @param taskId - Task ID
     * @param error - Json object representing the error
     * @returns Task
     * @example
     * const failed = await scheduler.fail({ taskId: '00000000-0000-0000-0000-000000000000', error: {message: 'error'});
     */
    fail({ taskId, error }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbClient.db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const task = yield tasks.get(trx, taskId);
                if (task.isErr()) {
                    return Err(`fail: Error fetching task '${taskId}': ${stringifyError(task.error)}`);
                }
                // if task is from a schedule,
                // lock the schedule to prevent concurrent update or scheduling of tasks
                // while we are potentially creating a new retry task
                if (task.value.scheduleId) {
                    yield schedules.search(trx, { id: task.value.scheduleId, limit: 1, forUpdate: true });
                }
                const failed = yield tasks.transitionState(trx, { taskId, newState: 'FAILED', output: error });
                if (failed.isOk()) {
                    const task = failed.value;
                    this.onCallbacks[task.state](task);
                    // Create a new task if the task is retryable
                    if (task.retryMax > task.retryCount) {
                        const taskProps = {
                            name: `${task.name}:${task.retryCount + 1}`,
                            payload: task.payload,
                            groupKey: task.groupKey,
                            retryMax: task.retryMax,
                            retryCount: task.retryCount + 1,
                            createdToStartedTimeoutSecs: task.createdToStartedTimeoutSecs,
                            startedToCompletedTimeoutSecs: task.startedToCompletedTimeoutSecs,
                            heartbeatTimeoutSecs: task.heartbeatTimeoutSecs
                        };
                        const res = yield this.immediate(taskProps);
                        if (res.isErr()) {
                            logger.error(`Error retrying task '${taskId}': ${stringifyError(res.error)}`);
                        }
                    }
                }
                return failed;
            }));
        });
    }
    /**
     * Cancel a task
     * @param cancelBy - Cancel by task id
     * @param reason - Reason for cancellation
     * @returns Task
     * @example
     * const cancelled = await scheduler.cancel({ taskId: '00000000-0000-0000-0000-000000000000' });
     */
    cancel(cancelBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const cancelled = yield tasks.transitionState(this.dbClient.db, {
                taskId: cancelBy.taskId,
                newState: 'CANCELLED',
                output: { reason: cancelBy.reason }
            });
            if (cancelled.isOk()) {
                const task = cancelled.value;
                this.onCallbacks[task.state](task);
            }
            return cancelled;
        });
    }
    /**
     * Set schedule state
     * @param scheduleName - Schedule name
     * @param state - Schedule state
     * @notes Cancels all running tasks if the schedule is paused or deleted
     * @returns Schedule
     * @example
     * const schedule = await scheduler.setScheduleState({ scheduleName: 'schedule123', state: 'PAUSED' });
     */
    setScheduleState({ scheduleName, state }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dbClient.db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                // forUpdate = true so that the schedule is locked to prevent any concurrent update or concurrent scheduling of tasks
                const found = yield schedules.search(trx, { names: [scheduleName], limit: 1, forUpdate: true });
                if (found.isErr()) {
                    return Err(found.error);
                }
                if (!found.value[0]) {
                    return Err(`Schedule '${scheduleName}' not found`);
                }
                const schedule = found.value[0];
                if (schedule.state === state) {
                    // No-op if the schedule is already in the desired state
                    return Ok(schedule);
                }
                const cancelledTasks = [];
                if (state === 'DELETED' || state === 'PAUSED') {
                    const runningTasks = yield tasks.search(trx, {
                        scheduleId: schedule.id,
                        states: ['CREATED', 'STARTED']
                    });
                    if (runningTasks.isErr()) {
                        return Err(`Error fetching tasks for schedule '${scheduleName}': ${stringifyError(runningTasks.error)}`);
                    }
                    for (const task of runningTasks.value) {
                        const t = yield tasks.transitionState(trx, { taskId: task.id, newState: 'CANCELLED', output: { reason: `schedule ${state}` } });
                        if (t.isErr()) {
                            return Err(`Error cancelling task '${task.id}': ${stringifyError(t.error)}`);
                        }
                        cancelledTasks.push(t.value);
                    }
                }
                const res = yield schedules.transitionState(trx, schedule.id, state);
                if (res.isErr()) {
                    return Err(`Error transitioning schedule '${scheduleName}': ${stringifyError(res.error)}`);
                }
                cancelledTasks.forEach((task) => this.onCallbacks[task.state](task));
                return res;
            }));
        });
    }
    /**
     * Set schedule frequency
     * @param scheduleName - Schedule name
     * @param frequencyMs - Frequency in milliseconds
     * @returns Schedule
     * @example
     * const schedule = await scheduler.setScheduleFrequency({ scheduleName: 'schedule123', frequencyMs: 600_000 });
     */
    setScheduleFrequency({ scheduleName, frequencyMs }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.dbClient.db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const schedule = yield schedules.search(trx, { names: [scheduleName], limit: 1, forUpdate: true });
                if (schedule.isErr()) {
                    return Err(schedule.error);
                }
                if (!schedule.value[0]) {
                    return Err(`Schedule '${scheduleName}' not found`);
                }
                const res = yield schedules.update(trx, { id: schedule.value[0].id, frequencyMs });
                if (res.isErr()) {
                    return Err(`Error updating schedule frequency '${scheduleName}': ${stringifyError(res.error)}`);
                }
                return res;
            }));
        });
    }
}
//# sourceMappingURL=scheduler.js.map