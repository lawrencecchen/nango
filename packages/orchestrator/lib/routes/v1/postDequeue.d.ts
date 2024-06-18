import type { Task } from '@nangohq/scheduler';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
import type EventEmitter from 'node:events';
declare const path = '/v1/dequeue';
declare const method = 'POST';
declare type PostDequeue = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        groupKey: string;
        limit: number;
        longPolling: boolean;
    };
    Error: ApiError<'dequeue_failed'>;
    Success: Task[];
}>;
export declare const route: Route<PostDequeue>;
export declare const routeHandler: (scheduler: Scheduler, eventEmitter: EventEmitter) => RouteHandler<PostDequeue>;
export {};
