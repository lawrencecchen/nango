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
import { deleteLog, deleteLogsMessages, errorManager, ErrorSourceEnum, findOldActivities } from '@nangohq/shared';
import { getLogger, metrics } from '@nangohq/utils';
import tracer from 'dd-trace';
import { setTimeout } from 'node:timers/promises';
const logger = getLogger('Jobs');
// Retention in days
const retention = parseInt(process.env['NANGO_CLEAR_ACTIVITIES_RETENTION'] || '', 10) || 15;
const limitLog = parseInt(process.env['NANGO_CLEAR_ACTIVITIES_LIMIT'] || '', 10) || 2000;
const limitMsg = parseInt(process.env['NANGO_CLEAR_ACTIVITIES_MSG_LIMIT'] || '', 10) || 5000;
const cpuNice = parseInt(process.env['NANGO_CLEAR_ACTIVITIES_CPU_NICE_MS'] || '', 10) || 200;
export function deleteOldActivityLogs() {
    /**
     * Delete all activity logs older than 15 days
     */
    cron.schedule('*/10 * * * *', () => __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        try {
            yield exec();
        }
        catch (err) {
            const e = new Error('failed_to_clean_activity_logs_table', { cause: err instanceof Error ? err.message : err });
            errorManager.report(e, { source: ErrorSourceEnum.PLATFORM }, tracer);
        }
        metrics.duration(metrics.Types.JOBS_CLEAN_ACTIVITY_LOGS, Date.now() - start);
    }));
}
/**
 * Postgres does not allow DELETE LIMIT so we batch ourself to limit the memory footprint of this query.
 */
export function exec() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info('[oldActivity] starting');
        const logs = yield findOldActivities({ retention, limit: limitLog });
        logger.info(`[oldActivity] found ${logs.length} syncs`);
        for (const log of logs) {
            logger.info(`[oldActivity] deleting syncId: ${log.id}`);
            let count = 0;
            do {
                count = yield deleteLogsMessages({ activityLogId: log.id, limit: limitMsg });
                logger.info(`[oldActivity] deleted ${count} rows`);
                // Free the CPU
                yield setTimeout(cpuNice);
            } while (count >= limitMsg);
            yield deleteLog({ activityLogId: log.id });
        }
        logger.info('[oldActivity] done');
    });
}
//# sourceMappingURL=deleteOldActivities.js.map