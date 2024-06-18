import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class ActivityController {
    retrieve(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getMessages(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getPossibleFilters(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: ActivityController;
export default _default;
