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
import { errorManager, ErrorSourceEnum, softDeleteSchedules, softDeleteJobs, findRecentlyDeletedSync } from '@nangohq/shared';
import { records } from '@nangohq/records';
import { getLogger, metrics } from '@nangohq/utils';
import tracer from 'dd-trace';
const logger = getLogger('Jobs');
const limitJobs = 1000;
const limitSchedules = 1000;
const limitRecords = 1000;
export function deleteSyncsData() {
    /**
     * Clean data from soft deleted syncs.
     * This cron needs to be removed at some point, we need a queue to delete specific provider/connection/sync
     */
    cron.schedule('*/20 * * * *', () => __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        try {
            yield exec();
        }
        catch (err) {
            const e = new Error('failed_to_hard_delete_syncs_data', { cause: err instanceof Error ? err.message : err });
            errorManager.report(e, { source: ErrorSourceEnum.PLATFORM }, tracer);
        }
        metrics.duration(metrics.Types.JOBS_DELETE_SYNCS_DATA, Date.now() - start);
    }));
}
export function exec() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info('[deleteSyncs] starting');
        yield db.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            // Because it's slow and create deadlocks
            // we need to acquire a Lock that prevents any other duplicate cron to execute the same thing
            const { rows } = yield trx.raw(`SELECT pg_try_advisory_xact_lock(?);`, [123456789]);
            if (!rows || rows.length <= 0 || !rows[0].pg_try_advisory_xact_lock) {
                logger.info(`[deleteSyncs] could not acquire lock, skipping`);
                return;
            }
            const syncs = yield findRecentlyDeletedSync();
            for (const sync of syncs) {
                logger.info(`[deleteSyncs] deleting syncId: ${sync.id}`);
                // Soft delete jobs
                let countJobs = 0;
                do {
                    countJobs = yield softDeleteJobs({ syncId: sync.id, limit: limitJobs });
                    logger.info(`[deleteSyncs] soft deleted ${countJobs} jobs`);
                    metrics.increment(metrics.Types.JOBS_DELETE_SYNCS_DATA_JOBS, countJobs);
                } while (countJobs >= limitJobs);
                // -----
                // Soft delete schedules
                let countSchedules = 0;
                do {
                    countSchedules = yield softDeleteSchedules({ syncId: sync.id, limit: limitSchedules });
                    logger.info(`[deleteSyncs] soft deleted ${countSchedules} schedules`);
                    metrics.increment(metrics.Types.JOBS_DELETE_SYNCS_DATA_SCHEDULES, countSchedules);
                } while (countSchedules >= limitSchedules);
                // ----
                // hard delete records
                const res = yield records.deleteRecordsBySyncId({ syncId: sync.id, limit: limitRecords });
                metrics.increment(metrics.Types.JOBS_DELETE_SYNCS_DATA_RECORDS, res.totalDeletedRecords);
            }
        }));
        logger.info('[deleteSyncs] ✅ done');
    });
}
//# sourceMappingURL=deleteSyncsData.js.map