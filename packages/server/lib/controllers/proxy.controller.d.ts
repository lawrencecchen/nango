import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare type ForwardedHeaders = Record<string, string>;
declare class ProxyController {
    /**
     * Route Call
     * @desc Parse incoming request from the SDK or HTTP request and route the
     * call on the provided method after verifying the necessary parameters are set.
     * @param {Request} req Express request object
     * @param {Response} res Express response object
     * @param {NextFuncion} next callback function to pass control to the next middleware function in the pipeline.
     */
    routeCall(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    /**
     * Send to http method
     */
    private sendToHttpMethod;
    private handleResponse;
    private handleErrorResponse;
    private request;
    private reportError;
}
/**
 * Parse Headers
 */
export declare function parseHeaders(req: Pick<Request, 'rawHeaders'>): ForwardedHeaders;
declare const _default: ProxyController;
export default _default;
