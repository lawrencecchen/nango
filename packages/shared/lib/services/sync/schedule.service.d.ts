import type { Schedule as SyncSchedule } from '@nangohq/models/Sync.js';
import type { ServiceResponse } from '@nangohq/models/Generic.js';
import type { Result } from '@nangohq/utils';
export declare const createSchedule: (sync_id: string, frequency: string, offset: number, status: ScheduleStatus, schedule_id: string) => Promise<void>;
export declare const getScheduleById: (schedule_id: string) => Promise<SyncSchedule | null>;
export declare const getSchedule: (sync_id: string) => Promise<SyncSchedule | null>;
export declare const getSyncSchedules: (sync_id: string) => Promise<SyncSchedule[]>;
export declare const deleteScheduleForSync: (sync_id: string, environmentId: number) => Promise<void>;
export declare const markAllAsStopped: () => Promise<void>;
export declare const updateScheduleStatus: (
    schedule_id: string,
    status: SyncCommand,
    activityLogId: number | null,
    environment_id: number,
    logCtx?: LogContext
) => Promise<Result<boolean>>;
export declare const updateSyncScheduleFrequency: (
    sync_id: string,
    interval: string,
    syncName: string,
    environmentId: number,
    activityLogId?: number,
    logCtx?: LogContext
) => Promise<ServiceResponse<boolean>>;
export declare const updateOffset: (schedule_id: string, offset: number) => Promise<void>;
export declare function softDeleteSchedules({ syncId, limit }: { syncId: string; limit: number }): Promise<number>;
export declare function getRunningSchedules({
    limit,
    offset
}: {
    limit: number;
    offset?: number;
}): Promise<Pick<SyncSchedule, 'id' | 'schedule_id' | 'sync_id'>[]>;
