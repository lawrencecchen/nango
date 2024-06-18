import type { Request, Response, NextFunction, Express } from 'express';
import type { Endpoint } from '@nangohq/types';
export declare type EndpointRequest<E extends Endpoint<any>> = Request<E['Params'], E['Reply'], E['Body'], E['Querystring']>;
export declare type EndpointResponse<E extends Endpoint<any>> = Response<E['Reply']>;
export interface Route<E extends Endpoint<any>> {
    path: E['Path'];
    method: E['Method'];
}
export interface RouteHandler<E extends Endpoint<any>> extends Route<E> {
    validate: (req: EndpointRequest<E>, res: EndpointResponse<E>, next: NextFunction) => void;
    handler: (req: EndpointRequest<E>, res: EndpointResponse<E>, next: NextFunction) => void;
}
export declare const createRoute: <E extends Endpoint<any>>(server: Express, rh: RouteHandler<E>) => void;
export declare const routeFetch: <E extends Endpoint<any>>(
    baseUrl: string,
    route: Route<E>,
    config?: {
        timeoutMs: number;
    }
) => ({ query, body, params }: { query?: E['Querystring']; body?: E['Body']; params?: E['Params'] }) => Promise<E['Reply']>;
