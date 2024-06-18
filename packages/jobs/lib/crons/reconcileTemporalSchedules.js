var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as cron from 'node-cron';
import db from '@nangohq/database';
import { telemetry, LogTypes, LogActionEnum, errorManager, ErrorSourceEnum, SyncClient, getRunningSchedules } from '@nangohq/shared';
import { getLogger, metrics, stringToHash } from '@nangohq/utils';
import tracer from 'dd-trace';
const logger = getLogger('Jobs.TemporalSchedules');
const cronName = '[reconcileTemporalSchedules]';
export function reconcileTemporalSchedules() {
    cron.schedule('*/15 * * * *', () => __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        try {
            yield exec();
        }
        catch (err) {
            const e = new Error('failed to reconcile temporal schedules');
            e.cause = err instanceof Error ? err.message : err;
            errorManager.report(e, { source: ErrorSourceEnum.PLATFORM }, tracer);
        }
        metrics.duration(metrics.Types.RENCONCILE_TEMPORAL_SCHEDULES, Date.now() - start);
    }));
}
export function exec() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info(`${cronName} starting`);
        const lockKey = stringToHash(cronName);
        const syncClient = yield SyncClient.getInstance();
        if (!syncClient) {
            logger.error(`${cronName} failed to get sync client`);
            return;
        }
        yield db.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { rows } = yield trx.raw(`SELECT pg_try_advisory_xact_lock(?);`, [lockKey]);
            if (!((_a = rows === null || rows === void 0 ? void 0 : rows[0]) === null || _a === void 0 ? void 0 : _a.pg_try_advisory_xact_lock)) {
                logger.info(`${cronName} could not acquire lock, skipping`);
                return;
            }
            let lastId = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const runningSchedules = yield getRunningSchedules({ limit: 1000, offset: lastId });
                if (runningSchedules.length === 0) {
                    logger.info(`${cronName} no running schedules found`);
                    break;
                }
                logger.info(`[reconcileTemporalSchedules] found ${runningSchedules.length} running schedules`);
                for (const schedule of runningSchedules) {
                    const { schedule_id, sync_id } = schedule;
                    try {
                        const syncSchedule = yield syncClient.describeSchedule(schedule_id);
                        if (syncSchedule && ((_c = (_b = syncSchedule.schedule) === null || _b === void 0 ? void 0 : _b.state) === null || _c === void 0 ? void 0 : _c.paused)) {
                            const temporalClient = syncClient.getClient();
                            const scheduleHandle = temporalClient === null || temporalClient === void 0 ? void 0 : temporalClient.schedule.getHandle(schedule_id);
                            const previousNote = syncSchedule.schedule.state.notes;
                            if (scheduleHandle && !schedule_id.includes('nango-syncs.issues-demo')) {
                                logger.info(`${cronName} reconciling scheduleId: ${schedule_id}, syncId: ${sync_id}`);
                                yield scheduleHandle.unpause(`${cronName} cron unpaused the schedule for sync '${sync_id}' at ${new Date().toISOString()}`);
                                yield telemetry.log(LogTypes.TEMPORAL_SCHEDULE_MISMATCH_NOT_RUNNING, 'CRON: Schedule is marked as paused in temporal but not in the database. The schedule has been unpaused in temporal', LogActionEnum.SYNC, {
                                    sync_id,
                                    schedule_id,
                                    level: 'warn',
                                    previousNote: String(previousNote)
                                }, `syncId:${sync_id}`);
                            }
                        }
                        metrics.increment(metrics.Types.RENCONCILE_TEMPORAL_SCHEDULES_SUCCESS);
                    }
                    catch (_d) {
                        logger.error(`${cronName} failed to reconcile scheduleId: ${schedule_id}, syncId: ${sync_id}`);
                        metrics.increment(metrics.Types.RENCONCILE_TEMPORAL_SCHEDULES_FAILED);
                    }
                }
                const lastSchedule = runningSchedules[runningSchedules.length - 1];
                if (lastSchedule && typeof lastSchedule.id === 'number' && lastSchedule.id === lastId) {
                    break;
                }
                if (lastSchedule && typeof lastSchedule.id === 'number') {
                    lastId = lastSchedule.id;
                }
            }
            logger.info(`${cronName} ✅ done`);
        }));
    });
}
//# sourceMappingURL=reconcileTemporalSchedules.js.map