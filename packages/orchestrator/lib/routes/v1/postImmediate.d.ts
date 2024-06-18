import type { JsonValue } from 'type-fest';
import type { ApiError, Endpoint } from '@nangohq/types';
import type { RouteHandler, Route } from '@nangohq/utils';

import type { TaskType } from '../../types.js';
declare const path = '/v1/immediate';
declare const method = 'POST';
export declare type PostImmediate = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Body: {
        name: string;
        groupKey: string;
        retry: {
            count: number;
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
    Error: ApiError<'immediate_failed'>;
    Success: {
        taskId: string;
    };
}>;
export declare const route: Route<PostImmediate>;
export declare const routeHandler: (scheduler: Scheduler) => RouteHandler<PostImmediate>;
export {};
