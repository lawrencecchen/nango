import type { JsonValue } from 'type-fest';
import type knex from 'knex';
import type { Result } from '@nangohq/utils';

import type { TaskState, Task, TaskTerminalState, TaskNonTerminalState } from '../types.js';
export declare const TASKS_TABLE = 'tasks';
export declare type TaskProps = Omit<Task, 'id' | 'createdAt' | 'state' | 'lastStateTransitionAt' | 'lastHeartbeatAt' | 'output' | 'terminated'>;
export declare const validTaskStateTransitions: readonly [
    {
        readonly from: 'CREATED';
        readonly to: 'STARTED';
    },
    {
        readonly from: 'CREATED';
        readonly to: 'CANCELLED';
    },
    {
        readonly from: 'CREATED';
        readonly to: 'EXPIRED';
    },
    {
        readonly from: 'STARTED';
        readonly to: 'SUCCEEDED';
    },
    {
        readonly from: 'STARTED';
        readonly to: 'FAILED';
    },
    {
        readonly from: 'STARTED';
        readonly to: 'CANCELLED';
    },
    {
        readonly from: 'STARTED';
        readonly to: 'EXPIRED';
    }
];
export declare type ValidTaskStateTransitions = (typeof validTaskStateTransitions)[number];
export interface DbTask {
    readonly id: string;
    readonly name: string;
    readonly payload: JsonValue;
    readonly group_key: string;
    readonly retry_max: number;
    readonly retry_count: number;
    readonly starts_after: Date;
    readonly created_to_started_timeout_secs: number;
    readonly started_to_completed_timeout_secs: number;
    readonly heartbeat_timeout_secs: number;
    readonly created_at: Date;
    state: TaskState;
    last_state_transition_at: Date;
    last_heartbeat_at: Date;
    output: JsonValue | null;
    terminated: boolean;
    readonly schedule_id: string | null;
}
export declare const DbTask: {
    to: (task: Task) => DbTask;
    from: (dbTask: DbTask) => Task;
};
export declare function create(db: knex.Knex, taskProps: TaskProps): Promise<Result<Task>>;
export declare function get(db: knex.Knex, taskId: string): Promise<Result<Task>>;
export declare function search(
    db: knex.Knex,
    params?: {
        ids?: string[];
        groupKey?: string;
        states?: TaskState[];
        scheduleId?: string;
        limit?: number;
    }
): Promise<Result<Task[]>>;
export declare function heartbeat(db: knex.Knex, taskId: string): Promise<Result<Task>>;
export declare function transitionState(
    db: knex.Knex,
    props:
        | {
              taskId: string;
              newState: TaskTerminalState;
              output: JsonValue;
          }
        | {
              taskId: string;
              newState: TaskNonTerminalState;
          }
): Promise<Result<Task>>;
export declare function dequeue(
    db: knex.Knex,
    {
        groupKey,
        limit
    }: {
        groupKey: string;
        limit: number;
    }
): Promise<Result<Task[]>>;
export declare function expiresIfTimeout(db: knex.Knex): Promise<Result<Task[]>>;
