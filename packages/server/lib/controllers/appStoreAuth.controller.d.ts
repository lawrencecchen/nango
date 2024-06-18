import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class AppStoreAuthController {
    auth(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: AppStoreAuthController;
export default _default;
