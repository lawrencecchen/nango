import type { NextFunction, Request, Response } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class ProviderController {
    /**
     * Webapp
     */
    listProviders(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    getProvider(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
}
declare const _default: ProviderController;
export default _default;
