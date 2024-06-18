import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
export declare class AccessMiddleware {
    secretKeyAuth(req: Request, res: Response<any, RequestLocals>, next: NextFunction): Promise<void>;
    /**
     * Inherit secretKeyAuth
     */
    adminKeyAuth(_: Request, res: Response<any, RequestLocals>, next: NextFunction): void;
    publicKeyAuth(req: Request, res: Response<any, RequestLocals>, next: NextFunction): Promise<void>;
    sessionAuth(req: Request, res: Response<any, RequestLocals>, next: NextFunction): Promise<void>;
    noAuth(req: Request, res: Response<any, RequestLocals>, next: NextFunction): Promise<void>;
    basicAuth(req: Request, res: Response<any, RequestLocals>, next: NextFunction): Promise<void>;
    admin(req: Request, res: Response, next: NextFunction): void;
}
declare const _default: AccessMiddleware;
export default _default;
