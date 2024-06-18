import db, { schema, dbNamespace } from '@nangohq/database';
import type { Schedule as SyncSchedule, SyncCommand } from '@nangohq/models/Sync.js';
import { ScheduleStatus, SyncCommandToScheduleStatus } from '@nangohq/models/Sync.js';
import type { ServiceResponse } from '@nangohq/models/Generic.js';
import { getInterval } from '../nango-config.service.js';
import SyncClient from '../../clients/sync.client.js';
import { createActivityLogDatabaseErrorMessageAndEnd } from '../activity/activity.service.js';
import type { LogContext } from '@nangohq/logs';
import { Ok, Err } from '@nangohq/utils';
import type { Result } from '@nangohq/utils';

const TABLE = dbNamespace + 'sync_schedules';

export const createSchedule = async (sync_id: string, frequency: string, offset: number, status: ScheduleStatus, schedule_id: string): Promise<void> => {
    await db.knex.from<SyncSchedule>(TABLE).insert({
        sync_id,
        status,
        schedule_id,
        frequency,
        offset
    });
};

export const getScheduleById = async (schedule_id: string): Promise<SyncSchedule | null> => {
    const result = await schema().select('*').from<SyncSchedule>(TABLE).where({ schedule_id, deleted: false }).first();

    return result || null;
};

export const getSchedule = async (sync_id: string): Promise<SyncSchedule | null> => {
    const result = await schema().select('*').from<SyncSchedule>(TABLE).where({ sync_id, deleted: false }).first();

    if (result) {
        return result;
    }

    return null;
};

export const getSyncSchedules = async (sync_id: string): Promise<SyncSchedule[]> => {
    const result = await schema().select('*').from<SyncSchedule>(TABLE).where({ sync_id, deleted: false });

    if (Array.isArray(result) && result.length > 0) {
        return result;
    }

    return [];
};

export const deleteScheduleForSync = async (sync_id: string, environmentId: number): Promise<void> => {
    const syncClient = await SyncClient.getInstance();

    const schedule = await getSchedule(sync_id);

    if (schedule && syncClient) {
        await syncClient.deleteSyncSchedule(schedule?.schedule_id, environmentId);
    }
};

export const markAllAsStopped = async (): Promise<void> => {
    await schema().update({ status: ScheduleStatus.STOPPED }).from<SyncSchedule>(TABLE);
};

export const updateScheduleStatus = async (
    schedule_id: string,
    status: SyncCommand,
    activityLogId: number | null,
    environment_id: number,
    logCtx?: LogContext
): Promise<Result<boolean>> => {
    try {
        await schema().update({ status: SyncCommandToScheduleStatus[status] }).from<SyncSchedule>(TABLE).where({ schedule_id, deleted: false });
        return Ok(true);
    } catch (error) {
        if (activityLogId) {
            await createActivityLogDatabaseErrorMessageAndEnd(
                `Failed to update schedule status to ${status} for schedule_id: ${schedule_id}.`,
                error,
                activityLogId,
                environment_id
            );
            await logCtx?.error(`Failed to update schedule status to ${status} for schedule_id: ${schedule_id}`, { error });
        }

        return Err(error as Error);
    }
};

export const updateSyncScheduleFrequency = async (
    sync_id: string,
    interval: string,
    syncName: string,
    environmentId: number,
    activityLogId?: number,
    logCtx?: LogContext
): Promise<ServiceResponse<boolean>> => {
    const existingSchedule = await getSchedule(sync_id);

    if (!existingSchedule) {
        return { success: true, error: null, response: false };
    }

    const { success, error, response } = getInterval(interval, new Date());

    if (!success || response === null) {
        return { success: false, error, response: null };
    }

    const { interval: frequency, offset } = response;

    if (existingSchedule.frequency !== frequency) {
        await schema().update({ frequency }).from<SyncSchedule>(TABLE).where({ sync_id, deleted: false });
        const syncClient = await SyncClient.getInstance();
        await syncClient?.updateSyncSchedule(existingSchedule.schedule_id, frequency, offset, environmentId, syncName, activityLogId, logCtx);

        return { success: true, error: null, response: true };
    }

    return { success: true, error: null, response: false };
};

export const updateOffset = async (schedule_id: string, offset: number): Promise<void> => {
    await schema().update({ offset }).from<SyncSchedule>(TABLE).where({ schedule_id, deleted: false });
};

export async function softDeleteSchedules({ syncId, limit }: { syncId: string; limit: number }): Promise<number> {
    return db
        .knex('_nango_sync_schedules')
        .update({
            deleted: true,
            deleted_at: db.knex.fn.now()
        })
        .whereIn('id', function (sub) {
            sub.select('id').from('_nango_sync_schedules').where({ deleted: false, sync_id: syncId }).limit(limit);
        });
}

export async function getRunningSchedules({
    limit,
    offset
}: {
    limit: number;
    offset?: number;
}): Promise<Pick<SyncSchedule, 'id' | 'schedule_id' | 'sync_id'>[]> {
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
}
