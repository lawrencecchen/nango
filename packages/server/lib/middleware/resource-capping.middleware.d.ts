import type { Request, Response, NextFunction } from 'express';
export declare const authCheck: (req: Request, res: Response, next: NextFunction) => Promise<void>;
