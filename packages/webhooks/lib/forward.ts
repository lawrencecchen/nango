import type { NangoForwardWebhookBody, ExternalWebhook, Account, Environment, IntegrationConfig } from '@nangohq/types';
import type { LogContextGetter } from '@nangohq/logs';

import { deliver, shouldSend } from './utils.js';

export const forwardWebhook = async ({
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
}): Promise<void> => {
    if (!webhookSettings) {
        return;
    }

    if (!shouldSend({ success: true, type: 'forward', webhookSettings, operation: 'incoming_webhook' })) {
        return;
    }

    const logCtx = await logContextGetter.create(
        {
            operation: { type: 'webhook', action: 'outgoing' },
            message: 'Forwarding Webhook',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        },
        {
            account,
            environment,
            integration: { id: integration.id!, name: integration.unique_key, provider: integration.provider }
        }
    );

    const body: NangoForwardWebhookBody = {
        from: integration.provider,
        providerConfigKey: integration.unique_key,
        type: 'forward',
        payload: payload
    };

    const webhooks = [
        { url: webhookSettings.primary_url, type: 'webhook url' },
        { url: webhookSettings.secondary_url, type: 'secondary webhook url' }
    ].filter((webhook) => webhook.url) as { url: string; type: string }[];

    if (!connectionIds || connectionIds.length === 0) {
        const result = await deliver({
            webhooks,
            body: payload,
            webhookType: 'forward',
            activityLogId: null,
            environment,
            logCtx
        });

        result ? await logCtx.success() : await logCtx.failed();

        return;
    }

    let success = true;
    for (const connectionId of connectionIds) {
        const result = await deliver({
            webhooks,
            body: {
                ...body,
                connectionId
            },
            webhookType: 'forward',
            activityLogId: null,
            environment,
            logCtx,
            incomingHeaders: webhookOriginalHeaders
        });

        if (!result) {
            success = false;
        }
    }

    success ? await logCtx.success() : await logCtx.failed();
};
