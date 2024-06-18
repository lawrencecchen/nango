var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuidv4 } from 'uuid';
import db, { schema, dbNamespace } from '@nangohq/database';
import { SyncConfigType, SyncStatus, SyncCommand, ScheduleStatus } from '@nangohq/models/Sync.js';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { stringifyError } from '@nangohq/utils';
import SyncClient from '../../clients/sync.client.js';
import { updateSuccess as updateSuccessActivityLog, createActivityLogMessage, createActivityLogMessageAndEnd } from '../activity/activity.service.js';
import { updateScheduleStatus } from './schedule.service.js';
import telemetry, { LogTypes } from '../../utils/telemetry.js';
import { getActiveCustomSyncConfigsByEnvironmentId, getSyncConfigsByProviderConfigKey, getActionConfigByNameAndProviderConfigKey } from './config/config.service.js';
import syncManager from './manager.service.js';
import connectionService from '../connection.service.js';
import { DEMO_GITHUB_CONFIG_KEY, DEMO_SYNC_NAME } from '../onboarding.service.js';
import { featureFlags } from '../../index.js';
const TABLE = dbNamespace + 'syncs';
const SYNC_JOB_TABLE = dbNamespace + 'sync_jobs';
const SYNC_SCHEDULE_TABLE = dbNamespace + 'sync_schedules';
const SYNC_CONFIG_TABLE = dbNamespace + 'sync_configs';
const ACTIVITY_LOG_TABLE = dbNamespace + 'activity_logs';
const ACTIVE_LOG_TABLE = dbNamespace + 'active_logs';
/**
 * Sync Service
 * @description
 *  A Sync is active Nango Sync on the connection level that has:
 *  - collection of sync jobs (initial or incremental)
 *  - sync schedule
 *  - bunch of sync data records
 *
 *  A Sync config is a separate entity that is not necessarily active on the
 *  provider level that has no direction to a sync
 *  A Sync job can connect a sync and a sync config as it has both a `sync_id`
 * and `sync_config_id`
 *
 */
export const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.knex.select('*').from(TABLE).where({ id, deleted: false });
    if (!result || result.length == 0 || !result[0]) {
        return null;
    }
    return result[0];
});
export const createSync = (nangoConnectionId, name) => __awaiter(void 0, void 0, void 0, function* () {
    const existingSync = yield getSyncByIdAndName(nangoConnectionId, name);
    if (existingSync) {
        return null;
    }
    const sync = {
        id: uuidv4(),
        nango_connection_id: nangoConnectionId,
        name,
        frequency: null,
        last_sync_date: null,
        last_fetched_at: null
    };
    const result = yield schema().from(TABLE).insert(sync).returning('*');
    if (!result || result.length == 0 || !result[0]) {
        return null;
    }
    return result[0];
});
export const getLastSyncDate = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema().select('last_sync_date').from(TABLE).where({
        id,
        deleted: false
    });
    if (!result || result.length == 0 || !result[0]) {
        return null;
    }
    return result[0].last_sync_date;
});
export const clearLastSyncDate = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield schema()
        .from(TABLE)
        .where({
        id,
        deleted: false
    })
        .update({
        last_sync_date: null
    });
});
export function setFrequency(id, frequency) {
    return __awaiter(this, void 0, void 0, function* () {
        yield schema().from(TABLE).where({ id }).update({
            frequency
        });
    });
}
/**
 * Set Last Sync Date
 */
export const setLastSyncDate = (id, date) => __awaiter(void 0, void 0, void 0, function* () {
    yield schema().from(TABLE).where({ id, deleted: false }).update({ last_sync_date: date });
    return true;
});
/**
 * Get Last Sync Date
 * @desc this is the very end of the sync process so we know when the sync job
 * is completely finished
 */
export const getJobLastSyncDate = (sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .select('updated_at')
        .from(SYNC_JOB_TABLE)
        .where({
        sync_id,
        status: SyncStatus.SUCCESS,
        deleted: false
    })
        .orderBy('updated_at', 'desc')
        .first();
    if (!result) {
        return null;
    }
    const { updated_at } = result;
    return updated_at;
});
export const getSyncByIdAndName = (nangoConnectionId, name) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.knex.select('*').from(TABLE).where({
        nango_connection_id: nangoConnectionId,
        name,
        deleted: false
    });
    if (Array.isArray(result) && result.length > 0) {
        return result[0];
    }
    return null;
});
export const getSyncsFlat = (nangoConnection) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .select('*')
        .from(TABLE)
        .join(SYNC_SCHEDULE_TABLE, `${SYNC_SCHEDULE_TABLE}.sync_id`, `${TABLE}.id`)
        .where({
        nango_connection_id: nangoConnection.id,
        [`${SYNC_SCHEDULE_TABLE}.deleted`]: false,
        [`${TABLE}.deleted`]: false
    });
    if (Array.isArray(result) && result.length > 0) {
        return result;
    }
    return [];
});
export const getSyncsFlatWithNames = (nangoConnection, syncNames) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .select('*')
        .from(TABLE)
        .join(SYNC_SCHEDULE_TABLE, `${SYNC_SCHEDULE_TABLE}.sync_id`, `${TABLE}.id`)
        .where({
        nango_connection_id: nangoConnection.id,
        [`${SYNC_SCHEDULE_TABLE}.deleted`]: false,
        [`${TABLE}.deleted`]: false
    })
        .whereIn(`${TABLE}.name`, syncNames);
    if (Array.isArray(result) && result.length > 0) {
        return result;
    }
    return [];
});
/**
 * Get Syncs
 * @description get the sync related to the connection
 * the latest sync and its result and the next sync based on the schedule
 */
export const getSyncs = (nangoConnection, orchestrator) => __awaiter(void 0, void 0, void 0, function* () {
    const syncClient = yield SyncClient.getInstance();
    if (!syncClient || !nangoConnection || !nangoConnection.id) {
        return [];
    }
    const q = db.knex
        .from(TABLE)
        .select(`${TABLE}.*`, `${TABLE}.frequency as frequency_override`, `${SYNC_SCHEDULE_TABLE}.schedule_id`, `${SYNC_SCHEDULE_TABLE}.frequency`, `${SYNC_SCHEDULE_TABLE}.offset`, `${SYNC_SCHEDULE_TABLE}.status as schedule_status`, `${SYNC_CONFIG_TABLE}.models`, `${ACTIVE_LOG_TABLE}.activity_log_id as error_activity_log_id`, `${ACTIVE_LOG_TABLE}.log_id as error_log_id`, db.knex.raw(`
                CASE
                    WHEN COUNT(${ACTIVE_LOG_TABLE}.activity_log_id) = 0 THEN NULL
                    ELSE json_build_object(
                        'activity_log_id', ${ACTIVE_LOG_TABLE}.activity_log_id,
                        'log_id', ${ACTIVE_LOG_TABLE}.log_id
                    )
                END as active_logs
            `), db.knex.raw(`(
                    SELECT json_build_object(
                        'job_id', ${SYNC_JOB_TABLE}.id,
                        'created_at', ${SYNC_JOB_TABLE}.created_at,
                        'updated_at', ${SYNC_JOB_TABLE}.updated_at,
                        'type', ${SYNC_JOB_TABLE}.type,
                        'result', ${SYNC_JOB_TABLE}.result,
                        'status', ${SYNC_JOB_TABLE}.status,
                        'sync_config_id', ${SYNC_JOB_TABLE}.sync_config_id,
                        'version', ${SYNC_CONFIG_TABLE}.version,
                        'models', ${SYNC_CONFIG_TABLE}.models,
                        'activity_log_id', ${ACTIVITY_LOG_TABLE}.id
                    )
                    FROM ${SYNC_JOB_TABLE}
                    JOIN ${SYNC_CONFIG_TABLE} ON ${SYNC_CONFIG_TABLE}.id = ${SYNC_JOB_TABLE}.sync_config_id AND ${SYNC_CONFIG_TABLE}.deleted = false
                    LEFT JOIN ${ACTIVITY_LOG_TABLE} ON ${ACTIVITY_LOG_TABLE}.session_id = ${SYNC_JOB_TABLE}.id::text
                    WHERE ${SYNC_JOB_TABLE}.sync_id = ${TABLE}.id
                        AND ${SYNC_JOB_TABLE}.deleted = false
                    ORDER BY ${SYNC_JOB_TABLE}.updated_at DESC
                    LIMIT 1
                ) as latest_sync
                `))
        .join(SYNC_SCHEDULE_TABLE, function () {
        this.on(`${SYNC_SCHEDULE_TABLE}.sync_id`, `${TABLE}.id`).andOn(`${SYNC_SCHEDULE_TABLE}.deleted`, '=', db.knex.raw('FALSE'));
    })
        .leftJoin(ACTIVE_LOG_TABLE, function () {
        this.on(`${ACTIVE_LOG_TABLE}.sync_id`, `${TABLE}.id`).andOnVal(`${ACTIVE_LOG_TABLE}.active`, true).andOnVal(`${ACTIVE_LOG_TABLE}.type`, 'sync');
    })
        .join(SYNC_CONFIG_TABLE, function () {
        this.on(`${SYNC_CONFIG_TABLE}.sync_name`, `${TABLE}.name`)
            .andOn(`${SYNC_CONFIG_TABLE}.deleted`, '=', db.knex.raw('FALSE'))
            .andOn(`${SYNC_CONFIG_TABLE}.active`, '=', db.knex.raw('TRUE'))
            .andOn(`${SYNC_CONFIG_TABLE}.type`, '=', db.knex.raw('?', 'sync'))
            .andOn(`${SYNC_CONFIG_TABLE}.nango_config_id`, '=', db.knex.raw('?', [nangoConnection.config_id]));
    })
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .where({
        nango_connection_id: nangoConnection.id,
        [`${SYNC_CONFIG_TABLE}.nango_config_id`]: nangoConnection.config_id,
        [`${TABLE}.deleted`]: false
    })
        .orderBy(`${TABLE}.name`, 'asc')
        .groupBy(`${TABLE}.id`, `${SYNC_SCHEDULE_TABLE}.frequency`, `${ACTIVE_LOG_TABLE}.activity_log_id`, `${ACTIVE_LOG_TABLE}.log_id`, `${SYNC_SCHEDULE_TABLE}.offset`, `${SYNC_SCHEDULE_TABLE}.status`, `${SYNC_SCHEDULE_TABLE}.schedule_id`, `${SYNC_CONFIG_TABLE}.models`);
    const result = yield q;
    const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
    const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${nangoConnection.environment_id}`, false);
    const isOrchestrator = isGloballyEnabled || isEnvEnabled;
    if (isOrchestrator) {
        const searchSchedulesProps = result.map((sync) => {
            return { syncId: sync.id, environmentId: nangoConnection.environment_id };
        });
        const schedules = yield orchestrator.searchSchedules(searchSchedulesProps);
        if (schedules.isErr()) {
            throw new Error(`Failed to get schedules for environment ${nangoConnection.environment_id}: ${stringifyError(schedules.error)}`);
        }
        return result.map((sync) => {
            var _a;
            const schedule = schedules.value.get(sync.id);
            if (schedule) {
                return Object.assign(Object.assign({}, sync), { status: syncManager.classifySyncStatus((_a = sync === null || sync === void 0 ? void 0 : sync.latest_sync) === null || _a === void 0 ? void 0 : _a.status, schedule.state), futureActionTimes: schedule.state === 'PAUSED' ? [] : [schedule.nextDueDate.getTime() / 1000] });
            }
            return sync;
        });
    }
    else {
        const syncsWithSchedule = result.map((sync) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const { schedule_id } = sync;
            const syncSchedule = yield (syncClient === null || syncClient === void 0 ? void 0 : syncClient.describeSchedule(schedule_id));
            if (syncSchedule) {
                if (((_b = (_a = syncSchedule.schedule) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.paused) && sync.schedule_status === SyncStatus.RUNNING) {
                    sync = Object.assign(Object.assign({}, sync), { schedule_status: SyncStatus.PAUSED });
                    yield updateScheduleStatus(schedule_id, SyncCommand.PAUSE, null, nangoConnection.environment_id);
                    yield telemetry.log(LogTypes.TEMPORAL_SCHEDULE_MISMATCH_NOT_RUNNING, 'UI: Schedule is marked as paused in temporal but not in the database. The schedule has been updated in the database to be paused.', LogActionEnum.SYNC, {
                        environmentId: String(nangoConnection.environment_id),
                        syncName: sync.name,
                        connectionId: nangoConnection.connection_id,
                        providerConfigKey: nangoConnection.provider_config_key,
                        syncId: sync.id,
                        syncJobId: String((_c = sync.latest_sync) === null || _c === void 0 ? void 0 : _c.job_id),
                        scheduleId: schedule_id,
                        level: 'warn'
                    }, `syncId:${sync.id}`);
                }
                else if (!((_e = (_d = syncSchedule.schedule) === null || _d === void 0 ? void 0 : _d.state) === null || _e === void 0 ? void 0 : _e.paused) && sync.schedule_status === SyncStatus.PAUSED) {
                    sync = Object.assign(Object.assign({}, sync), { schedule_status: SyncStatus.RUNNING });
                    yield updateScheduleStatus(schedule_id, SyncCommand.UNPAUSE, null, nangoConnection.environment_id);
                    yield telemetry.log(LogTypes.TEMPORAL_SCHEDULE_MISMATCH_NOT_PAUSED, 'UI: Schedule is marked as running in temporal but not in the database. The schedule has been updated in the database to be running.', LogActionEnum.SYNC, {
                        environmentId: String(nangoConnection.environment_id),
                        syncName: sync.name,
                        connectionId: nangoConnection.connection_id,
                        providerConfigKey: nangoConnection.provider_config_key,
                        syncId: sync.id,
                        syncJobId: String((_f = sync.latest_sync) === null || _f === void 0 ? void 0 : _f.job_id),
                        scheduleId: schedule_id,
                        level: 'warn'
                    }, `syncId:${sync.id}`);
                }
            }
            let futureActionTimes = [];
            if (sync.schedule_status !== SyncStatus.PAUSED && syncSchedule && ((_g = syncSchedule.info) === null || _g === void 0 ? void 0 : _g.futureActionTimes)) {
                futureActionTimes = syncSchedule.info.futureActionTimes.map((long) => { var _a; return (_a = long.seconds) === null || _a === void 0 ? void 0 : _a.toNumber(); });
            }
            return Object.assign(Object.assign({}, sync), { status: syncManager.legacyClassifySyncStatus((_h = sync === null || sync === void 0 ? void 0 : sync.latest_sync) === null || _h === void 0 ? void 0 : _h.status, sync === null || sync === void 0 ? void 0 : sync.schedule_status), futureActionTimes });
        }));
        if (Array.isArray(syncsWithSchedule) && syncsWithSchedule.length > 0) {
            return Promise.all(syncsWithSchedule);
        }
        return [];
    }
});
export const getSyncsByConnectionId = (nangoConnectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield db.knex.select('*').from(TABLE).where({ nango_connection_id: nangoConnectionId, deleted: false });
    if (Array.isArray(results) && results.length > 0) {
        return results;
    }
    return null;
});
export const getSyncsByProviderConfigKey = (environment_id, providerConfigKey) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield db.knex
        .select(`${TABLE}.*`, `${TABLE}.name`, `_nango_connections.connection_id`, `${TABLE}.created_at`, `${TABLE}.updated_at`, `${TABLE}.last_sync_date`)
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .where({
        environment_id,
        provider_config_key: providerConfigKey,
        [`_nango_connections.deleted`]: false,
        [`${TABLE}.deleted`]: false
    });
    return results;
});
export const getSyncsByProviderConfigAndSyncName = (environment_id, providerConfigKey, syncName) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield db.knex
        .select(`${TABLE}.*`)
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .where({
        environment_id,
        provider_config_key: providerConfigKey,
        name: syncName,
        [`_nango_connections.deleted`]: false,
        [`${TABLE}.deleted`]: false
    });
    return results;
});
export const getSyncNamesByConnectionId = (nangoConnectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield db.knex.select('name').from(TABLE).where({ nango_connection_id: nangoConnectionId, deleted: false });
    if (Array.isArray(results) && results.length > 0) {
        return results.map((sync) => sync.name);
    }
    return [];
});
export const getSyncsByProviderConfigAndSyncNames = (environment_id, providerConfigKey, syncNames) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield db.knex
        .select(`${TABLE}.*`)
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .where({
        environment_id,
        provider_config_key: providerConfigKey,
        [`_nango_connections.deleted`]: false,
        [`${TABLE}.deleted`]: false
    })
        .whereIn('name', syncNames);
    return results;
});
/**
 * Verify Ownership
 * @desc verify that the incoming account id matches with the provided nango connection id
 */
export const verifyOwnership = (nangoConnectionId, environment_id, syncId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .select('*')
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .where({
        environment_id,
        [`${TABLE}.id`]: syncId,
        nango_connection_id: nangoConnectionId,
        [`_nango_connections.deleted`]: false,
        [`${TABLE}.deleted`]: false
    });
    if (result.length === 0) {
        return false;
    }
    return true;
});
export const isSyncValid = (connection_id, provider_config_key, environment_id, sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .select('*')
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .where({
        environment_id,
        [`${TABLE}.id`]: sync_id,
        connection_id,
        provider_config_key,
        [`_nango_connections.deleted`]: false,
        [`${TABLE}.deleted`]: false
    });
    if (result.length === 0) {
        return false;
    }
    return true;
});
export const softDeleteSync = (syncId) => __awaiter(void 0, void 0, void 0, function* () {
    yield schema().from(TABLE).where({ id: syncId, deleted: false }).update({ deleted: true, deleted_at: new Date() });
    return syncId;
});
export const findSyncByConnections = (connectionIds, sync_name) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield schema()
        .select(`${TABLE}.*`)
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .whereIn('nango_connection_id', connectionIds)
        .andWhere({
        name: sync_name,
        [`${TABLE}.deleted`]: false,
        [`_nango_connections.deleted`]: false
    });
    if (Array.isArray(results) && results.length > 0) {
        return results;
    }
    return [];
});
export const getSyncsBySyncConfigId = (environmentId, syncConfigId) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield schema()
        .select('sync_name', `${TABLE}.id`)
        .from(TABLE)
        .join(SYNC_CONFIG_TABLE, `${TABLE}.name`, `${SYNC_CONFIG_TABLE}.sync_name`)
        .where({
        environment_id: environmentId,
        [`${SYNC_CONFIG_TABLE}.id`]: syncConfigId,
        [`${TABLE}.deleted`]: false,
        [`${SYNC_CONFIG_TABLE}.deleted`]: false,
        [`${SYNC_CONFIG_TABLE}.active`]: true
    });
    return results;
});
export const getSyncsByConnectionIdsAndEnvironmentIdAndSyncName = (connectionIds, environmentId, syncName) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield schema()
        .select(`${TABLE}.id`)
        .from(TABLE)
        .join('_nango_connections', '_nango_connections.id', `${TABLE}.nango_connection_id`)
        .whereIn('_nango_connections.connection_id', connectionIds)
        .andWhere({
        name: syncName,
        environment_id: environmentId,
        [`${TABLE}.deleted`]: false,
        [`_nango_connections.deleted`]: false
    });
    if (Array.isArray(results) && results.length > 0) {
        return results;
    }
    return [];
});
export const getAndReconcileDifferences = ({ environmentId, flows, performAction, activityLogId, debug = false, singleDeployMode = false, logCtx, logContextGetter, orchestrator }) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const newSyncs = [];
    const newActions = [];
    const syncsToCreate = [];
    const existingSyncsByProviderConfig = {};
    const existingConnectionsByProviderConfig = {};
    for (const flow of flows) {
        const { syncName: flowName, providerConfigKey, type } = flow;
        if (type === SyncConfigType.ACTION) {
            const actionExists = yield getActionConfigByNameAndProviderConfigKey(environmentId, flowName, providerConfigKey);
            if (!actionExists) {
                newActions.push({
                    name: flowName,
                    providerConfigKey
                });
            }
            continue;
        }
        if (!existingSyncsByProviderConfig[providerConfigKey]) {
            // this gets syncs that have a sync config and are active OR just have a sync config
            existingSyncsByProviderConfig[providerConfigKey] = yield getSyncConfigsByProviderConfigKey(environmentId, providerConfigKey);
            existingConnectionsByProviderConfig[providerConfigKey] = yield connectionService.getConnectionsByEnvironmentAndConfig(environmentId, providerConfigKey);
        }
        const currentSync = existingSyncsByProviderConfig[providerConfigKey];
        const exists = currentSync === null || currentSync === void 0 ? void 0 : currentSync.find((existingSync) => existingSync.name === flowName);
        const connections = existingConnectionsByProviderConfig[providerConfigKey];
        let isNew = false;
        /*
         * The possible scenarios are as follows:
         * 1. There are connections for the provider but doesn't have an active sync -- it is a new sync, isNew = true
         * 2. It doesn't exist yet, so exists = false, which means we're in the reconciliation step so performAction = false so we don't create the sync
         * When we come back here and performAction is true, the sync would have been created so exists will be true and we'll only create
         * the sync if there are connections
         */
        let syncsByConnection = [];
        if (exists && exists.enabled && connections.length > 0) {
            syncsByConnection = yield findSyncByConnections(connections.map((connection) => connection.id), flowName);
            isNew = syncsByConnection.length === 0;
        }
        if (!exists || isNew) {
            newSyncs.push({
                name: flowName,
                providerConfigKey,
                connections: (_j = existingConnectionsByProviderConfig[providerConfigKey]) === null || _j === void 0 ? void 0 : _j.length,
                auto_start: flow.auto_start === false ? false : true
            });
            if (performAction) {
                if (debug && activityLogId) {
                    yield createActivityLogMessage({
                        level: 'debug',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Creating sync ${flowName} for ${providerConfigKey} with ${connections.length} connections and initiating`
                    });
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(`Creating sync ${flowName} for ${providerConfigKey} with ${connections.length} connections and initiating`));
                }
                syncsToCreate.push({ connections, syncName: flowName, sync: flow, providerConfigKey, environmentId });
            }
        }
        // in some cases syncs are missing so let's also create them if missing
        if (performAction && !(exists === null || exists === void 0 ? void 0 : exists.enabled) && syncsByConnection.length !== 0 && syncsByConnection.length !== connections.length) {
            const missingConnections = connections.filter((connection) => {
                return !syncsByConnection.find((sync) => sync.nango_connection_id === connection.id);
            });
            if (missingConnections.length > 0) {
                if (debug && activityLogId) {
                    yield createActivityLogMessage({
                        level: 'debug',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content: `Creating sync ${flowName} for ${providerConfigKey} with ${missingConnections.length} connections`
                    });
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(`Creating sync ${flowName} for ${providerConfigKey} with ${missingConnections.length} connections`));
                }
                syncsToCreate.push({ connections: missingConnections, syncName: flowName, sync: flow, providerConfigKey, environmentId });
            }
        }
    }
    if (syncsToCreate.length > 0) {
        if (debug && activityLogId) {
            const syncNames = syncsToCreate.map((sync) => sync.syncName);
            yield createActivityLogMessage({
                level: 'debug',
                environment_id: environmentId,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `Creating ${syncsToCreate.length} sync${syncsToCreate.length === 1 ? '' : 's'} ${JSON.stringify(syncNames, null, 2)}`
            });
            yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(`Creating ${syncsToCreate.length} sync${syncsToCreate.length === 1 ? '' : 's'} ${JSON.stringify(syncNames)}`));
        }
        // this is taken out of the loop to ensure it awaits all the calls properly
        const result = yield syncManager.createSyncs(syncsToCreate, logContextGetter, orchestrator, debug, activityLogId, logCtx);
        if (!result) {
            if (activityLogId) {
                yield updateSuccessActivityLog(activityLogId, false);
                yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.failed());
            }
            return null;
        }
    }
    // we don't want to include pre built syncs as they are handled differently hence
    // the "custom" sync configs
    const existingSyncs = yield getActiveCustomSyncConfigsByEnvironmentId(environmentId);
    const deletedSyncs = [];
    const deletedActions = [];
    if (!singleDeployMode) {
        for (const existingSync of existingSyncs) {
            const exists = flows.find((sync) => sync.syncName === existingSync.sync_name && sync.providerConfigKey === existingSync.unique_key);
            if (!exists) {
                const connections = yield connectionService.getConnectionsByEnvironmentAndConfig(environmentId, existingSync.unique_key);
                if (existingSync.type === SyncConfigType.SYNC) {
                    deletedSyncs.push({
                        name: existingSync.sync_name,
                        providerConfigKey: existingSync.unique_key,
                        connections: connections.length
                    });
                }
                else {
                    deletedActions.push({
                        name: existingSync.sync_name,
                        providerConfigKey: existingSync.unique_key
                    });
                }
                if (performAction) {
                    if (debug && activityLogId) {
                        yield createActivityLogMessage({
                            level: 'debug',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: `Deleting sync ${existingSync.sync_name} for ${existingSync.unique_key} with ${connections.length} connections`
                        });
                        yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(`Deleting sync ${existingSync.sync_name} for ${existingSync.unique_key} with ${connections.length} connections`));
                    }
                    yield syncManager.deleteConfig(existingSync.id, environmentId);
                    if (existingSync.type === SyncConfigType.SYNC) {
                        for (const connection of connections) {
                            const syncId = yield getSyncByIdAndName(connection.id, existingSync.sync_name);
                            if (syncId) {
                                yield syncManager.softDeleteSync(syncId.id, environmentId, orchestrator);
                            }
                        }
                    }
                    if (activityLogId) {
                        const connectionDescription = existingSync.type === SyncConfigType.SYNC ? ` with ${connections.length} connection${connections.length > 1 ? 's' : ''}.` : '.';
                        const content = `Successfully deleted ${existingSync.type} ${existingSync.sync_name} for ${existingSync.unique_key}${connectionDescription}`;
                        yield createActivityLogMessage({
                            level: 'debug',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content
                        });
                        yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug(content));
                    }
                }
            }
        }
    }
    if (debug && activityLogId) {
        yield createActivityLogMessageAndEnd({
            level: 'debug',
            environment_id: environmentId,
            activity_log_id: activityLogId,
            timestamp: Date.now(),
            content: 'Sync deploy diff in debug mode process complete successfully.'
        });
        yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.debug('Sync deploy diff in debug mode process complete successfully.'));
    }
    return {
        newSyncs,
        newActions,
        deletedSyncs,
        deletedActions
    };
});
export function findPausableDemoSyncs() {
    return __awaiter(this, void 0, void 0, function* () {
        const q = db.knex
            .queryBuilder()
            .from('_nango_syncs')
            .select('_nango_syncs.id', '_nango_syncs.name', '_nango_accounts.id as account_id', '_nango_accounts.name as account_name', '_nango_environments.id as environment_id', '_nango_environments.name as environment_name', '_nango_configs.id as config_id', '_nango_configs.provider', '_nango_configs.unique_key as provider_unique_key', '_nango_connections.id as connection_unique_id', '_nango_connections.connection_id', '_nango_sync_schedules.schedule_id', '_nango_sync_configs.id as sync_config_id')
            .join('_nango_connections', '_nango_connections.id', '_nango_syncs.nango_connection_id')
            .join('_nango_environments', '_nango_environments.id', '_nango_connections.environment_id')
            .join('_nango_accounts', '_nango_accounts.id', '_nango_environments.account_id')
            .join('_nango_configs', function () {
            this.on('_nango_configs.environment_id', '_nango_connections.environment_id').on('_nango_configs.unique_key', '_nango_connections.provider_config_key');
        })
            .join('_nango_sync_configs', function () {
            this.on('_nango_sync_configs.environment_id', '_nango_environments.id')
                .on('_nango_sync_configs.nango_config_id', '_nango_configs.id')
                .on('_nango_sync_configs.sync_name', '_nango_syncs.name')
                .onVal('_nango_sync_configs.type', 'sync')
                .onVal('_nango_sync_configs.deleted', false)
                .onVal('_nango_sync_configs.active', true);
        })
            .join('_nango_sync_schedules', '_nango_sync_schedules.sync_id', '_nango_syncs.id')
            .where({
            '_nango_syncs.name': DEMO_SYNC_NAME,
            '_nango_environments.name': 'dev',
            '_nango_configs.unique_key': DEMO_GITHUB_CONFIG_KEY,
            '_nango_configs.provider': 'github',
            '_nango_syncs.deleted': false,
            '_nango_sync_schedules.status': ScheduleStatus.RUNNING
        })
            .where(db.knex.raw("_nango_syncs.updated_at <  NOW() - INTERVAL '25h'"));
        const syncs = yield q;
        return syncs;
    });
}
export function findRecentlyDeletedSync() {
    return __awaiter(this, void 0, void 0, function* () {
        const q = db.knex.from('_nango_syncs').select('_nango_syncs.id').where(db.knex.raw("_nango_syncs.deleted_at >  NOW() - INTERVAL '6h'"));
        return yield q;
    });
}
export function trackFetch(nango_connection_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex.from(`_nango_syncs`).where({ nango_connection_id, deleted: false }).update({ last_fetched_at: new Date() });
    });
}
//# sourceMappingURL=sync.service.js.map