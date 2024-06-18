import type { Task } from '@nangohq/scheduler';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
declare const path = '/v1/tasks/search';
declare const method = 'POST';
declare type PostSearch = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        ids?: string[] | undefined;
        groupKey?: string | undefined;
        limit?: number | undefined;
    };
    Error: ApiError<'search_failed'>;
    Success: Task[];
}>;
export declare const route: Route<PostSearch>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PostSearch>;
export {};
