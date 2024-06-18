import type { JsonValue } from 'type-fest';
import type { Result } from '@nangohq/utils';

import type { Task, TaskState, Schedule, ScheduleProps, ImmediateProps, ScheduleState } from './types.js';
import type { DatabaseClient } from './db/client.js';
export declare class Scheduler {
    private monitor;
    private scheduling;
    private onCallbacks;
    private dbClient;
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
    constructor({ dbClient, on }: { dbClient: DatabaseClient; on: Record<TaskState, (task: Task) => void> });
    stop(): void;
    /**
     * Get a task
     * @param taskId - Task ID
     * @example
     * const task = await scheduler.get({ taskId: '00000000-0000-0000-0000-000000000000' });
     */
    get({ taskId }: { taskId: string }): Promise<Result<Task>>;
    /**
     * Search tasks
     * @param params
     * @param params.ids - Task IDs
     * @param params.groupKey - Group key
     * @param params.state - Task state
     * @example
     * const tasks = await scheduler.search({ groupKey: 'test', state: 'CREATED' });
     */
    searchTasks(params?: { ids?: string[]; groupKey?: string; state?: TaskState; scheduleId?: string; limit?: number }): Promise<Result<Task[]>>;
    /**
     * Search schedules
     * @param params
     * @param params.names - Schedule names
     * @example
     * const tasks = await scheduler.searchSchedules({ names: ['scheduleA'] });
     */
    searchSchedules(params: { id?: string; names?: string[]; state?: ScheduleState; limit: number; forUpdate?: boolean }): Promise<Result<Schedule[]>>;
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
    immediate(
        props:
            | ImmediateProps
            | {
                  scheduleName: string;
              }
    ): Promise<Result<Task>>;
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
    recurring(props: ScheduleProps): Promise<Result<Schedule>>;
    /**
     * Dequeue tasks
     * @param groupKey - Group key
     * @param limit - Limit
     * @returns Task[]
     * @example
     * const dequeued = await scheduler.dequeue({ groupKey: 'test', limit: 1 });
     */
    dequeue({ groupKey, limit }: { groupKey: string; limit: number }): Promise<Result<Task[]>>;
    /**
     * Task Heartbeat
     * @param taskId - Task ID
     * @returns Task
     * @example
     * const heartbeat = await scheduler.heartbeat({ taskId: 'test' });
     */
    heartbeat({ taskId }: { taskId: string }): Promise<Result<Task>>;
    /**
     * Mark task as Succeeded
     * @param taskId - Task ID
     * @param output - Output
     * @returns Task
     * @example
     * const succeed = await scheduler.succeed({ taskId: '00000000-0000-0000-0000-000000000000', output: {foo: 'bar'} });
     */
    succeed({ taskId, output }: { taskId: string; output: JsonValue }): Promise<Result<Task>>;
    /**
     * Fail a task
     * @param taskId - Task ID
     * @param error - Json object representing the error
     * @returns Task
     * @example
     * const failed = await scheduler.fail({ taskId: '00000000-0000-0000-0000-000000000000', error: {message: 'error'});
     */
    fail({ taskId, error }: { taskId: string; error: JsonValue }): Promise<Result<Task>>;
    /**
     * Cancel a task
     * @param cancelBy - Cancel by task id
     * @param reason - Reason for cancellation
     * @returns Task
     * @example
     * const cancelled = await scheduler.cancel({ taskId: '00000000-0000-0000-0000-000000000000' });
     */
    cancel(cancelBy: { taskId: string; reason: JsonValue }): Promise<Result<Task>>;
    /**
     * Set schedule state
     * @param scheduleName - Schedule name
     * @param state - Schedule state
     * @notes Cancels all running tasks if the schedule is paused or deleted
     * @returns Schedule
     * @example
     * const schedule = await scheduler.setScheduleState({ scheduleName: 'schedule123', state: 'PAUSED' });
     */
    setScheduleState({ scheduleName, state }: { scheduleName: string; state: ScheduleState }): Promise<Result<Schedule>>;
    /**
     * Set schedule frequency
     * @param scheduleName - Schedule name
     * @param frequencyMs - Frequency in milliseconds
     * @returns Schedule
     * @example
     * const schedule = await scheduler.setScheduleFrequency({ scheduleName: 'schedule123', frequencyMs: 600_000 });
     */
    setScheduleFrequency({ scheduleName, frequencyMs }: { scheduleName: string; frequencyMs: number }): Promise<Result<Schedule>>;
}
