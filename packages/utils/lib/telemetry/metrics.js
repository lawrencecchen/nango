import tracer from 'dd-trace';
export var Types;
(function (Types) {
    Types["ACTION_EXECUTION"] = "nango.jobs.actionExecution";
    Types["ACTION_TRACK_RUNTIME"] = "action_track_runtime";
    Types["AUTH_GET_ENV_BY_SECRET_KEY"] = "nango.auth.getEnvBySecretKey";
    Types["AUTH_PUBLIC_KEY"] = "nango.auth.publicKey";
    Types["AUTH_SESSION"] = "nango.auth.session";
    Types["DB_POOL_ACQUISITION_DURATION"] = "nango.db.pool.acquisition";
    Types["DB_POOL_FREE"] = "nango.db.pool.free";
    Types["DB_POOL_USED"] = "nango.db.pool.used";
    Types["DB_POOL_WAITING"] = "nango.db.pool.waiting";
    Types["GET_CONNECTION"] = "nango.server.getConnection";
    Types["JOBS_CLEAN_ACTIVITY_LOGS"] = "nango.jobs.cron.cleanActivityLogs";
    Types["JOBS_DELETE_SYNCS_DATA"] = "nango.jobs.cron.deleteSyncsData";
    Types["JOBS_DELETE_SYNCS_DATA_DELETES"] = "nango.jobs.cron.deleteSyncsData.deletes";
    Types["JOBS_DELETE_SYNCS_DATA_JOBS"] = "nango.jobs.cron.deleteSyncsData.jobs";
    Types["JOBS_DELETE_SYNCS_DATA_RECORDS"] = "nango.jobs.cron.deleteSyncsData.records";
    Types["JOBS_DELETE_SYNCS_DATA_SCHEDULES"] = "nango.jobs.cron.deleteSyncsData.schedules";
    Types["LOGS_LOG"] = "nango.logs.log";
    Types["PERSIST_RECORDS_COUNT"] = "nango.persist.records.count";
    Types["PERSIST_RECORDS_SIZE_IN_BYTES"] = "nango.persist.records.sizeInBytes";
    Types["POST_CONNECTION_SCRIPT_RUNTIME"] = "nango.jobs.postConnectionScriptRuntime";
    Types["PROXY"] = "nango.server.proxyCall";
    Types["REFRESH_TOKENS"] = "nango.server.cron.refreshTokens";
    Types["REFRESH_TOKENS_FAILED"] = "nango.server.cron.refreshTokens.failed";
    Types["REFRESH_TOKENS_SUCCESS"] = "nango.server.cron.refreshTokens.success";
    Types["RUNNER_SDK"] = "nango.runner.sdk";
    Types["RENCONCILE_TEMPORAL_SCHEDULES"] = "nango.jobs.cron.reconcileTemporalSchedules";
    Types["RENCONCILE_TEMPORAL_SCHEDULES_FAILED"] = "nango.jobs.cron.reconcileTemporalSchedules.failed";
    Types["RENCONCILE_TEMPORAL_SCHEDULES_SUCCESS"] = "nango.jobs.cron.reconcileTemporalSchedules.success";
    Types["SYNC_EXECUTION"] = "nango.jobs.syncExecution";
    Types["SYNC_TRACK_RUNTIME"] = "sync_script_track_runtime";
    Types["WEBHOOK_EXECUTION"] = "nango.jobs.webhookExecution";
    Types["WEBHOOK_TRACK_RUNTIME"] = "webhook_track_runtime";
})(Types = Types || (Types = {}));
export function increment(metricName, value = 1, dimensions) {
    tracer.dogstatsd.increment(metricName, value, dimensions !== null && dimensions !== void 0 ? dimensions : {});
}
export function decrement(metricName, value = 1, dimensions) {
    tracer.dogstatsd.decrement(metricName, value, dimensions !== null && dimensions !== void 0 ? dimensions : {});
}
export function gauge(metricName, value) {
    tracer.dogstatsd.gauge(metricName, value !== null && value !== void 0 ? value : 1);
}
export function duration(metricName, value) {
    tracer.dogstatsd.distribution(metricName, value);
}
export function time(metricName, func) {
    const computeDuration = (start) => {
        const durationComponents = process.hrtime(start);
        const seconds = durationComponents[0];
        const nanoseconds = durationComponents[1];
        const total = seconds * 1000 + nanoseconds / 1e6;
        duration(metricName, total);
    };
    // This function should handle both async/sync function
    // So it's try/catch regular execution and use .then() for async
    // @ts-expect-error can't fix this
    return function wrapped(...args) {
        const start = process.hrtime();
        try {
            const res = func(...args);
            if (res[Symbol.toStringTag] === 'Promise') {
                return res.then((v) => {
                    computeDuration(start);
                    return v;
                }, (err) => {
                    computeDuration(start);
                    throw err;
                });
            }
            return res;
        }
        catch (err) {
            computeDuration(start);
            throw err;
        }
    };
}
//# sourceMappingURL=metrics.js.map