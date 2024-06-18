import type { NextFunction, Request, Response } from 'express';
import type { LogLevel } from '@nangohq/shared';
declare type RecordRequest = Request<
    {
        environmentId: number;
        nangoConnectionId: number;
        syncId: string;
        syncJobId: number;
    },
    void,
    {
        model: string;
        records: Record<string, any>[];
        providerConfigKey: string;
        connectionId: string;
        activityLogId: number | string;
    },
    void
>;
declare class PersistController {
    saveActivityLog(
        req: Request<
            {
                environmentId: number;
            },
            void,
            {
                activityLogId: number | string;
                level: LogLevel;
                msg: string;
                timestamp?: number;
            },
            void
        >,
        res: Response,
        next: NextFunction
    ): Promise<void>;
    saveRecords(req: RecordRequest, res: Response, next: NextFunction): Promise<void>;
    deleteRecords(req: RecordRequest, res: Response, next: NextFunction): Promise<void>;
    updateRecords(req: RecordRequest, res: Response, next: NextFunction): Promise<void>;
    private static persistRecords;
}
declare const _default: PersistController;
export default _default;
