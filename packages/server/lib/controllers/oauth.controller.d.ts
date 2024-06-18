import type { Request, Response, NextFunction } from 'express';

import type { RequestLocals } from '../utils/express.js';
declare class OAuthController {
    oauthRequest(req: Request, res: Response<any, Required<RequestLocals>>, _next: NextFunction): Promise<void>;
    oauth2RequestCC(req: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    private oauth2Request;
    private appRequest;
    private oauth1Request;
    oauthCallback(req: Request, res: Response<any, never>, _: NextFunction): Promise<void>;
    private oauth2Callback;
    private oauth1Callback;
}
declare const _default: OAuthController;
export default _default;
