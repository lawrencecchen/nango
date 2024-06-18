import type { Request, Response, NextFunction } from 'express';
declare class WebhookController {
    receive(req: Request, res: Response<any, never>, next: NextFunction): Promise<void>;
}
declare const _default: WebhookController;
export default _default;
