import type { NextFunction, Request, Response } from 'express';
import type { AuthModeType } from '@nangohq/types';

import type { RequestLocals } from '../utils/express.js';
export interface Integration {
    authMode: AuthModeType;
    uniqueKey: string;
    provider: string;
    connection_count: number;
    scripts: number;
    creationDate: Date | undefined;
    connectionConfigParams?: string[];
}
export interface ListIntegration {
    integrations: Integration[];
}
declare class ConfigController {
    /**
     * Webapp
     */
    listProviderConfigsWeb(_: Request, res: Response<ListIntegration, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    listProvidersFromYaml(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    editProviderConfigWeb(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    editProviderConfigName(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    /**
     * CLI
     */
    listProviderConfigs(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getProviderConfig(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getConnections(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    createEmptyProviderConfig(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    createProviderConfig(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    editProviderConfig(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    deleteProviderConfig(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: ConfigController;
export default _default;
