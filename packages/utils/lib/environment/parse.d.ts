import { z } from 'zod';
export declare const ENVS: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["production", "staging", "development", "test"]>>;
    CI: z.ZodDefault<z.ZodBoolean>;
    VITEST: z.ZodDefault<z.ZodBoolean>;
    TZ: z.ZodDefault<z.ZodString>;
    WORKOS_API_KEY: z.ZodOptional<z.ZodString>;
    WORKOS_CLIENT_ID: z.ZodOptional<z.ZodString>;
    NANGO_DASHBOARD_USERNAME: z.ZodOptional<z.ZodString>;
    NANGO_DASHBOARD_PASSWORD: z.ZodOptional<z.ZodString>;
    LOCAL_NANGO_USER_ID: z.ZodOptional<z.ZodNumber>;
    NANGO_PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    SERVER_PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    NANGO_SERVER_URL: z.ZodOptional<z.ZodString>;
    DEFAULT_RATE_LIMIT_PER_MIN: z.ZodOptional<z.ZodNumber>;
    NANGO_CACHE_ENV_KEYS: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_SERVER_WEBSOCKETS_PATH: z.ZodOptional<z.ZodString>;
    NANGO_ADMIN_INVITE_TOKEN: z.ZodOptional<z.ZodString>;
    PERSIST_SERVICE_URL: z.ZodOptional<z.ZodString>;
    NANGO_PERSIST_PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    ORCHESTRATOR_SERVICE_URL: z.ZodOptional<z.ZodString>;
    NANGO_ORCHESTRATOR_PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    ORCHESTRATOR_DATABASE_URL: z.ZodOptional<z.ZodString>;
    ORCHESTRATOR_DATABASE_SCHEMA: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    JOBS_SERVICE_URL: z.ZodOptional<z.ZodString>;
    NANGO_JOBS_PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    RUNNER_SERVICE_URL: z.ZodOptional<z.ZodString>;
    NANGO_RUNNER_PATH: z.ZodOptional<z.ZodString>;
    RUNNER_OWNER_ID: z.ZodOptional<z.ZodString>;
    RUNNER_ID: z.ZodOptional<z.ZodString>;
    IDLE_MAX_DURATION_MS: z.ZodDefault<z.ZodNumber>;
    DEFAULT_GITHUB_CLIENT_ID: z.ZodOptional<z.ZodString>;
    DEFAULT_GITHUB_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    AWS_REGION: z.ZodOptional<z.ZodString>;
    AWS_BUCKET_NAME: z.ZodOptional<z.ZodString>;
    AWS_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
    DD_ENV: z.ZodOptional<z.ZodString>;
    DD_SITE: z.ZodOptional<z.ZodString>;
    DD_TRACE_AGENT_URL: z.ZodOptional<z.ZodString>;
    NANGO_LOGS_ES_URL: z.ZodOptional<z.ZodString>;
    NANGO_LOGS_ES_USER: z.ZodOptional<z.ZodString>;
    NANGO_LOGS_ES_PWD: z.ZodOptional<z.ZodString>;
    NANGO_LOGS_ENABLED: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_LOGS_ES_INDEX: z.ZodOptional<z.ZodString>;
    MAILGUN_API_KEY: z.ZodOptional<z.ZodString>;
    NANGO_DATABASE_URL: z.ZodOptional<z.ZodString>;
    NANGO_DB_HOST: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    NANGO_DB_PORT: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    NANGO_DB_USER: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    NANGO_DB_NAME: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    NANGO_DB_PASSWORD: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    NANGO_DB_SSL: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_DB_CLIENT: z.ZodOptional<z.ZodString>;
    NANGO_ENCRYPTION_KEY: z.ZodOptional<z.ZodString>;
    NANGO_DB_MIGRATION_FOLDER: z.ZodOptional<z.ZodString>;
    NANGO_DB_SCHEMA: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    NANGO_DB_ADDITIONAL_SCHEMAS: z.ZodOptional<z.ZodString>;
    RECORDS_DATABASE_URL: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    RECORDS_DATABASE_SCHEMA: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    NANGO_REDIS_URL: z.ZodOptional<z.ZodString>;
    RENDER_API_KEY: z.ZodOptional<z.ZodString>;
    IS_RENDER: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_ADMIN_CONNECTION_ID: z.ZodOptional<z.ZodString>;
    NANGO_SLACK_INTEGRATION_KEY: z.ZodOptional<z.ZodString>;
    NANGO_ADMIN_UUID: z.ZodOptional<z.ZodString>;
    SENTRY_DNS: z.ZodOptional<z.ZodString>;
    TEMPORAL_NAMESPACE: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    TEMPORAL_ADDRESS: z.ZodOptional<z.ZodString>;
    TEMPORAL_WORKER_MAX_CONCURRENCY: z.ZodDefault<z.ZodNumber>;
    SERVER_RUN_MODE: z.ZodOptional<z.ZodEnum<["DOCKERIZED", ""]>>;
    NANGO_CLOUD: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_ENTERPRISE: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_TELEMETRY_SDK: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    NANGO_ADMIN_KEY: z.ZodOptional<z.ZodString>;
    NANGO_INTEGRATIONS_FULL_PATH: z.ZodOptional<z.ZodString>;
    TELEMETRY: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodEnum<["true", "false", ""]>>>, boolean, "" | "true" | "false" | undefined>;
    LOG_LEVEL: z.ZodDefault<z.ZodOptional<z.ZodEnum<["info", "debug", "warn", "error"]>>>;
}, "strip", z.ZodTypeAny, {
    SERVER_PORT: number;
    NODE_ENV: "development" | "staging" | "production" | "test";
    NANGO_CLOUD: boolean;
    NANGO_ENTERPRISE: boolean;
    CI: boolean;
    VITEST: boolean;
    TZ: string;
    NANGO_PORT: number;
    NANGO_CACHE_ENV_KEYS: boolean;
    NANGO_PERSIST_PORT: number;
    NANGO_ORCHESTRATOR_PORT: number;
    ORCHESTRATOR_DATABASE_SCHEMA: string;
    NANGO_JOBS_PORT: number;
    IDLE_MAX_DURATION_MS: number;
    NANGO_LOGS_ENABLED: boolean;
    NANGO_DB_HOST: string;
    NANGO_DB_PORT: number;
    NANGO_DB_USER: string;
    NANGO_DB_NAME: string;
    NANGO_DB_PASSWORD: string;
    NANGO_DB_SSL: boolean;
    NANGO_DB_SCHEMA: string;
    RECORDS_DATABASE_URL: string;
    RECORDS_DATABASE_SCHEMA: string;
    IS_RENDER: boolean;
    TEMPORAL_NAMESPACE: string;
    TEMPORAL_WORKER_MAX_CONCURRENCY: number;
    NANGO_TELEMETRY_SDK: boolean;
    TELEMETRY: boolean;
    LOG_LEVEL: "error" | "info" | "debug" | "warn";
    WORKOS_API_KEY?: string | undefined;
    WORKOS_CLIENT_ID?: string | undefined;
    NANGO_DASHBOARD_USERNAME?: string | undefined;
    NANGO_DASHBOARD_PASSWORD?: string | undefined;
    LOCAL_NANGO_USER_ID?: number | undefined;
    NANGO_SERVER_URL?: string | undefined;
    DEFAULT_RATE_LIMIT_PER_MIN?: number | undefined;
    NANGO_SERVER_WEBSOCKETS_PATH?: string | undefined;
    NANGO_ADMIN_INVITE_TOKEN?: string | undefined;
    PERSIST_SERVICE_URL?: string | undefined;
    ORCHESTRATOR_SERVICE_URL?: string | undefined;
    ORCHESTRATOR_DATABASE_URL?: string | undefined;
    JOBS_SERVICE_URL?: string | undefined;
    RUNNER_SERVICE_URL?: string | undefined;
    NANGO_RUNNER_PATH?: string | undefined;
    RUNNER_OWNER_ID?: string | undefined;
    RUNNER_ID?: string | undefined;
    DEFAULT_GITHUB_CLIENT_ID?: string | undefined;
    DEFAULT_GITHUB_CLIENT_SECRET?: string | undefined;
    AWS_REGION?: string | undefined;
    AWS_BUCKET_NAME?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    DD_ENV?: string | undefined;
    DD_SITE?: string | undefined;
    DD_TRACE_AGENT_URL?: string | undefined;
    NANGO_LOGS_ES_URL?: string | undefined;
    NANGO_LOGS_ES_USER?: string | undefined;
    NANGO_LOGS_ES_PWD?: string | undefined;
    NANGO_LOGS_ES_INDEX?: string | undefined;
    MAILGUN_API_KEY?: string | undefined;
    NANGO_DATABASE_URL?: string | undefined;
    NANGO_DB_CLIENT?: string | undefined;
    NANGO_ENCRYPTION_KEY?: string | undefined;
    NANGO_DB_MIGRATION_FOLDER?: string | undefined;
    NANGO_DB_ADDITIONAL_SCHEMAS?: string | undefined;
    NANGO_REDIS_URL?: string | undefined;
    RENDER_API_KEY?: string | undefined;
    NANGO_ADMIN_CONNECTION_ID?: string | undefined;
    NANGO_SLACK_INTEGRATION_KEY?: string | undefined;
    NANGO_ADMIN_UUID?: string | undefined;
    SENTRY_DNS?: string | undefined;
    TEMPORAL_ADDRESS?: string | undefined;
    SERVER_RUN_MODE?: "" | "DOCKERIZED" | undefined;
    NANGO_ADMIN_KEY?: string | undefined;
    NANGO_INTEGRATIONS_FULL_PATH?: string | undefined;
}, {
    NODE_ENV?: "development" | "staging" | "production" | "test" | undefined;
    CI?: boolean | undefined;
    VITEST?: boolean | undefined;
    TZ?: string | undefined;
    WORKOS_API_KEY?: string | undefined;
    WORKOS_CLIENT_ID?: string | undefined;
    NANGO_DASHBOARD_USERNAME?: string | undefined;
    NANGO_DASHBOARD_PASSWORD?: string | undefined;
    LOCAL_NANGO_USER_ID?: number | undefined;
    NANGO_PORT?: number | undefined;
    SERVER_PORT?: number | undefined;
    NANGO_SERVER_URL?: string | undefined;
    DEFAULT_RATE_LIMIT_PER_MIN?: number | undefined;
    NANGO_CACHE_ENV_KEYS?: "" | "true" | "false" | undefined;
    NANGO_SERVER_WEBSOCKETS_PATH?: string | undefined;
    NANGO_ADMIN_INVITE_TOKEN?: string | undefined;
    PERSIST_SERVICE_URL?: string | undefined;
    NANGO_PERSIST_PORT?: number | undefined;
    ORCHESTRATOR_SERVICE_URL?: string | undefined;
    NANGO_ORCHESTRATOR_PORT?: number | undefined;
    ORCHESTRATOR_DATABASE_URL?: string | undefined;
    ORCHESTRATOR_DATABASE_SCHEMA?: string | undefined;
    JOBS_SERVICE_URL?: string | undefined;
    NANGO_JOBS_PORT?: number | undefined;
    RUNNER_SERVICE_URL?: string | undefined;
    NANGO_RUNNER_PATH?: string | undefined;
    RUNNER_OWNER_ID?: string | undefined;
    RUNNER_ID?: string | undefined;
    IDLE_MAX_DURATION_MS?: number | undefined;
    DEFAULT_GITHUB_CLIENT_ID?: string | undefined;
    DEFAULT_GITHUB_CLIENT_SECRET?: string | undefined;
    AWS_REGION?: string | undefined;
    AWS_BUCKET_NAME?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    DD_ENV?: string | undefined;
    DD_SITE?: string | undefined;
    DD_TRACE_AGENT_URL?: string | undefined;
    NANGO_LOGS_ES_URL?: string | undefined;
    NANGO_LOGS_ES_USER?: string | undefined;
    NANGO_LOGS_ES_PWD?: string | undefined;
    NANGO_LOGS_ENABLED?: "" | "true" | "false" | undefined;
    NANGO_LOGS_ES_INDEX?: string | undefined;
    MAILGUN_API_KEY?: string | undefined;
    NANGO_DATABASE_URL?: string | undefined;
    NANGO_DB_HOST?: string | undefined;
    NANGO_DB_PORT?: number | undefined;
    NANGO_DB_USER?: string | undefined;
    NANGO_DB_NAME?: string | undefined;
    NANGO_DB_PASSWORD?: string | undefined;
    NANGO_DB_SSL?: "" | "true" | "false" | undefined;
    NANGO_DB_CLIENT?: string | undefined;
    NANGO_ENCRYPTION_KEY?: string | undefined;
    NANGO_DB_MIGRATION_FOLDER?: string | undefined;
    NANGO_DB_SCHEMA?: string | undefined;
    NANGO_DB_ADDITIONAL_SCHEMAS?: string | undefined;
    RECORDS_DATABASE_URL?: string | undefined;
    RECORDS_DATABASE_SCHEMA?: string | undefined;
    NANGO_REDIS_URL?: string | undefined;
    RENDER_API_KEY?: string | undefined;
    IS_RENDER?: "" | "true" | "false" | undefined;
    NANGO_ADMIN_CONNECTION_ID?: string | undefined;
    NANGO_SLACK_INTEGRATION_KEY?: string | undefined;
    NANGO_ADMIN_UUID?: string | undefined;
    SENTRY_DNS?: string | undefined;
    TEMPORAL_NAMESPACE?: string | undefined;
    TEMPORAL_ADDRESS?: string | undefined;
    TEMPORAL_WORKER_MAX_CONCURRENCY?: number | undefined;
    SERVER_RUN_MODE?: "" | "DOCKERIZED" | undefined;
    NANGO_CLOUD?: "" | "true" | "false" | undefined;
    NANGO_ENTERPRISE?: "" | "true" | "false" | undefined;
    NANGO_TELEMETRY_SDK?: "" | "true" | "false" | undefined;
    NANGO_ADMIN_KEY?: string | undefined;
    NANGO_INTEGRATIONS_FULL_PATH?: string | undefined;
    TELEMETRY?: "" | "true" | "false" | undefined;
    LOG_LEVEL?: "error" | "info" | "debug" | "warn" | undefined;
}>;
export declare function parseEnvs<T extends z.ZodObject<any>>(schema: T, envs?: Record<string, unknown>): z.SafeParseSuccess<z.infer<T>>['data'];
