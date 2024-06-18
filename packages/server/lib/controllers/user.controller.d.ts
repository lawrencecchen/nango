import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
export interface GetUser {
    user: {
        id: number;
        accountId: number;
        email: string;
        name: string;
    };
}
declare class UserController {
    getUser(req: Request, res: Response<GetUser, never>, next: NextFunction): Promise<void>;
    editName(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    editPassword(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    invite(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    suspend(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
}
declare const _default: UserController;
export default _default;
