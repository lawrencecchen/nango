import type { Endpoint } from '@nangohq/types';
import type { RequestHandler, Request, Response, NextFunction } from 'express';

import type { RequestLocals } from './express.js';
export declare function asyncWrapper<TEndpoint extends Endpoint<any>>(
    fn: (
        req: Request<TEndpoint['Params'], TEndpoint['Reply'], TEndpoint['Body'], TEndpoint['Querystring']>,
        res: Response<TEndpoint['Reply'], Required<RequestLocals>>,
        next: NextFunction
    ) => Promise<void> | void
): RequestHandler<any, TEndpoint['Reply'], TEndpoint['Body'], TEndpoint['Querystring'], Required<RequestLocals>>;
