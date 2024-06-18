import type { JsonValue } from 'type-fest';
import type { TaskState } from '@nangohq/scheduler';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
import type { EventEmitter } from 'node:events';
declare type GetOutput = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Params: {
        taskId: string;
    };
    Querystring: {
        longPolling?: boolean;
    };
    Error: ApiError<'task_not_found'>;
    Success: {
        state: TaskState;
        output: JsonValue;
    };
}>;
declare const path = '/v1/tasks/:taskId/output';
declare const method = 'GET';
export declare const route: Route<GetOutput>;
export declare const routeHandler: (scheduler: Scheduler, eventEmmiter: EventEmitter) => RouteHandler<GetOutput>;
export {};
