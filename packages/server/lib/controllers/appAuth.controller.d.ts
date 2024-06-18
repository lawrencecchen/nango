import type { Request, Response, NextFunction } from 'express';
declare class AppAuthController {
    connect(req: Request, res: Response<any, never>, _next: NextFunction): Promise<void>;
}
declare const _default: AppAuthController;
export default _default;
