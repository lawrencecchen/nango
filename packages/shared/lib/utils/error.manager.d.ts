import type { Tracer } from 'dd-trace';
import type { Response, Request } from 'express';

import { NangoError } from './error.js';
export declare enum ErrorSourceEnum {
    PLATFORM = 'platform',
    CUSTOMER = 'customer'
}
export declare type ErrorSource = ErrorSourceEnum;
interface ErrorOptionalConfig {
    source: ErrorSource;
    accountId?: number;
    userId?: number;
    environmentId?: number | undefined;
    metadata?: Record<string, unknown>;
    operation?: string;
}
declare class ErrorManager {
    constructor();
    /**
     * TODO: reuse information in res.locals when possible
     */
    report(e: unknown, config?: ErrorOptionalConfig, tracer?: Tracer): void;
    errResFromNangoErr(res: Response, err: NangoError | null): void;
    errRes(res: Response, type: string): void;
    handleGenericError(err: Error | NangoError | object, _: Request, res: Response, tracer: Tracer): void;
    getExpressRequestContext(req: Request): Record<string, unknown>;
}
declare const _default: ErrorManager;
export default _default;
