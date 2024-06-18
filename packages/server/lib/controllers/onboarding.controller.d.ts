import type { Request, Response, NextFunction } from 'express';
import type { GetOnboardingStatus } from '@nangohq/types';

import type { RequestLocals } from '../utils/express.js';
declare class OnboardingController {
    /**
     * Start an onboarding process.
     * We create a row in the DB to store the global state and create a GitHub provider so we can launch the oauth process
     */
    create(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    /**
     * Get the interactive demo status.
     * We use the progress stored in DB to remember "unprovable step", but most of steps relies on specific data to be present.
     * So we check if each step has been correctly achieved.
     * This is particularly useful if we retry, if some parts have failed or if the user has deleted part of the state
     */
    status(req: Request, res: Response<GetOnboardingStatus['Reply'], Required<RequestLocals>>, next: NextFunction): Promise<void>;
    /**
     * Create interactive demo Sync and Action
     * The code can be found in nango-integrations/github
     */
    deploy(_: Request, res: Response<any, Required<RequestLocals>>, next: NextFunction): Promise<void>;
    /**
     * Check the sync completion state.
     * It could be replaced by regular API calls.
     */
    checkSyncCompletion(
        req: Request<
            unknown,
            unknown,
            | {
                  connectionId?: string;
              }
            | undefined
        >,
        res: Response<any, Required<RequestLocals>>,
        next: NextFunction
    ): Promise<void>;
    /**
     * Log the progress, this is merely informative and for BI.
     */
    updateStatus(
        req: Request<
            unknown,
            unknown,
            | {
                  progress?: number;
              }
            | undefined
        >,
        res: Response<any, Required<RequestLocals>>,
        next: NextFunction
    ): Promise<void>;
    /**
     * Trigger an action to write a test GitHub issue
     */
    writeGithubIssue(
        req: Request<
            unknown,
            unknown,
            | {
                  connectionId?: string;
                  title?: string;
              }
            | undefined
        >,
        res: Response<any, Required<RequestLocals>>,
        next: NextFunction
    ): Promise<void>;
}
declare const _default: OnboardingController;
export default _default;
