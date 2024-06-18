import type { NangoProps, RunnerOutput } from '@nangohq/shared';
export declare function exec(
    nangoProps: NangoProps,
    isInvokedImmediately: boolean,
    isWebhook: boolean,
    code: string,
    codeParams?: object
): Promise<RunnerOutput>;
