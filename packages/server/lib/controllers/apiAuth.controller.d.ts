import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class ApiAuthController {
    apiKey(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    basic(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: ApiAuthController;
export default _default;
