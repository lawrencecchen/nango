import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
export declare const NANGO_ADMIN_UUID: string;
export declare const AUTH_ADMIN_SWITCH_ENABLED: boolean;
export declare const AUTH_ADMIN_SWITCH_MS: number;
declare class AccountController {
    getAccount(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    editAccount(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    editCustomer(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    switchAccount(
        req: Request<
            unknown,
            unknown,
            {
                account_uuid?: string;
                login_reason?: string;
            }
        >,
        res: Response<any, Required<RequestLocals>>,
        next: NextFunction
    ): Promise<void>;
}
declare const _default: AccountController;
export default _default;
