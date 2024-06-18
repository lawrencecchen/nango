import type { Connection, Environment, SyncResult, ErrorPayload, SyncType, ExternalWebhook } from '@nangohq/types';
import type { LogContext } from '@nangohq/logs';
export declare const sendSync: ({
    connection,
    environment,
    webhookSettings,
    syncName,
    model,
    now,
    responseResults,
    success,
    operation,
    error,
    activityLogId,
    logCtx
}: {
    connection: Connection | Pick<Connection, 'connection_id' | 'provider_config_key'>;
    environment: Environment;
    webhookSettings: ExternalWebhook | null;
    syncName: string;
    model: string;
    now: Date | undefined;
    operation: SyncType;
    error?: ErrorPayload;
    responseResults?: SyncResult;
    success: boolean;
    activityLogId: number | null;
    logCtx?: LogContext | undefined;
} & (
    | {
          success: true;
          responseResults: SyncResult;
      }
    | {
          success: false;
          error: ErrorPayload;
      }
)) => Promise<void>;
