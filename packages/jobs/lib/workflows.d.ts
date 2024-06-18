import type { WebhookArgs, PostConnectionScriptArgs, ContinuousSyncArgs, InitialSyncArgs, ActionArgs, RunnerOutput } from '@nangohq/shared';
export declare function initialSync(args: InitialSyncArgs): Promise<boolean | object | null>;
export declare function continuousSync(args: ContinuousSyncArgs): Promise<boolean | object | null>;
export declare function action(args: ActionArgs): Promise<RunnerOutput>;
export declare function webhook(args: WebhookArgs): Promise<boolean>;
export declare function postConnectionScript(args: PostConnectionScriptArgs): Promise<RunnerOutput>;
