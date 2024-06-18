import type { IntegrationServiceInterface, RunScriptOptions, RunnerOutput } from '@nangohq/shared';
declare class IntegrationService implements IntegrationServiceInterface {
    cancelScript(): Promise<void>;
    runScript({ syncName, nangoProps, isInvokedImmediately, isWebhook, optionalLoadLocation, input }: RunScriptOptions): Promise<RunnerOutput>;
}
declare const _default: IntegrationService;
export default _default;
