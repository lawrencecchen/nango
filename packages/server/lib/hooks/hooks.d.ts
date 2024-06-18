import type { Tracer } from 'dd-trace';
import { NangoError } from '@nangohq/shared';
import type {
    ApiKeyCredentials,
    BasicApiCredentials,
    RecentlyCreatedConnection,
    Connection,
    ConnectionConfig,
    RecentlyFailedConnection
} from '@nangohq/shared';
import type { Environment, IntegrationConfig, Template as ProviderTemplate } from '@nangohq/types';
import type { Result } from '@nangohq/utils';
import type { LogContext } from '@nangohq/logs';
export declare const connectionCreationStartCapCheck: ({
    providerConfigKey,
    environmentId,
    creationType
}: {
    providerConfigKey: string | undefined;
    environmentId: number;
    creationType: 'create' | 'import';
}) => Promise<boolean>;
export declare const connectionCreated: (
    createdConnectionPayload: RecentlyCreatedConnection,
    provider: string,
    logContextGetter: LogContextGetter,
    activityLogId: number | null,
    options?: {
        initiateSync?: boolean;
        runPostConnectionScript?: boolean;
    },
    logCtx?: LogContext
) => Promise<void>;
export declare const connectionCreationFailed: (
    failedConnectionPayload: RecentlyFailedConnection,
    provider: string,
    activityLogId: number | null,
    logCtx?: LogContext
) => Promise<void>;
export declare const connectionRefreshSuccess: ({
    connection,
    environment,
    config
}: {
    connection: Connection;
    environment: Environment;
    config: IntegrationConfig;
}) => Promise<void>;
export declare const connectionRefreshFailed: ({
    connection,
    activityLogId,
    logCtx,
    authError,
    environment,
    template,
    config
}: {
    connection: Connection;
    environment: Environment;
    template: ProviderTemplate;
    config: IntegrationConfig;
    authError: {
        type: string;
        description: string;
    };
    activityLogId: number;
    logCtx: LogContext;
}) => Promise<void>;
export declare const connectionTest: (
    provider: string,
    template: ProviderTemplate,
    credentials: ApiKeyCredentials | BasicApiCredentials,
    connectionId: string,
    providerConfigKey: string,
    environment_id: number,
    connection_config: ConnectionConfig,
    tracer: Tracer
) => Promise<Result<boolean, NangoError>>;
