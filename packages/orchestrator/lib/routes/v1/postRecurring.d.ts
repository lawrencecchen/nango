import type { JsonValue } from 'type-fest';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';

import type { TaskType } from '../../types.js';
declare const path = '/v1/recurring';
declare const method = 'POST';
export declare type PostRecurring = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        name: string;
        state: 'STARTED' | 'PAUSED';
        startsAt: Date;
        frequencyMs: number;
        groupKey: string;
        retry: {
            max: number;
        };
        timeoutSettingsInSecs: {
            createdToStarted: number;
            startedToCompleted: number;
            heartbeat: number;
        };
        args: JsonValue & {
            type: TaskType;
        };
    };
    Error: ApiError<'recurring_failed'>;
    Success: {
        scheduleId: string;
    };
}>;
export declare const route: Route<PostRecurring>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PostRecurring>;
export {};
