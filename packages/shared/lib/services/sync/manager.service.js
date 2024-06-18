var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SyncStatus, ScheduleStatus, SyncConfigType, SyncCommand, CommandToActivityLog } from '@nangohq/models/Sync.js';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { getLogger, stringifyError } from '@nangohq/utils';
import { deleteSyncConfig, deleteSyncFilesForConfig, getSyncConfig } from './config/config.service.js';
import connectionService from '../connection.service.js';
import { deleteScheduleForSync, getSchedule, updateScheduleStatus } from './schedule.service.js';
import { getLatestSyncJob } from './job.service.js';
import telemetry, { LogTypes } from '../../utils/telemetry.js';
import { createSync, getSyncsByConnectionId, getSyncsByProviderConfigKey, getSyncsByProviderConfigAndSyncNames, getSyncByIdAndName, getSyncNamesByConnectionId, softDeleteSync } from './sync.service.js';
import { createActivityLogMessageAndEnd, createActivityLog, createActivityLogMessage, updateSuccess as updateSuccessActivityLog } from '../activity/activity.service.js';
import { errorNotificationService } from '../notification/error.service.js';
import SyncClient from '../../clients/sync.client.js';
import configService from '../config.service.js';
import { NangoError } from '../../utils/error.js';
import environmentService from '../environment.service.js';
import { featureFlags } from '../../index.js';
// Should be in "logs" package but impossible thanks to CLI
export const syncCommandToOperation = {
    PAUSE: 'pause',
    UNPAUSE: 'unpause',
    RUN: 'request_run',
    RUN_FULL: 'request_run_full',
    CANCEL: 'cancel'
};
const logger = getLogger('sync.manager');
export class SyncManagerService {
    createSyncForConnection(nangoConnectionId, logContextGetter, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            const nangoConnection = (yield connectionService.getConnectionById(nangoConnectionId));
            const nangoConfig = yield getSyncConfig(nangoConnection);
            if (!nangoConfig) {
                logger.error('Failed to load the Nango config - will not start any syncs! If you expect to see a sync make sure you used the nango cli deploy command');
                return;
            }
            const { integrations } = nangoConfig;
            const providerConfigKey = nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key;
            if (!integrations[providerConfigKey]) {
                return;
            }
            const syncClient = yield SyncClient.getInstance();
            if (!syncClient) {
                return;
            }
            const providerConfig = (yield configService.getProviderConfig(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key, nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id));
            const syncObject = integrations[providerConfigKey];
            const syncNames = Object.keys(syncObject);
            for (const syncName of syncNames) {
                const syncData = syncObject[syncName];
                if (!syncData.enabled) {
                    continue;
                }
                const sync = yield createSync(nangoConnectionId, syncName);
                if (sync) {
                    yield orchestrator.scheduleSyncHelper(nangoConnection, sync, providerConfig, syncName, syncData, logContextGetter);
                }
            }
        });
    }
    createSyncForConnections(connections, syncName, providerConfigKey, environmentId, sync, logContextGetter, orchestrator, debug = false, activityLogId, logCtx) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const syncConfig = yield configService.getProviderConfig(providerConfigKey, environmentId);
                if (debug && activityLogId) {
                    yield createActivityLogMessage({
                        level: 'debug',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Beginning iteration of starting syncs for ${syncName} with ${connections.length} connections`
                    });
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(`Beginning iteration of starting syncs for ${syncName} with ${connections.length} connections`));
                }
                for (const connection of connections) {
                    const syncExists = yield getSyncByIdAndName(connection.id, syncName);
                    if (syncExists) {
                        continue;
                    }
                    const createdSync = yield createSync(connection.id, syncName);
                    orchestrator.scheduleSyncHelper(connection, createdSync, syncConfig, syncName, Object.assign(Object.assign({}, sync), { returns: sync.models, input: '' }), logContextGetter, debug);
                }
                if (debug && activityLogId) {
                    yield createActivityLogMessage({
                        level: 'debug',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Finished iteration of starting syncs for ${syncName} with ${connections.length} connections`
                    });
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(`Finished iteration of starting syncs for ${syncName} with ${connections.length} connections`));
                }
                return true;
            }
            catch (e) {
                const prettyError = stringifyError(e, { pretty: true });
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id: environmentId,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `Error starting syncs for ${syncName} with ${connections.length} connections: ${prettyError}`
                });
                yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(`Error starting syncs for ${syncName} with ${connections.length} connections`, { error: e }));
                return false;
            }
        });
    }
    createSyncs(syncArgs, logContextGetter, orchestrator, debug = false, activityLogId, logCtx) {
        return __awaiter(this, void 0, void 0, function* () {
            let success = true;
            for (const syncToCreate of syncArgs) {
                const { connections, providerConfigKey, environmentId, sync, syncName } = syncToCreate;
                const result = yield this.createSyncForConnections(connections, syncName, providerConfigKey, environmentId, sync, logContextGetter, orchestrator, debug, activityLogId, logCtx);
                if (!result) {
                    success = false;
                }
            }
            return success;
        });
    }
    /**
     * Delete
     * @desc delete a sync and all the related objects
     * 1) sync config files
     * 2) sync config
     */
    deleteConfig(syncConfigId, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield deleteSyncFilesForConfig(syncConfigId, environmentId);
            yield deleteSyncConfig(syncConfigId);
        });
    }
    softDeleteSync(syncId, environmentId, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            yield deleteScheduleForSync(syncId, environmentId); // TODO: legacy, to remove once temporal is removed
            yield orchestrator.deleteSync({ syncId, environmentId });
            yield softDeleteSync(syncId);
            yield errorNotificationService.sync.clearBySyncId({ sync_id: syncId });
        });
    }
    softDeleteSyncsByConnection(connection, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            const syncs = yield getSyncsByConnectionId(connection.id);
            if (!syncs) {
                return;
            }
            for (const sync of syncs) {
                yield this.softDeleteSync(sync.id, connection.environment_id, orchestrator);
            }
        });
    }
    deleteSyncsByProviderConfig(environmentId, providerConfigKey, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            const syncs = yield getSyncsByProviderConfigKey(environmentId, providerConfigKey);
            if (!syncs) {
                return;
            }
            for (const sync of syncs) {
                yield this.softDeleteSync(sync.id, environmentId, orchestrator);
            }
        });
    }
    runSyncCommand({ recordsService, orchestrator, environment, providerConfigKey, syncNames, command, logContextGetter, connectionId, initiator }) {
        return __awaiter(this, void 0, void 0, function* () {
            const action = CommandToActivityLog[command];
            const provider = yield configService.getProviderConfig(providerConfigKey, environment.id);
            const account = (yield environmentService.getAccountFromEnvironment(environment.id));
            const log = {
                level: 'info',
                success: false,
                action,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: connectionId || '',
                provider: provider.provider,
                provider_config_key: providerConfigKey,
                environment_id: environment.id
            };
            const activityLogId = yield createActivityLog(log);
            if (!activityLogId) {
                return { success: false, error: new NangoError('failed_to_create_activity_log'), response: false };
            }
            const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'sync', action: syncCommandToOperation[command] }, message: '' }, { account, environment, integration: { id: provider.id, name: provider.unique_key, provider: provider.provider } });
            if (connectionId) {
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environment.id);
                if (!success || !connection) {
                    return { success: false, error, response: false };
                }
                let syncs = syncNames;
                if (syncs.length === 0) {
                    syncs = yield getSyncNamesByConnectionId(connection.id);
                }
                for (const syncName of syncs) {
                    const sync = yield getSyncByIdAndName(connection.id, syncName);
                    if (!sync) {
                        throw new Error(`Sync "${syncName}" doesn't exists.`);
                    }
                    const schedule = yield getSchedule(sync.id);
                    if (!schedule) {
                        continue;
                    }
                    yield orchestrator.runSyncCommandHelper({
                        scheduleId: schedule.schedule_id,
                        syncId: sync === null || sync === void 0 ? void 0 : sync.id,
                        command,
                        activityLogId,
                        environmentId: environment.id,
                        providerConfigKey,
                        connectionId,
                        syncName,
                        nangoConnectionId: connection.id,
                        logCtx,
                        recordsService,
                        initiator
                    });
                    // if they're triggering a sync that shouldn't change the schedule status
                    if (command !== SyncCommand.RUN) {
                        yield updateScheduleStatus(schedule.schedule_id, command, activityLogId, environment.id, logCtx);
                    }
                }
            }
            else {
                const syncs = syncNames.length > 0
                    ? yield getSyncsByProviderConfigAndSyncNames(environment.id, providerConfigKey, syncNames)
                    : yield getSyncsByProviderConfigKey(environment.id, providerConfigKey);
                if (!syncs) {
                    const error = new NangoError('no_syncs_found');
                    return { success: false, error, response: false };
                }
                for (const sync of syncs) {
                    const schedule = yield getSchedule(sync.id);
                    if (!schedule) {
                        continue;
                    }
                    const connection = yield connectionService.getConnectionById(sync.nango_connection_id);
                    if (!connection) {
                        continue;
                    }
                    yield orchestrator.runSyncCommandHelper({
                        scheduleId: schedule.schedule_id,
                        syncId: sync.id,
                        command,
                        activityLogId,
                        environmentId: environment.id,
                        providerConfigKey,
                        connectionId: connection.connection_id,
                        syncName: sync.name,
                        nangoConnectionId: connection.id,
                        logCtx,
                        recordsService,
                        initiator
                    });
                    if (command !== SyncCommand.RUN) {
                        yield updateScheduleStatus(schedule.schedule_id, command, activityLogId, environment.id, logCtx);
                    }
                }
            }
            yield createActivityLogMessageAndEnd({
                level: 'info',
                environment_id: environment.id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `Sync was updated with command: "${action}" for sync: ${syncNames.join(', ')}`
            });
            yield updateSuccessActivityLog(activityLogId, true);
            yield logCtx.info('Sync was successfully updated', { action, syncNames });
            yield logCtx.success();
            return { success: true, error: null, response: true };
        });
    }
    getSyncStatus(environmentId, providerConfigKey, syncNames, orchestrator, connectionId, includeJobStatus = false, optionalConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            const syncsWithStatus = [];
            let connection = optionalConnection;
            if (connectionId && !connection) {
                const connectionResult = yield connectionService.getConnection(connectionId, providerConfigKey, environmentId);
                if (!connectionResult.success || !connectionResult.response) {
                    return { success: false, error: connectionResult.error, response: null };
                }
                connection = connectionResult.response;
            }
            if (connection) {
                for (const syncName of syncNames) {
                    const sync = yield getSyncByIdAndName(connection === null || connection === void 0 ? void 0 : connection.id, syncName);
                    if (!sync) {
                        continue;
                    }
                    const reportedStatus = yield this.syncStatus(sync, environmentId, includeJobStatus, orchestrator);
                    syncsWithStatus.push(reportedStatus);
                }
            }
            else {
                const syncs = syncNames.length > 0
                    ? yield getSyncsByProviderConfigAndSyncNames(environmentId, providerConfigKey, syncNames)
                    : yield getSyncsByProviderConfigKey(environmentId, providerConfigKey);
                if (!syncs) {
                    return { success: true, error: null, response: syncsWithStatus };
                }
                for (const sync of syncs) {
                    const reportedStatus = yield this.syncStatus(sync, environmentId, includeJobStatus, orchestrator);
                    syncsWithStatus.push(reportedStatus);
                }
            }
            return { success: true, error: null, response: syncsWithStatus };
        });
    }
    /**
     * Classify Sync Status
     * @desc categornize the different scenarios of sync status
     * 1. If the schedule is paused and the job is not running, then the sync is paused
     * 2. If the schedule is paused and the job is not running then the sync is stopped (last return case)
     * 3. If the schedule is running but the last job is null then it is an error
     * 4. If the job status is stopped then it is an error
     * 5. If the job status is running then it is running
     * 6. If the job status is success then it is success
     */
    legacyClassifySyncStatus(jobStatus, scheduleStatus) {
        if (scheduleStatus === ScheduleStatus.PAUSED && jobStatus !== SyncStatus.RUNNING) {
            return SyncStatus.PAUSED;
        }
        else if (scheduleStatus === ScheduleStatus.RUNNING && jobStatus === null) {
            return SyncStatus.ERROR;
        }
        else if (jobStatus === SyncStatus.STOPPED) {
            return SyncStatus.ERROR;
        }
        else if (jobStatus === SyncStatus.RUNNING) {
            return SyncStatus.RUNNING;
        }
        else if (jobStatus === SyncStatus.SUCCESS) {
            return SyncStatus.SUCCESS;
        }
        return SyncStatus.STOPPED;
    }
    classifySyncStatus(jobStatus, scheduleState) {
        if (jobStatus === SyncStatus.RUNNING) {
            return SyncStatus.RUNNING;
        }
        switch (scheduleState) {
            case 'PAUSED':
                return SyncStatus.PAUSED;
            case 'STARTED':
                if (jobStatus === SyncStatus.STOPPED) {
                    // job status doesn't have a ERROR status
                    return SyncStatus.ERROR;
                }
                return jobStatus || SyncStatus.SUCCESS;
            default:
                return SyncStatus.STOPPED;
        }
    }
    /**
     * Trigger If Connections Exist
     * @desc for the recently deploy flows, create the sync and trigger it if there are connections
     */
    triggerIfConnectionsExist(flows, environmentId, logContextGetter, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const flow of flows) {
                if (flow.type === SyncConfigType.ACTION) {
                    continue;
                }
                const existingConnections = yield connectionService.getConnectionsByEnvironmentAndConfig(environmentId, flow.providerConfigKey);
                if (existingConnections.length === 0) {
                    continue;
                }
                const { providerConfigKey } = flow;
                const name = flow.name || flow.syncName;
                yield this.createSyncForConnections(existingConnections, name, providerConfigKey, environmentId, flow, logContextGetter, orchestrator, false);
            }
        });
    }
    syncStatus(sync, environmentId, includeJobStatus, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
            const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${environmentId}`, false);
            const isOrchestrator = isGloballyEnabled || isEnvEnabled;
            if (isOrchestrator) {
                const latestJob = yield getLatestSyncJob(sync.id);
                const schedules = yield orchestrator.searchSchedules([{ syncId: sync.id, environmentId }]);
                if (schedules.isErr()) {
                    throw new Error(`Failed to get schedule for sync ${sync.id} in environment ${environmentId}: ${stringifyError(schedules.error)}`);
                }
                const schedule = schedules.value.get(sync.id);
                if (!schedule) {
                    throw new Error(`Schedule for sync ${sync.id} and environment ${environmentId} not found`);
                }
                return Object.assign({ id: sync.id, type: latestJob === null || latestJob === void 0 ? void 0 : latestJob.type, finishedAt: latestJob === null || latestJob === void 0 ? void 0 : latestJob.updated_at, nextScheduledSyncAt: schedule.nextDueDate, name: sync.name, status: this.classifySyncStatus(latestJob === null || latestJob === void 0 ? void 0 : latestJob.status, schedule.state), frequency: sync.frequency, latestResult: latestJob === null || latestJob === void 0 ? void 0 : latestJob.result, latestExecutionStatus: latestJob === null || latestJob === void 0 ? void 0 : latestJob.status }, (includeJobStatus ? { jobStatus: latestJob === null || latestJob === void 0 ? void 0 : latestJob.status } : {}));
            }
            return this.legacySyncStatus(sync, environmentId, includeJobStatus);
        });
    }
    legacySyncStatus(sync, environmentId, includeJobStatus) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            const syncClient = yield SyncClient.getInstance();
            const schedule = yield getSchedule(sync.id);
            const latestJob = yield getLatestSyncJob(sync.id);
            let status = this.legacyClassifySyncStatus(latestJob === null || latestJob === void 0 ? void 0 : latestJob.status, schedule === null || schedule === void 0 ? void 0 : schedule.status);
            const syncSchedule = yield (syncClient === null || syncClient === void 0 ? void 0 : syncClient.describeSchedule(schedule === null || schedule === void 0 ? void 0 : schedule.schedule_id));
            if (syncSchedule) {
                if (((_b = (_a = syncSchedule === null || syncSchedule === void 0 ? void 0 : syncSchedule.schedule) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.paused) && (schedule === null || schedule === void 0 ? void 0 : schedule.status) === ScheduleStatus.RUNNING) {
                    yield updateScheduleStatus(schedule === null || schedule === void 0 ? void 0 : schedule.id, SyncCommand.PAUSE, null, environmentId);
                    if (status !== SyncStatus.RUNNING) {
                        status = SyncStatus.PAUSED;
                    }
                    yield telemetry.log(LogTypes.TEMPORAL_SCHEDULE_MISMATCH_NOT_RUNNING, 'API: Schedule is marked as paused in temporal but not in the database. The schedule has been updated in the database to be paused.', LogActionEnum.SYNC, {
                        environmentId: String(environmentId),
                        syncId: sync.id,
                        scheduleId: String(schedule === null || schedule === void 0 ? void 0 : schedule.schedule_id),
                        level: 'warn'
                    }, `syncId:${sync.id}`);
                }
                else if (!((_d = (_c = syncSchedule === null || syncSchedule === void 0 ? void 0 : syncSchedule.schedule) === null || _c === void 0 ? void 0 : _c.state) === null || _d === void 0 ? void 0 : _d.paused) && status === SyncStatus.PAUSED) {
                    yield updateScheduleStatus(schedule === null || schedule === void 0 ? void 0 : schedule.id, SyncCommand.UNPAUSE, null, environmentId);
                    status = SyncStatus.STOPPED;
                    yield telemetry.log(LogTypes.TEMPORAL_SCHEDULE_MISMATCH_NOT_PAUSED, 'API: Schedule is marked as running in temporal but not in the database. The schedule has been updated in the database to be running.', LogActionEnum.SYNC, {
                        environmentId: String(environmentId),
                        syncId: sync.id,
                        scheduleId: String(schedule === null || schedule === void 0 ? void 0 : schedule.schedule_id),
                        level: 'warn'
                    }, `syncId:${sync.id}`);
                }
            }
            let nextScheduledSyncAt = null;
            if (status !== SyncStatus.PAUSED) {
                if (syncSchedule && (syncSchedule === null || syncSchedule === void 0 ? void 0 : syncSchedule.info) && (syncSchedule === null || syncSchedule === void 0 ? void 0 : syncSchedule.info.futureActionTimes) && ((_f = (_e = syncSchedule === null || syncSchedule === void 0 ? void 0 : syncSchedule.info) === null || _e === void 0 ? void 0 : _e.futureActionTimes) === null || _f === void 0 ? void 0 : _f.length) > 0) {
                    const futureRun = syncSchedule.info.futureActionTimes[0];
                    nextScheduledSyncAt = (syncClient === null || syncClient === void 0 ? void 0 : syncClient.formatFutureRun((_g = futureRun === null || futureRun === void 0 ? void 0 : futureRun.seconds) === null || _g === void 0 ? void 0 : _g.toNumber())) || null;
                }
            }
            const reportedStatus = {
                id: sync === null || sync === void 0 ? void 0 : sync.id,
                type: latestJob === null || latestJob === void 0 ? void 0 : latestJob.type,
                finishedAt: latestJob === null || latestJob === void 0 ? void 0 : latestJob.updated_at,
                nextScheduledSyncAt,
                name: sync === null || sync === void 0 ? void 0 : sync.name,
                status,
                frequency: schedule === null || schedule === void 0 ? void 0 : schedule.frequency,
                latestResult: latestJob === null || latestJob === void 0 ? void 0 : latestJob.result,
                latestExecutionStatus: latestJob === null || latestJob === void 0 ? void 0 : latestJob.status
            };
            if (includeJobStatus) {
                reportedStatus['jobStatus'] = latestJob === null || latestJob === void 0 ? void 0 : latestJob.status;
            }
            return reportedStatus;
        });
    }
}
export default new SyncManagerService();
//# sourceMappingURL=manager.service.js.map