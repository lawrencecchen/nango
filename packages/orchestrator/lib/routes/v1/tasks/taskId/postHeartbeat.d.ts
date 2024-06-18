import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
declare const path = '/v1/tasks/:taskId/heartbeat';
declare const method = 'POST';
declare type PostHeartbeat = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Params: {
        taskId: string;
    };
    Error: ApiError<'post_heartbeat_failed'>;
    Success: never;
}>;
export declare const route: Route<PostHeartbeat>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PostHeartbeat>;
export {};
