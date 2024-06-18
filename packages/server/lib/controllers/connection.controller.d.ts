import type { Request, Response, NextFunction } from 'express';
import type { ConnectionList } from '@nangohq/shared';

import type { RequestLocals } from '../utils/express.js';
export type { ConnectionList };
declare class ConnectionController {
    /**
     * CLI/SDK/API
     */
    getConnectionCreds(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    listConnections(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    deleteConnection(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    deleteAdminConnection(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    listProviders(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    setMetadataLegacy(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateMetadataLegacy(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    createConnection(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: ConnectionController;
export default _default;
