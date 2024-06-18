var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db, { schema, dbNamespace } from '@nangohq/database';
import { ScheduleStatus, SyncCommandToScheduleStatus } from '@nangohq/models/Sync.js';
import { Ok, Err } from '@nangohq/utils';
import { getInterval } from '../nango-config.service.js';
import SyncClient from '../../clients/sync.client.js';
import { createActivityLogDatabaseErrorMessageAndEnd } from '../activity/activity.service.js';
const TABLE = dbNamespace + 'sync_schedules';
export const createSchedule = (sync_id, frequency, offset, status, schedule_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield db.knex.from(TABLE).insert({
        sync_id,
        status,
        schedule_id,
        frequency,
        offset
    });
});
export const getScheduleById = (schedule_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema().select('*').from(TABLE).where({ schedule_id, deleted: false }).first();
    return result || null;
});
export const getSchedule = (sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema().select('*').from(TABLE).where({ sync_id, deleted: false }).first();
    if (result) {
        return result;
    }
    return null;
});
export const getSyncSchedules = (sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema().select('*').from(TABLE).where({ sync_id, deleted: false });
    if (Array.isArray(result) && result.length > 0) {
        return result;
    }
    return [];
});
export const deleteScheduleForSync = (sync_id, environmentId) => __awaiter(void 0, void 0, void 0, function* () {
    const syncClient = yield SyncClient.getInstance();
    const schedule = yield getSchedule(sync_id);
    if (schedule && syncClient) {
        yield syncClient.deleteSyncSchedule(schedule === null || schedule === void 0 ? void 0 : schedule.schedule_id, environmentId);
    }
});
export const markAllAsStopped = () => __awaiter(void 0, void 0, void 0, function* () {
    yield schema().update({ status: ScheduleStatus.STOPPED }).from(TABLE);
});
export const updateScheduleStatus = (schedule_id, status, activityLogId, environment_id, logCtx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield schema().update({ status: SyncCommandToScheduleStatus[status] }).from(TABLE).where({ schedule_id, deleted: false });
        return Ok(true);
    }
    catch (error) {
        if (activityLogId) {
            yield createActivityLogDatabaseErrorMessageAndEnd(`Failed to update schedule status to ${status} for schedule_id: ${schedule_id}.`, error, activityLogId, environment_id);
            yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(`Failed to update schedule status to ${status} for schedule_id: ${schedule_id}`, { error }));
        }
        return Err(error);
    }
});
export const updateSyncScheduleFrequency = (sync_id, interval, syncName, environmentId, activityLogId, logCtx) => __awaiter(void 0, void 0, void 0, function* () {
    const existingSchedule = yield getSchedule(sync_id);
    if (!existingSchedule) {
        return { success: true, error: null, response: false };
    }
    const { success, error, response } = getInterval(interval, new Date());
    if (!success || response === null) {
        return { success: false, error, response: null };
    }
    const { interval: frequency, offset } = response;
    if (existingSchedule.frequency !== frequency) {
        yield schema().update({ frequency }).from(TABLE).where({ sync_id, deleted: false });
        const syncClient = yield SyncClient.getInstance();
        yield (syncClient === null || syncClient === void 0 ? void 0 : syncClient.updateSyncSchedule(existingSchedule.schedule_id, frequency, offset, environmentId, syncName, activityLogId, logCtx));
        return { success: true, error: null, response: true };
    }
    return { success: true, error: null, response: false };
});
export const updateOffset = (schedule_id, offset) => __awaiter(void 0, void 0, void 0, function* () {
    yield schema().update({ offset }).from(TABLE).where({ schedule_id, deleted: false });
});
export function softDeleteSchedules({ syncId, limit }) {
    return __awaiter(this, void 0, void 0, function* () {
        return db
            .knex('_nango_sync_schedules')
            .update({
            deleted: true,
            deleted_at: db.knex.fn.now()
        })
            .whereIn('id', function (sub) {
            sub.select('id').from('_nango_sync_schedules').where({ deleted: false, sync_id: syncId }).limit(limit);
        });
    });
}
export function getRunningSchedules({ limit, offset }) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = db
            .knex('_nango_sync_schedules')
            .select('id', 'schedule_id', 'sync_id')
            .where({ status: ScheduleStatus.RUNNING, deleted: false })
            .orderBy('id')
            .limit(limit);
        if (offset) {
            query.where('id', '>', offset);
        }
        return query;
    });
}
//# sourceMappingURL=schedule.service.js.map