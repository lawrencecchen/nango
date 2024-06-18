import type { Request, Response, NextFunction } from 'express';
import type { Environment } from '@nangohq/shared';
import type { EnvironmentVariable, ExternalWebhook } from '@nangohq/types';

import type { RequestLocals } from '../utils/express.js';
export interface GetMeta {
    environments: Pick<Environment, 'name'>[];
    email: string;
    version: string;
    baseUrl: string;
    debugMode: boolean;
    onboardingComplete: boolean;
}
export interface EnvironmentAndAccount {
    environment: Environment;
    env_variables: EnvironmentVariable[];
    webhook_settings: ExternalWebhook | null;
    host: string;
    uuid: string;
    email: string;
    slack_notifications_channel: string | null;
}
declare class EnvironmentController {
    meta(req: Request, res: Response<GetMeta, never>, next: NextFunction): Promise<void>;
    getEnvironment(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getHmacDigest(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getAdminAuthInfo(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateCallback(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateHmacEnabled(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateSlackNotificationsEnabled(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateHmacKey(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getEnvironmentVariables(_req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateEnvironmentVariables(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    rotateKey(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    revertKey(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    activateKey(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: EnvironmentController;
export default _default;
