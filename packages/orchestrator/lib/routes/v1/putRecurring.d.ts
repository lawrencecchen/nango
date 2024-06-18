import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';
declare const path = '/v1/recurring';
declare const method = 'PUT';
export declare type PutRecurring = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        schedule:
            | {
                  name: string;
                  state: 'STARTED' | 'PAUSED' | 'DELETED';
              }
            | {
                  name: string;
                  frequencyMs: number;
              };
    };
    Error: ApiError<'put_recurring_failed'>;
    Success: {
        scheduleId: string;
    };
}>;
export declare const route: Route<PutRecurring>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PutRecurring>;
export {};
