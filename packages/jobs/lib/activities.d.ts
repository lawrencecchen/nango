import { Context } from '@temporalio/activity';
import type {
    Config as ProviderConfig,
    ServiceResponse,
    NangoConnection,
    ContinuousSyncArgs,
    InitialSyncArgs,
    PostConnectionScriptArgs,
    ActionArgs,
    WebhookArgs,
    SyncConfig
} from '@nangohq/shared';
import { SyncType } from '@nangohq/shared';
export declare function routeSync(args: InitialSyncArgs): Promise<boolean | object | null>;
export declare function runAction(args: ActionArgs): Promise<ServiceResponse>;
export declare function scheduleAndRouteSync(args: ContinuousSyncArgs): Promise<boolean | object | null>;
/**
 * Sync Provider
 * @desc take in a provider, use the nango.yaml config to find
 * the integrations where that provider is used and call the sync
 * accordingly with the user defined integration code
 */
export declare function syncProvider({
    providerConfig,
    syncConfig,
    syncId,
    syncJobId,
    syncName,
    syncType,
    nangoConnection,
    temporalContext,
    debug
}: {
    providerConfig: ProviderConfig;
    syncConfig: SyncConfig;
    syncId: string;
    syncJobId: number;
    syncName: string;
    syncType: SyncType;
    nangoConnection: NangoConnection;
    temporalContext: Context;
    debug?: boolean;
}): Promise<boolean | object | null>;
export declare function runWebhook(args: WebhookArgs): Promise<boolean>;
export declare function runPostConnectionScript(args: PostConnectionScriptArgs): Promise<ServiceResponse>;
export declare function reportFailure(
    error: any,
    workflowArguments: InitialSyncArgs | ContinuousSyncArgs | ActionArgs | WebhookArgs | PostConnectionScriptArgs,
    timeout: string,
    max_attempts: number
): Promise<void>;
export declare function cancelActivity(workflowArguments: InitialSyncArgs | ContinuousSyncArgs): Promise<void>;
