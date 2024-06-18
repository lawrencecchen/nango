import type { Config as ProviderConfig, SyncConfig } from '@nangohq/shared';
import type { LogContextGetter } from '@nangohq/logs';
export interface InternalNango {
    getWebhooks: (environment_id: number, nango_config_id: number) => Promise<SyncConfig[]>;
    executeScriptForWebhooks(
        integration: ProviderConfig,
        body: any,
        webhookType: string,
        connectionIdentifier: string,
        logContextGetter: LogContextGetter,
        propName?: string
    ): Promise<{
        connectionIds: string[];
    }>;
}
export declare const internalNango: InternalNango;
