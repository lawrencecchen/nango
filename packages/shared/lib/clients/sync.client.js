var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Client, Connection, ScheduleOverlapPolicy } from '@temporalio/client';
import ms from 'ms';
import fs from 'fs-extra';
import { isTest, isProd, Ok, Err, stringifyError } from '@nangohq/utils';
import { SyncStatus, SyncType, ScheduleStatus, SyncCommand } from '../models/Sync.js';
import { LogActionEnum } from '../models/Activity.js';
import { SYNC_TASK_QUEUE } from '../constants.js';
import { createActivityLog, createActivityLogMessage, createActivityLogMessageAndEnd, updateSuccess as updateSuccessActivityLog } from '../services/activity/activity.service.js';
import { isSyncJobRunning, createSyncJob, updateRunId } from '../services/sync/job.service.js';
import { getInterval } from '../services/nango-config.service.js';
import { getSyncConfigRaw } from '../services/sync/config/config.service.js';
import { updateOffset, createSchedule as createSyncSchedule, getScheduleById } from '../services/sync/schedule.service.js';
import { clearLastSyncDate } from '../services/sync/sync.service.js';
import errorManager, { ErrorSourceEnum } from '../utils/error.manager.js';
import { NangoError } from '../utils/error.js';
import environmentService from '../services/environment.service.js';
const generateWorkflowId = (sync, syncName, connectionId) => `${SYNC_TASK_QUEUE}.${syncName}.${connectionId}-${sync.id}`;
const generateScheduleId = (sync, syncName, connectionId) => `${SYNC_TASK_QUEUE}.${syncName}.${connectionId}-schedule-${sync.id}`;
const OVERLAP_POLICY = ScheduleOverlapPolicy.BUFFER_ONE;
const namespace = process.env['TEMPORAL_NAMESPACE'] || 'default';
class SyncClient {
    constructor(client) {
        this.client = null;
        this.namespace = namespace;
        this.getClient = () => this.client;
        this.client = client;
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = this.create();
        }
        return this.instance;
    }
    static create() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isTest) {
                return new SyncClient(true);
            }
            const temporalAddress = process.env['TEMPORAL_ADDRESS'];
            if (!temporalAddress) {
                throw new Error('TEMPORAL_ADDRESS missing from env var');
            }
            try {
                const connection = yield Connection.connect({
                    address: temporalAddress,
                    tls: isProd
                        ? {
                            clientCertPair: {
                                crt: yield fs.readFile(`/etc/secrets/${namespace}.crt`),
                                key: yield fs.readFile(`/etc/secrets/${namespace}.key`)
                            }
                        }
                        : false
                });
                const client = new Client({
                    connection,
                    namespace
                });
                return new SyncClient(client);
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    metadata: {
                        namespace,
                        address: temporalAddress
                    }
                });
                return null;
            }
        });
    }
    /**
     * Start Continuous
     * @desc get the connection information and the provider information
     * and kick off an initial sync and also a incremental sync. Also look
     * up any sync configs to call any integration snippet that was setup
     */
    startContinuous(nangoConnection, sync, providerConfig, syncName, syncData, logContextGetter, shouldLog, debug = false) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let logCtx;
            try {
                const activityLogId = yield createActivityLog({
                    level: 'info',
                    success: null,
                    action: LogActionEnum.SYNC_INIT,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    connection_id: nangoConnection.connection_id,
                    provider_config_key: nangoConnection.provider_config_key,
                    provider: providerConfig.provider,
                    session_id: (_a = sync === null || sync === void 0 ? void 0 : sync.id) === null || _a === void 0 ? void 0 : _a.toString(),
                    environment_id: nangoConnection.environment_id,
                    operation_name: syncName
                });
                if (!activityLogId) {
                    return;
                }
                const syncConfig = yield getSyncConfigRaw({
                    environmentId: nangoConnection.environment_id,
                    config_id: providerConfig.id,
                    name: syncName,
                    isAction: false
                });
                const { account, environment } = (yield environmentService.getAccountAndEnvironment({ environmentId: nangoConnection.environment_id }));
                logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'sync', action: 'init' }, message: 'Sync initialization' }, {
                    account,
                    environment,
                    integration: { id: providerConfig.id, name: providerConfig.unique_key, provider: providerConfig.provider },
                    connection: { id: nangoConnection.id, name: nangoConnection.connection_id },
                    syncConfig: { id: syncConfig.id, name: syncConfig.sync_name }
                }, { dryRun: shouldLog });
                const { success, error, response } = getInterval(syncData.runs, new Date());
                if (!success || response === null) {
                    const content = `The sync was not created or started due to an error with the sync interval "${syncData.runs}": ${error === null || error === void 0 ? void 0 : error.message}`;
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: nangoConnection.environment_id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content
                    });
                    yield logCtx.error('The sync was not created or started due to an error with the sync interval', { error, runs: syncData.runs });
                    yield logCtx.failed();
                    errorManager.report(content, {
                        source: ErrorSourceEnum.CUSTOMER,
                        operation: LogActionEnum.SYNC_CLIENT,
                        environmentId: nangoConnection.environment_id,
                        metadata: {
                            connectionDetails: nangoConnection,
                            providerConfig,
                            syncName,
                            sync,
                            syncData
                        }
                    });
                    yield updateSuccessActivityLog(activityLogId, false);
                    return;
                }
                const jobId = generateWorkflowId(sync, syncName, nangoConnection.connection_id);
                if (syncData.auto_start !== false) {
                    if (debug) {
                        yield createActivityLogMessage({
                            level: 'debug',
                            environment_id: nangoConnection.environment_id,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: `Creating sync job ${jobId} for sync ${sync.id}`
                        });
                        yield logCtx.debug('Creating sync job', { jobId, syncId: sync.id });
                    }
                    const res = yield this.triggerInitialSync({ jobId, nangoConnection, syncId: sync.id, syncName, debug });
                    if (!res) {
                        throw new NangoError('failed_to_start_initial_sync');
                    }
                }
                else {
                    yield createSyncJob(sync.id, SyncType.INITIAL, SyncStatus.PAUSED, jobId, nangoConnection);
                }
                const { interval, offset } = response;
                const scheduleId = generateScheduleId(sync, syncName, nangoConnection.connection_id);
                const scheduleHandle = yield ((_b = this.client) === null || _b === void 0 ? void 0 : _b.schedule.create({
                    scheduleId,
                    policies: {
                        overlap: OVERLAP_POLICY
                    },
                    spec: {
                        /**
                         * @see https://nodejs.temporal.io/api/interfaces/client.IntervalSpec
                         */
                        intervals: [
                            {
                                every: interval,
                                offset
                            }
                        ]
                    },
                    action: {
                        type: 'startWorkflow',
                        workflowType: 'continuousSync',
                        taskQueue: SYNC_TASK_QUEUE,
                        args: [
                            {
                                syncId: sync.id,
                                nangoConnection,
                                syncName,
                                debug
                            }
                        ]
                    }
                }));
                if (syncData.auto_start === false && scheduleHandle) {
                    yield scheduleHandle.pause(`schedule for sync '${sync.id}' paused at ${new Date().toISOString()}. Reason: auto_start is false`);
                }
                yield createSyncSchedule(sync.id, interval, offset, syncData.auto_start === false ? ScheduleStatus.PAUSED : ScheduleStatus.RUNNING, scheduleId);
                if (scheduleHandle) {
                    yield createActivityLogMessageAndEnd({
                        level: 'info',
                        environment_id: nangoConnection.environment_id,
                        activity_log_id: activityLogId,
                        content: `Scheduled to run "${syncData.runs}"`,
                        timestamp: Date.now()
                    });
                    yield logCtx.info('Scheduled successfully', { runs: syncData.runs });
                }
                yield updateSuccessActivityLog(activityLogId, true);
                yield logCtx.success();
            }
            catch (err) {
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId: nangoConnection.environment_id,
                    metadata: {
                        syncName,
                        connectionDetails: JSON.stringify(nangoConnection),
                        syncId: sync.id,
                        providerConfig,
                        syncData: JSON.stringify(syncData)
                    }
                });
                if (logCtx) {
                    yield logCtx.error('Failed to init sync', { error: err });
                    yield logCtx.failed();
                }
            }
        });
    }
    deleteSyncSchedule(id, environmentId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return false;
            }
            const workflowService = (_a = this.client) === null || _a === void 0 ? void 0 : _a.workflowService;
            try {
                yield (workflowService === null || workflowService === void 0 ? void 0 : workflowService.deleteSchedule({
                    scheduleId: id,
                    namespace: this.namespace
                }));
                return true;
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC,
                    environmentId,
                    metadata: {
                        id
                    }
                });
                return false;
            }
        });
    }
    describeSchedule(schedule_id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return;
            }
            const workflowService = (_a = this.client) === null || _a === void 0 ? void 0 : _a.workflowService;
            try {
                const schedule = yield (workflowService === null || workflowService === void 0 ? void 0 : workflowService.describeSchedule({
                    scheduleId: schedule_id,
                    namespace: this.namespace
                }));
                return schedule;
            }
            catch (_b) {
                return false;
            }
        });
    }
    formatFutureRun(nextRun) {
        if (!nextRun) {
            return '-';
        }
        const milliseconds = Number(nextRun) * 1000;
        const date = new Date(milliseconds);
        return date;
    }
    runSyncCommand({ scheduleId, syncId, command, activityLogId, environmentId, providerConfigKey, connectionId, syncName, nangoConnectionId, logCtx, recordsService, initiator }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const scheduleHandle = (_a = this.client) === null || _a === void 0 ? void 0 : _a.schedule.getHandle(scheduleId);
            try {
                switch (command) {
                    case SyncCommand.CANCEL:
                        {
                            const result = yield this.cancelSync(syncId);
                            if (result.isErr()) {
                                return result;
                            }
                        }
                        break;
                    case SyncCommand.PAUSE:
                        {
                            yield (scheduleHandle === null || scheduleHandle === void 0 ? void 0 : scheduleHandle.pause(`${initiator} paused the schedule for sync '${syncId}' at ${new Date().toISOString()}`));
                        }
                        break;
                    case SyncCommand.UNPAUSE:
                        {
                            yield (scheduleHandle === null || scheduleHandle === void 0 ? void 0 : scheduleHandle.unpause(`${initiator} unpaused the schedule for sync '${syncId}' at ${new Date().toISOString()}`));
                            yield (scheduleHandle === null || scheduleHandle === void 0 ? void 0 : scheduleHandle.trigger(OVERLAP_POLICY));
                            const schedule = yield getScheduleById(scheduleId);
                            if (schedule) {
                                const { frequency } = schedule;
                                const { success, response } = getInterval(frequency, new Date());
                                if (success && response) {
                                    const { offset } = response;
                                    yield this.updateSyncSchedule(scheduleId, frequency, offset, environmentId);
                                    yield updateOffset(scheduleId, offset);
                                }
                            }
                        }
                        break;
                    case SyncCommand.RUN:
                        yield (scheduleHandle === null || scheduleHandle === void 0 ? void 0 : scheduleHandle.trigger(OVERLAP_POLICY));
                        break;
                    case SyncCommand.RUN_FULL:
                        {
                            // we just want to try and cancel if the sync is running
                            // so we don't care about the result
                            yield this.cancelSync(syncId);
                            yield clearLastSyncDate(syncId);
                            const del = yield recordsService.deleteRecordsBySyncId({ syncId });
                            yield createActivityLogMessage({
                                level: 'info',
                                environment_id: environmentId,
                                activity_log_id: activityLogId,
                                timestamp: Date.now(),
                                content: `Records for the sync were deleted successfully`
                            });
                            yield logCtx.info(`Records for the sync were deleted successfully`, del);
                            const nangoConnection = {
                                id: nangoConnectionId,
                                provider_config_key: providerConfigKey,
                                connection_id: connectionId,
                                environment_id: environmentId
                            };
                            yield this.triggerInitialSync({ syncId, nangoConnection, syncName });
                        }
                        break;
                }
                return Ok(true);
            }
            catch (err) {
                const errorMessage = stringifyError(err, { pretty: true });
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environmentId,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `The sync command: ${command} failed with error: ${errorMessage}`
                });
                yield logCtx.error(`Sync command failed "${command}"`, { error: err, command });
                return Err(err);
            }
        });
    }
    cancelSync(syncId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const jobIsRunning = yield isSyncJobRunning(syncId);
            if (jobIsRunning) {
                const { job_id, run_id } = jobIsRunning;
                if (!run_id) {
                    const error = new NangoError('run_id_not_found');
                    return Err(error);
                }
                const workflowHandle = (_a = this.client) === null || _a === void 0 ? void 0 : _a.workflow.getHandle(job_id, run_id);
                if (!workflowHandle) {
                    const error = new NangoError('run_id_not_found');
                    return Err(error);
                }
                try {
                    yield workflowHandle.cancel();
                    // We await the results otherwise it might not be cancelled yet
                    yield workflowHandle.result();
                }
                catch (err) {
                    return Err(new NangoError('failed_to_cancel_sync', err));
                }
            }
            else {
                const error = new NangoError('sync_job_not_running');
                return Err(error);
            }
            return Ok(true);
        });
    }
    triggerSyncs(syncs, environmentId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            for (const sync of syncs) {
                try {
                    const scheduleHandle = (_a = this.client) === null || _a === void 0 ? void 0 : _a.schedule.getHandle(sync.schedule_id);
                    yield (scheduleHandle === null || scheduleHandle === void 0 ? void 0 : scheduleHandle.trigger(OVERLAP_POLICY));
                }
                catch (e) {
                    errorManager.report(e, {
                        source: ErrorSourceEnum.PLATFORM,
                        operation: LogActionEnum.SYNC_CLIENT,
                        environmentId,
                        metadata: {
                            syncs
                        }
                    });
                }
            }
        });
    }
    updateSyncSchedule(schedule_id, interval, offset, environmentId, syncName, activityLogId, logCtx) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            function updateFunction(scheduleDescription) {
                scheduleDescription.spec = {
                    intervals: [
                        {
                            every: ms(interval),
                            offset
                        }
                    ]
                };
                return scheduleDescription;
            }
            try {
                const scheduleHandle = (_a = this.client) === null || _a === void 0 ? void 0 : _a.schedule.getHandle(schedule_id);
                yield (scheduleHandle === null || scheduleHandle === void 0 ? void 0 : scheduleHandle.update(updateFunction));
                if (activityLogId && syncName) {
                    yield createActivityLogMessage({
                        level: 'info',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content: `Updated sync "${syncName}" schedule "${schedule_id}" with interval ${interval} and offset ${offset}.`,
                        timestamp: Date.now()
                    });
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.info(`Updated sync "${syncName}" schedule "${schedule_id}" with interval ${interval} and offset ${offset}`));
                }
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId,
                    metadata: {
                        syncName,
                        schedule_id,
                        interval,
                        offset
                    }
                });
            }
        });
    }
    triggerInitialSync({ syncId, jobId, syncName, nangoConnection, debug }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            jobId = jobId || generateWorkflowId({ id: syncId }, syncName, nangoConnection.connection_id);
            const syncJobId = yield createSyncJob(syncId, SyncType.INITIAL, SyncStatus.RUNNING, jobId, nangoConnection);
            if (!syncJobId) {
                return false;
            }
            const args = { syncId: syncId, syncJobId: syncJobId.id, nangoConnection, syncName, debug: debug === true };
            const handle = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.workflow.start('initialSync', {
                taskQueue: SYNC_TASK_QUEUE,
                workflowId: jobId,
                args: [args]
            }));
            if (!handle) {
                return false;
            }
            yield updateRunId(syncJobId.id, handle.firstExecutionRunId);
            return true;
        });
    }
}
export default SyncClient;
//# sourceMappingURL=sync.client.js.map