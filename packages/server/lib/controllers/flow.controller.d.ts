import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class FlowController {
    getFlows(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    adminDeployPrivateFlow(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
    deployPreBuiltFlow(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    downloadFlow(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getFlowConfig(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    enableFlow(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    disableFlow(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getFlow(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: FlowController;
export default _default;
