import type { JsonValue, SetOptional } from 'type-fest';
import type { Result } from '@nangohq/utils';
import type { ScheduleState, TaskState } from '@nangohq/scheduler';

import type { PostImmediate } from '../routes/v1/postImmediate.js';
import type { PostRecurring } from '../routes/v1/postRecurring.js';
import type { PostScheduleRun } from '../routes/v1/schedules/postRun.js';
export declare type ImmediateProps = PostImmediate['Body'];
export declare type RecurringProps = PostRecurring['Body'];
interface SyncArgs {
    syncId: string;
    syncName: string;
    debug: boolean;
    connection: {
        id: number;
        provider_config_key: string;
        environment_id: number;
        connection_id: string;
    };
}
interface ActionArgs {
    actionName: string;
    connection: {
        id: number;
        provider_config_key: string;
        environment_id: number;
        connection_id: string;
    };
    activityLogId: number;
    input: JsonValue;
}
interface WebhookArgs {
    webhookName: string;
    parentSyncName: string;
    connection: {
        id: number;
        connection_id: string;
        provider_config_key: string;
        environment_id: number;
    };
    activityLogId: number;
    input: JsonValue;
}
interface PostConnectionArgs {
    postConnectionName: string;
    connection: {
        id: number;
        connection_id: string;
        provider_config_key: string;
        environment_id: number;
    };
    fileLocation: string;
    activityLogId: number;
}
export declare type SchedulesReturn = Result<OrchestratorSchedule[]>;
export declare type VoidReturn = Result<void, ClientError>;
export declare type ExecuteProps = SetOptional<ImmediateProps, 'retry' | 'timeoutSettingsInSecs'>;
export declare type ExecuteReturn = Result<JsonValue, ClientError>;
export declare type ExecuteActionProps = Omit<ExecuteProps, 'args'> & {
    args: ActionArgs;
};
export declare type ExecuteWebhookProps = Omit<ExecuteProps, 'args'> & {
    args: WebhookArgs;
};
export declare type ExecutePostConnectionProps = Omit<ExecuteProps, 'args'> & {
    args: PostConnectionArgs;
};
export declare type ExecuteSyncProps = PostScheduleRun['Body'];
export interface OrchestratorSchedule {
    id: string;
    name: string;
    frequencyMs: number;
    state: ScheduleState;
    nextDueDate: Date;
}
export declare type OrchestratorTask = TaskSync | TaskAction | TaskWebhook | TaskPostConnection;
interface TaskCommonFields {
    id: string;
    name: string;
    state: TaskState;
    attempt: number;
}
interface TaskCommon extends TaskCommonFields {
    isSync(this: OrchestratorTask): this is TaskSync;
    isWebhook(this: OrchestratorTask): this is TaskWebhook;
    isAction(this: OrchestratorTask): this is TaskAction;
    isPostConnection(this: OrchestratorTask): this is TaskPostConnection;
    abortController: AbortController;
}
export interface TaskSync extends TaskCommon, SyncArgs {}
export declare function TaskSync(props: TaskCommonFields & SyncArgs): TaskSync;
export interface TaskAction extends TaskCommon, ActionArgs {}
export declare function TaskAction(props: TaskCommonFields & ActionArgs): TaskAction;
export interface TaskWebhook extends TaskCommon, WebhookArgs {}
export declare function TaskWebhook(props: TaskCommonFields & WebhookArgs): TaskWebhook;
export interface TaskPostConnection extends TaskCommon, PostConnectionArgs {}
export declare function TaskPostConnection(props: TaskCommonFields & PostConnectionArgs): TaskPostConnection;
export interface ClientError extends Error {
    name: string;
    payload: JsonValue;
}
export {};
