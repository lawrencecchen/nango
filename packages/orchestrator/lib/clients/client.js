var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Ok, Err, routeFetch, stringifyError, getLogger } from '@nangohq/utils';
import { route as postImmediateRoute } from '../routes/v1/postImmediate.js';
import { route as postRecurringRoute } from '../routes/v1/postRecurring.js';
import { route as putRecurringRoute } from '../routes/v1/putRecurring.js';
import { route as postScheduleRunRoute } from '../routes/v1/schedules/postRun.js';
import { route as postDequeueRoute } from '../routes/v1/postDequeue.js';
import { route as postTasksSearchRoute } from '../routes/v1/tasks/postSearch.js';
import { route as postSchedulesSearchRoute } from '../routes/v1/schedules/postSearch.js';
import { route as getOutputRoute } from '../routes/v1/tasks/taskId/getOutput.js';
import { route as putTaskRoute } from '../routes/v1/tasks/putTaskId.js';
import { route as postHeartbeatRoute } from '../routes/v1/tasks/taskId/postHeartbeat.js';
import { validateTask, validateSchedule } from './validate.js';
const logger = getLogger('orchestrator.client');
export class OrchestratorClient {
    constructor({ baseUrl }) {
        this.baseUrl = baseUrl;
    }
    routeFetch(route) {
        return routeFetch(this.baseUrl, route);
    }
    immediate(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(postImmediateRoute)({
                body: {
                    name: props.name,
                    groupKey: props.groupKey,
                    retry: props.retry,
                    timeoutSettingsInSecs: props.timeoutSettingsInSecs,
                    args: props.args
                }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error scheduling  immediate task`,
                    payload: props
                });
            }
            else {
                return Ok(res);
            }
        });
    }
    recurring(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(postRecurringRoute)({
                body: {
                    name: props.name,
                    state: props.state,
                    startsAt: props.startsAt,
                    frequencyMs: props.frequencyMs,
                    groupKey: props.groupKey,
                    retry: props.retry,
                    timeoutSettingsInSecs: props.timeoutSettingsInSecs,
                    args: props.args
                }
            });
            if ('error' in res) {
                const startsAt = props.startsAt.toISOString();
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error creating recurring schedule`,
                    payload: Object.assign(Object.assign({}, props), { startsAt })
                });
            }
            else {
                return Ok(res);
            }
        });
    }
    pauseSync({ scheduleName }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setSyncState({ scheduleName, state: 'PAUSED' });
        });
    }
    unpauseSync({ scheduleName }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setSyncState({ scheduleName, state: 'STARTED' });
        });
    }
    deleteSync({ scheduleName }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setSyncState({ scheduleName, state: 'DELETED' });
        });
    }
    setSyncState({ scheduleName, state }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(putRecurringRoute)({
                body: { schedule: { name: scheduleName, state } }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error setting schedule state`,
                    payload: { scheduleName, state }
                });
            }
            else {
                return Ok(undefined);
            }
        });
    }
    updateSyncFrequency({ scheduleName, frequencyMs }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(putRecurringRoute)({
                body: { schedule: { name: scheduleName, frequencyMs } }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error updateing schedule frequency`,
                    payload: { scheduleName, frequencyMs }
                });
            }
            else {
                return Ok(undefined);
            }
        });
    }
    executeSync(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(postScheduleRunRoute)({
                body: {
                    scheduleName: props.scheduleName
                }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error creating recurring schedule`,
                    payload: props
                });
            }
            else {
                return Ok(undefined);
            }
        });
    }
    execute(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const scheduleProps = Object.assign({ retry: { count: 0, max: 0 }, timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 } }, props);
            const res = yield this.immediate(scheduleProps);
            if (res.isErr()) {
                return res;
            }
            const taskId = res.value.taskId;
            const getOutput = yield this.routeFetch(getOutputRoute)({ params: { taskId }, query: { longPolling: true } });
            if ('error' in getOutput) {
                return Err({
                    name: getOutput.error.code,
                    message: getOutput.error.message || `Error fetching task '${taskId}' output`,
                    payload: {}
                });
            }
            else {
                switch (getOutput.state) {
                    case 'CREATED':
                    case 'STARTED':
                        return Err({
                            name: 'task_in_progress_error',
                            message: `Task ${taskId} is in progress`,
                            payload: getOutput.output
                        });
                    case 'SUCCEEDED':
                        return Ok(getOutput.output);
                    case 'FAILED':
                        return Err({
                            name: 'task_failed_error',
                            message: `Task ${taskId} failed`,
                            payload: getOutput.output
                        });
                    case 'EXPIRED':
                        return Err({
                            name: 'task_expired_error',
                            message: `Task ${taskId} expired`,
                            payload: getOutput.output
                        });
                    case 'CANCELLED':
                        return Err({
                            name: 'task_cancelled_error',
                            message: `Task ${taskId} cancelled`,
                            payload: getOutput.output
                        });
                }
            }
        });
    }
    executeAction(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const { args } = props, rest = __rest(props, ["args"]);
            const schedulingProps = Object.assign(Object.assign({}, rest), { timeoutSettingsInSecs: {
                    createdToStarted: 30,
                    startedToCompleted: 15 * 60,
                    heartbeat: 999999 // actions don't need to heartbeat
                }, args: Object.assign(Object.assign({}, args), { type: 'action' }) });
            return this.execute(schedulingProps);
        });
    }
    executeWebhook(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const { args } = props, rest = __rest(props, ["args"]);
            const schedulingProps = Object.assign(Object.assign({}, rest), { timeoutSettingsInSecs: {
                    createdToStarted: 30,
                    startedToCompleted: 15 * 60,
                    heartbeat: 999999 // webhooks don't need to heartbeat
                }, args: Object.assign(Object.assign({}, args), { type: 'webhook' }) });
            return this.execute(schedulingProps);
        });
    }
    executePostConnection(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const { args } = props, rest = __rest(props, ["args"]);
            const schedulingProps = Object.assign(Object.assign({}, rest), { args: Object.assign(Object.assign({}, args), { type: 'post-connection-script' }) });
            return this.execute(schedulingProps);
        });
    }
    searchTasks({ ids, groupKey, limit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = Object.assign(Object.assign(Object.assign({}, (ids ? { ids } : {})), (groupKey ? { groupKey } : {})), (limit ? { limit } : {}));
            const res = yield this.routeFetch(postTasksSearchRoute)({ body });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error listing tasks`,
                    payload: body
                });
            }
            else {
                const tasks = res.flatMap((task) => {
                    const validated = validateTask(task);
                    if (validated.isErr()) {
                        logger.error(`Search: error validating task: ${validated.error.message}`);
                        return [];
                    }
                    return [validated.value];
                });
                return Ok(tasks);
            }
        });
    }
    searchSchedules({ scheduleNames, limit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(postSchedulesSearchRoute)({
                body: { names: scheduleNames, limit }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error listing schedules`,
                    payload: { scheduleNames }
                });
            }
            else {
                const schedule = res.flatMap((schedule) => {
                    const validated = validateSchedule(schedule);
                    if (validated.isErr()) {
                        logger.error(`search: error validating schedule: ${validated.error.message}`);
                        return [];
                    }
                    return [validated.value];
                });
                return Ok(schedule);
            }
        });
    }
    dequeue({ groupKey, limit, longPolling }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(postDequeueRoute)({
                body: {
                    groupKey,
                    limit,
                    longPolling
                }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error dequeueing tasks`,
                    payload: { groupKey, limit }
                });
            }
            else {
                const dequeuedTasks = res.flatMap((task) => {
                    const validated = validateTask(task);
                    if (validated.isErr()) {
                        logger.error(`Dequeue: error validating task: ${validated.error.message}`);
                        return [];
                    }
                    return [validated.value];
                });
                return Ok(dequeuedTasks);
            }
        });
    }
    heartbeat({ taskId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(postHeartbeatRoute)({
                params: { taskId }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error heartbeating task '${taskId}'`,
                    payload: { taskId }
                });
            }
            else {
                return Ok(undefined);
            }
        });
    }
    succeed({ taskId, output }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(putTaskRoute)({
                params: { taskId },
                body: { output, state: 'SUCCEEDED' }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error succeeding task '${taskId}'`,
                    payload: { taskId, output }
                });
            }
            else {
                return validateTask(res).mapError((err) => ({
                    name: 'succeed_failed',
                    message: `Failed to mark task ${taskId} as succeeded: ${stringifyError(err)}`,
                    payload: { taskId, output }
                }));
            }
        });
    }
    failed({ taskId, error }) {
        return __awaiter(this, void 0, void 0, function* () {
            const output = { name: error.name, message: error.message };
            const res = yield this.routeFetch(putTaskRoute)({
                params: { taskId },
                body: { output, state: 'FAILED' }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error failing task '${taskId}'`,
                    payload: { taskId, error: output }
                });
            }
            else {
                return validateTask(res).mapError((err) => ({
                    name: 'failed_failed',
                    message: `Failed to mark task ${taskId} as failed: ${stringifyError(err)}`,
                    payload: { taskId, error: output }
                }));
            }
        });
    }
    cancel({ taskId, reason }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.routeFetch(putTaskRoute)({
                params: { taskId },
                body: { output: reason, state: 'CANCELLED' }
            });
            if ('error' in res) {
                return Err({
                    name: res.error.code,
                    message: res.error.message || `Error cancelling task '${taskId}'`,
                    payload: { taskId, error: reason }
                });
            }
            else {
                return validateTask(res).mapError((err) => ({
                    name: 'cacel_failed',
                    message: `Failed to mark task ${taskId} as cancelled: ${stringifyError(err)}`,
                    payload: { taskId, error: reason }
                }));
            }
        });
    }
}
//# sourceMappingURL=client.js.map