/// <reference types="node" resolution-mode="require"/>
import type { Server } from 'node:http';
import type { APIEndpointsPicker, APIEndpointsPickerWithPath, ApiError } from '@nangohq/types';
/**
 * Type safe API fetch
 */
export declare function apiFetch(baseUrl: string): <
    TPath extends
        | '/api/v1/logs/operations'
        | '/api/v1/logs/operations/:operationId'
        | '/api/v1/logs/messages'
        | '/api/v1/logs/filters'
        | '/api/v1/onboarding'
        | '/connection/metadata',
    TEndpoint extends APIEndpointsPickerWithPath<TPath>
>(
    path: TPath,
    {
        method,
        query,
        token,
        body,
        params
    }: {
        token?: string;
    } & (TEndpoint['Method'] extends 'GET'
        ? {
              method?: TEndpoint['Method'];
          }
        : {
              method: TEndpoint['Method'];
          }) &
        (TEndpoint['Querystring'] extends never
            ? {
                  query?: never;
              }
            : {
                  query: TEndpoint['Querystring'];
              }) &
        (TEndpoint['Body'] extends never
            ? {
                  body?: never;
              }
            : {
                  body: TEndpoint['Body'];
              }) &
        (TEndpoint['Params'] extends never
            ? {
                  params?: never;
              }
            : {
                  params: TEndpoint['Params'];
              })
) => Promise<{
    res: Response;
    json: APIEndpointsPicker<TEndpoint['Method'], TPath>['Reply'];
}>;
/**
 * Assert API response is an error
 */
export declare function isError(json: any): asserts json is ApiError<any, any>;
/**
 * Assert API response is a success
 */
export declare function isSuccess<TType extends Record<string, any>>(
    json: TType
): asserts json is Exclude<
    TType,
    {
        error: any;
    }
>;
/**
 * Check if an endpoint is protected by some auth
 */
export declare function shouldBeProtected({ res, json }: { res: Response; json: any }): void;
/**
 * Check if an endpoint requires the query params to be set
 */
export declare function shouldRequireQueryEnv({ res, json }: { res: Response; json: any }): void;
/**
 * Run the API in the test
 */
export declare function runServer(): Promise<{
    server: Server;
    url: string;
    fetch: ReturnType<typeof apiFetch>;
}>;
