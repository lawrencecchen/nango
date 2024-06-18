import type { Schedule } from '@nangohq/scheduler';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
declare const path = '/v1/schedules/search';
declare const method = 'POST';
declare type PostSearch = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        names?: string[] | undefined;
        limit: number;
    };
    Error: ApiError<'search_failed'>;
    Success: Schedule[];
}>;
export declare const route: Route<PostSearch>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PostSearch>;
export {};
