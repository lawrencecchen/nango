import type { Endpoint } from '@nangohq/types';
import type { RouteHandler } from '@nangohq/utils';
declare type Health = Endpoint<{
    Method: typeof method;
    Path: typeof path;
    Success: {
        status: 'ok';
    };
}>;
declare const path = '/health';
declare const method = 'GET';
export declare const routeHandler: RouteHandler<Health>;
export {};
