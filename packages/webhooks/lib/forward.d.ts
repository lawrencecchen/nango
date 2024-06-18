import type { ExternalWebhook, Account, Environment, IntegrationConfig } from '@nangohq/types';
import type { LogContextGetter } from '@nangohq/logs';
export declare const forwardWebhook: ({
    integration,
    account,
    environment,
    webhookSettings,
    connectionIds,
    payload,
    webhookOriginalHeaders,
    logContextGetter
}: {
    integration: IntegrationConfig;
    account: Account;
    environment: Environment;
    webhookSettings: ExternalWebhook | null;
    connectionIds: string[];
    payload: Record<string, any> | null;
    webhookOriginalHeaders: Record<string, string>;
    logContextGetter: LogContextGetter;
}) => Promise<void>;
