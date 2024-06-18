import type { Context } from '@temporalio/activity';
import type { IntegrationServiceInterface, RunScriptOptions, ServiceResponse } from '@nangohq/shared';

import type { Runner } from './runner/runner.js';
interface ScriptObject {
    context: Context | null;
    runner: Runner;
    activityLogId: number | undefined;
    cancelled?: boolean;
}
declare class IntegrationService implements IntegrationServiceInterface {
    runningScripts: Map<string, ScriptObject>;
    constructor();
    cancelScript(syncId: string, environmentId: number): Promise<void>;
    runScript({
        syncName,
        syncId,
        activityLogId,
        nangoProps,
        integrationData,
        environmentId,
        writeToDb,
        isInvokedImmediately,
        isWebhook,
        optionalLoadLocation,
        input,
        temporalContext
    }: RunScriptOptions): Promise<ServiceResponse>;
    private sendHeartbeat;
}
declare const _default: IntegrationService;
export default _default;
