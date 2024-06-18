import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class SyncController {
    deploySync(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    confirmation(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getAllRecords(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getSyncsByParams(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getSyncs(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    trigger(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    actionOrModel(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    triggerAction(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getSyncProvider(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    pause(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    start(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getSyncStatus(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    syncCommand(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getFlowAttributes(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    updateFrequency(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    deleteSync(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    /**
     * PUT /sync/update-connection-frequency
     *
     * Allow users to change the default frequency value of a sync without losing the value.
     * The system will store the value inside `_nango_syncs.frequency` and update the relevant schedules.
     */
    updateFrequencyForConnection(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: SyncController;
export default _default;
