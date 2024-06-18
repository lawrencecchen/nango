import type { Request, Response, NextFunction } from 'express';
import type { User } from '@nangohq/shared';
export interface WebUser {
    id: number;
    accountId: number;
    email: string;
    name: string;
}
declare class AuthController {
    logout(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    forgotPassword(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    resetPassword(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    sendResetPasswordEmail(user: User, token: string): Promise<void>;
    invitation(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    getManagedLogin(req: Request, res: Response<any, never>, next: NextFunction): void;
    getManagedLoginWithInvite(req: Request, res: Response<any, never>, next: NextFunction): void;
    loginCallback(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
}
declare const _default: AuthController;
export default _default;
