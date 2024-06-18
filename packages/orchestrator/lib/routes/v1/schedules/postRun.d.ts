import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
declare const path = '/v1/schedules/run';
declare const method = 'POST';
export declare type PostScheduleRun = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        scheduleName: string;
    };
    Error: ApiError<'recurring_run_failed'>;
    Success: {
        scheduleId: string;
    };
}>;
export declare const route: Route<PostScheduleRun>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PostScheduleRun>;
export {};
