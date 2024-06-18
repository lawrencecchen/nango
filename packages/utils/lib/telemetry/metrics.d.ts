export declare enum Types {
    ACTION_EXECUTION = 'nango.jobs.actionExecution',
    ACTION_TRACK_RUNTIME = 'action_track_runtime',
    AUTH_GET_ENV_BY_SECRET_KEY = 'nango.auth.getEnvBySecretKey',
    AUTH_PUBLIC_KEY = 'nango.auth.publicKey',
    AUTH_SESSION = 'nango.auth.session',
    DB_POOL_ACQUISITION_DURATION = 'nango.db.pool.acquisition',
    DB_POOL_FREE = 'nango.db.pool.free',
    DB_POOL_USED = 'nango.db.pool.used',
    DB_POOL_WAITING = 'nango.db.pool.waiting',
    GET_CONNECTION = 'nango.server.getConnection',
    JOBS_CLEAN_ACTIVITY_LOGS = 'nango.jobs.cron.cleanActivityLogs',
    JOBS_DELETE_SYNCS_DATA = 'nango.jobs.cron.deleteSyncsData',
    JOBS_DELETE_SYNCS_DATA_DELETES = 'nango.jobs.cron.deleteSyncsData.deletes',
    JOBS_DELETE_SYNCS_DATA_JOBS = 'nango.jobs.cron.deleteSyncsData.jobs',
    JOBS_DELETE_SYNCS_DATA_RECORDS = 'nango.jobs.cron.deleteSyncsData.records',
    JOBS_DELETE_SYNCS_DATA_SCHEDULES = 'nango.jobs.cron.deleteSyncsData.schedules',
    LOGS_LOG = 'nango.logs.log',
    PERSIST_RECORDS_COUNT = 'nango.persist.records.count',
    PERSIST_RECORDS_SIZE_IN_BYTES = 'nango.persist.records.sizeInBytes',
    POST_CONNECTION_SCRIPT_RUNTIME = 'nango.jobs.postConnectionScriptRuntime',
    PROXY = 'nango.server.proxyCall',
    REFRESH_TOKENS = 'nango.server.cron.refreshTokens',
    REFRESH_TOKENS_FAILED = 'nango.server.cron.refreshTokens.failed',
    REFRESH_TOKENS_SUCCESS = 'nango.server.cron.refreshTokens.success',
    RUNNER_SDK = 'nango.runner.sdk',
    RENCONCILE_TEMPORAL_SCHEDULES = 'nango.jobs.cron.reconcileTemporalSchedules',
    RENCONCILE_TEMPORAL_SCHEDULES_FAILED = 'nango.jobs.cron.reconcileTemporalSchedules.failed',
    RENCONCILE_TEMPORAL_SCHEDULES_SUCCESS = 'nango.jobs.cron.reconcileTemporalSchedules.success',
    SYNC_EXECUTION = 'nango.jobs.syncExecution',
    SYNC_TRACK_RUNTIME = 'sync_script_track_runtime',
    WEBHOOK_EXECUTION = 'nango.jobs.webhookExecution',
    WEBHOOK_TRACK_RUNTIME = 'webhook_track_runtime'
}
export declare function increment(metricName: Types, value?: number, dimensions?: Record<string, string | number>): void;
export declare function decrement(metricName: Types, value?: number, dimensions?: Record<string, string | number>): void;
export declare function gauge(metricName: Types, value?: number): void;
export declare function duration(metricName: Types, value: number): void;
export declare function time<T, E, F extends (...args: E[]) => Promise<T>>(metricName: Types, func: F): F;
