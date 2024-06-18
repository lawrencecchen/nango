import type { AxiosError } from 'axios';
import type { LogContext } from '@nangohq/logs';
import type { WebhookTypes, SyncType, AuthOperationType, Environment, ExternalWebhook } from '@nangohq/types';
export declare const RETRY_ATTEMPTS = 7;
export declare const NON_FORWARDABLE_HEADERS: string[];
export declare const retry: (
    activityLogId: number | null,
    logCtx?: LogContext | null | undefined,
    error?: AxiosError,
    attemptNumber?: number
) => Promise<boolean>;
export declare const getSignatureHeader: (secret: string, payload: unknown) => Record<string, string>;
export declare const filterHeaders: (headers: Record<string, string>) => Record<string, string>;
export declare const shouldSend: ({
    webhookSettings,
    success,
    type,
    operation
}: {
    webhookSettings: ExternalWebhook;
    success: boolean;
    type: 'auth' | 'sync' | 'forward';
    operation: SyncType | AuthOperationType | 'incoming_webhook';
}) => boolean;
export declare const deliver: ({
    webhooks,
    body,
    webhookType,
    activityLogId,
    logCtx,
    environment,
    endingMessage,
    incomingHeaders
}: {
    webhooks: {
        url: string;
        type: string;
    }[];
    body: unknown;
    webhookType: WebhookTypes;
    activityLogId: number | null;
    environment: Environment;
    logCtx?: LogContext | undefined;
    endingMessage?: string;
    incomingHeaders?: Record<string, string>;
}) => Promise<boolean>;
