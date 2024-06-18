import type { ExternalWebhook, Connection, Environment, WebhookTypes, AuthModeType, ErrorPayload, AuthOperationType } from '@nangohq/types';
import type { LogContext } from '@nangohq/logs';
export declare const sendAuth: ({
    connection,
    environment,
    webhookSettings,
    auth_mode,
    success,
    error,
    operation,
    provider,
    type,
    activityLogId,
    logCtx
}: {
    connection: Connection | Pick<Connection, 'connection_id' | 'provider_config_key'>;
    environment: Environment;
    webhookSettings: ExternalWebhook | null;
    auth_mode: AuthModeType;
    success: boolean;
    error?: ErrorPayload;
    operation: AuthOperationType;
    provider: string;
    type: WebhookTypes;
    activityLogId: number | null;
    logCtx?: LogContext | undefined;
} & (
    | {
          success: true;
      }
    | {
          success: false;
          error: ErrorPayload;
      }
)) => Promise<void>;
