import type { JsonValue } from 'type-fest';
import type { Task } from '@nangohq/scheduler';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
declare type PutTask = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Params: {
        taskId: string;
    };
    Body: {
        output: JsonValue;
        state: 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    };
    Error: ApiError<'put_task_failed' | 'invalid_state'>;
    Success: Task;
}>;
declare const path = '/v1/tasks/:taskId';
declare const method = 'PUT';
export declare const route: Route<PutTask>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PutTask>;
export {};
