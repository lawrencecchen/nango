import type { Result, Route } from '@nangohq/utils';
import { Ok, Err, routeFetch, stringifyError, getLogger } from '@nangohq/utils';
import type { Endpoint } from '@nangohq/types';
import type { JsonValue } from 'type-fest';

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
import type {
    ClientError,
    ImmediateProps,
    ExecuteActionProps,
    ExecuteProps,
    ExecuteReturn,
    ExecuteWebhookProps,
    ExecutePostConnectionProps,
    OrchestratorTask,
    RecurringProps,
    ExecuteSyncProps,
    VoidReturn,
    SchedulesReturn
} from './types.js';
import { validateTask, validateSchedule } from './validate.js';

const logger = getLogger('orchestrator.client');

export class OrchestratorClient {
    private baseUrl: string;

    constructor({ baseUrl }: { baseUrl: string }) {
        this.baseUrl = baseUrl;
    }

    private routeFetch<E extends Endpoint<any>>(route: Route<E>) {
        return routeFetch(this.baseUrl, route);
    }

    public async immediate(props: ImmediateProps): Promise<Result<{ taskId: string }, ClientError>> {
        const res = await this.routeFetch(postImmediateRoute)({
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
        } else {
            return Ok(res);
        }
    }

    public async recurring(props: RecurringProps): Promise<Result<{ scheduleId: string }, ClientError>> {
        const res = await this.routeFetch(postRecurringRoute)({
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
                payload: { ...props, startsAt }
            });
        } else {
            return Ok(res);
        }
    }

    public async pauseSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn> {
        return this.setSyncState({ scheduleName, state: 'PAUSED' });
    }

    public async unpauseSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn> {
        return this.setSyncState({ scheduleName, state: 'STARTED' });
    }

    public async deleteSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn> {
        return this.setSyncState({ scheduleName, state: 'DELETED' });
    }

    private async setSyncState({ scheduleName, state }: { scheduleName: string; state: 'STARTED' | 'PAUSED' | 'DELETED' }): Promise<VoidReturn> {
        const res = await this.routeFetch(putRecurringRoute)({
            body: { schedule: { name: scheduleName, state } }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error setting schedule state`,
                payload: { scheduleName, state }
            });
        } else {
            return Ok(undefined);
        }
    }

    public async updateSyncFrequency({ scheduleName, frequencyMs }: { scheduleName: string; frequencyMs: number }): Promise<VoidReturn> {
        const res = await this.routeFetch(putRecurringRoute)({
            body: { schedule: { name: scheduleName, frequencyMs } }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error updateing schedule frequency`,
                payload: { scheduleName, frequencyMs }
            });
        } else {
            return Ok(undefined);
        }
    }

    public async executeSync(props: ExecuteSyncProps): Promise<VoidReturn> {
        const res = await this.routeFetch(postScheduleRunRoute)({
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
        } else {
            return Ok(undefined);
        }
    }

    private async execute(props: ExecuteProps): Promise<ExecuteReturn> {
        const scheduleProps = {
            retry: { count: 0, max: 0 },
            timeoutSettingsInSecs: { createdToStarted: 30, startedToCompleted: 30, heartbeat: 60 },
            ...props
        } as ImmediateProps;
        const res = await this.immediate(scheduleProps);
        if (res.isErr()) {
            return res;
        }
        const taskId = res.value.taskId;
        const getOutput = await this.routeFetch(getOutputRoute)({ params: { taskId }, query: { longPolling: true } });
        if ('error' in getOutput) {
            return Err({
                name: getOutput.error.code,
                message: getOutput.error.message || `Error fetching task '${taskId}' output`,
                payload: {}
            });
        } else {
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
    }

    public async executeAction(props: ExecuteActionProps): Promise<ExecuteReturn> {
        const { args, ...rest } = props;
        const schedulingProps = {
            ...rest,
            timeoutSettingsInSecs: {
                createdToStarted: 30,
                startedToCompleted: 15 * 60,
                heartbeat: 999999 // actions don't need to heartbeat
            },
            args: {
                ...args,
                type: 'action' as const
            }
        };
        return this.execute(schedulingProps);
    }

    public async executeWebhook(props: ExecuteWebhookProps): Promise<ExecuteReturn> {
        const { args, ...rest } = props;
        const schedulingProps = {
            ...rest,
            timeoutSettingsInSecs: {
                createdToStarted: 30,
                startedToCompleted: 15 * 60,
                heartbeat: 999999 // webhooks don't need to heartbeat
            },
            args: {
                ...args,
                type: 'webhook' as const
            }
        };
        return this.execute(schedulingProps);
    }

    public async executePostConnection(props: ExecutePostConnectionProps): Promise<ExecuteReturn> {
        const { args, ...rest } = props;
        const schedulingProps = {
            ...rest,
            args: {
                ...args,
                type: 'post-connection-script' as const
            }
        };
        return this.execute(schedulingProps);
    }
    public async searchTasks({
        ids,
        groupKey,
        limit
    }: {
        ids?: string[];
        groupKey?: string;
        limit?: number;
    }): Promise<Result<OrchestratorTask[], ClientError>> {
        const body = {
            ...(ids ? { ids } : {}),
            ...(groupKey ? { groupKey } : {}),
            ...(limit ? { limit } : {})
        };
        const res = await this.routeFetch(postTasksSearchRoute)({ body });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error listing tasks`,
                payload: body
            });
        } else {
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
    }

    public async searchSchedules({ scheduleNames, limit }: { scheduleNames: string[]; limit: number }): Promise<SchedulesReturn> {
        const res = await this.routeFetch(postSchedulesSearchRoute)({
            body: { names: scheduleNames, limit }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error listing schedules`,
                payload: { scheduleNames }
            });
        } else {
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
    }

    public async dequeue({
        groupKey,
        limit,
        longPolling
    }: {
        groupKey: string;
        limit: number;
        longPolling: boolean;
    }): Promise<Result<OrchestratorTask[], ClientError>> {
        const res = await this.routeFetch(postDequeueRoute)({
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
        } else {
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
    }

    public async heartbeat({ taskId }: { taskId: string }): Promise<Result<void, ClientError>> {
        const res = await this.routeFetch(postHeartbeatRoute)({
            params: { taskId }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error heartbeating task '${taskId}'`,
                payload: { taskId }
            });
        } else {
            return Ok(undefined);
        }
    }

    public async succeed({ taskId, output }: { taskId: string; output: JsonValue }): Promise<Result<OrchestratorTask, ClientError>> {
        const res = await this.routeFetch(putTaskRoute)({
            params: { taskId },
            body: { output, state: 'SUCCEEDED' }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error succeeding task '${taskId}'`,
                payload: { taskId, output }
            });
        } else {
            return validateTask(res).mapError((err) => ({
                name: 'succeed_failed',
                message: `Failed to mark task ${taskId} as succeeded: ${stringifyError(err)}`,
                payload: { taskId, output }
            }));
        }
    }

    public async failed({ taskId, error }: { taskId: string; error: Error }): Promise<Result<OrchestratorTask, ClientError>> {
        const output = { name: error.name, message: error.message };
        const res = await this.routeFetch(putTaskRoute)({
            params: { taskId },
            body: { output, state: 'FAILED' }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error failing task '${taskId}'`,
                payload: { taskId, error: output }
            });
        } else {
            return validateTask(res).mapError((err) => ({
                name: 'failed_failed',
                message: `Failed to mark task ${taskId} as failed: ${stringifyError(err)}`,
                payload: { taskId, error: output }
            }));
        }
    }

    public async cancel({ taskId, reason }: { taskId: string; reason: string }): Promise<Result<OrchestratorTask, ClientError>> {
        const res = await this.routeFetch(putTaskRoute)({
            params: { taskId },
            body: { output: reason, state: 'CANCELLED' }
        });
        if ('error' in res) {
            return Err({
                name: res.error.code,
                message: res.error.message || `Error cancelling task '${taskId}'`,
                payload: { taskId, error: reason }
            });
        } else {
            return validateTask(res).mapError((err) => ({
                name: 'cacel_failed',
                message: `Failed to mark task ${taskId} as cancelled: ${stringifyError(err)}`,
                payload: { taskId, error: reason }
            }));
        }
    }
}
