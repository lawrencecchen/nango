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
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { SyncStatus, SyncType } from '@nangohq/models/Sync.js';
import { MAX_SYNC_DURATION } from '@nangohq/utils';
import errorManager, { ErrorSourceEnum } from '../../utils/error.manager.js';
const SYNC_JOB_TABLE = dbNamespace + 'sync_jobs';
export const createSyncJob = (sync_id, type, status, job_id, nangoConnection, run_id) => __awaiter(void 0, void 0, void 0, function* () {
    let job = {
        sync_id,
        type,
        status,
        job_id
    };
    if (run_id) {
        job = Object.assign(Object.assign({}, job), { run_id });
    }
    try {
        const syncJob = yield schema().from(SYNC_JOB_TABLE).insert(job).returning('id');
        if (syncJob && syncJob.length > 0 && syncJob[0]) {
            return syncJob[0];
        }
    }
    catch (e) {
        if (nangoConnection) {
            errorManager.report(e, {
                environmentId: nangoConnection.environment_id,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    sync_id,
                    type,
                    status,
                    job_id,
                    run_id,
                    nangoConnection: JSON.stringify(nangoConnection)
                }
            });
        }
    }
    return null;
});
export const updateRunId = (id, run_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield schema().from(SYNC_JOB_TABLE).where({ id, deleted: false }).update({
        run_id
    });
});
export const getLatestSyncJob = (sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema().from(SYNC_JOB_TABLE).where({ sync_id, deleted: false }).orderBy('created_at', 'desc').first();
    if (result) {
        return result;
    }
    return null;
});
export const updateSyncJobStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    return schema().from(SYNC_JOB_TABLE).where({ id, deleted: false }).update({
        status,
        updated_at: new Date()
    });
});
export const updateLatestJobSyncStatus = (sync_id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const latestJob = yield getLatestSyncJob(sync_id);
    if (latestJob && latestJob.id) {
        updateSyncJobStatus(latestJob.id, status);
    }
});
/**
 * Update Sync Job Result
 * @desc grab any existing results and add them to the current
 */
export const updateSyncJobResult = (id, result, model) => __awaiter(void 0, void 0, void 0, function* () {
    return db.knex.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
        const { result: existingResult } = yield trx.from(SYNC_JOB_TABLE).select('result').forUpdate().where({ id }).first();
        if (!existingResult || Object.keys(existingResult).length === 0) {
            const [updatedRow] = yield trx
                .from(SYNC_JOB_TABLE)
                .where({ id, deleted: false })
                .update({
                result
            })
                .returning('*');
            return updatedRow;
        }
        else {
            const { added, updated, deleted } = existingResult[model] || { added: 0, updated: 0, deleted: 0 };
            const incomingResult = result[model];
            const finalResult = Object.assign(Object.assign({}, existingResult), { [model]: {
                    added: Number(added) + Number(incomingResult === null || incomingResult === void 0 ? void 0 : incomingResult.added),
                    updated: Number(updated) + Number(incomingResult === null || incomingResult === void 0 ? void 0 : incomingResult.updated)
                } });
            const deletedValue = Number(deleted) || 0;
            const incomingDeletedValue = Number(incomingResult === null || incomingResult === void 0 ? void 0 : incomingResult.deleted) || 0;
            if (deletedValue !== 0 || incomingDeletedValue !== 0) {
                finalResult[model].deleted = deletedValue + incomingDeletedValue;
            }
            const [updatedRow] = yield trx
                .from(SYNC_JOB_TABLE)
                .where({ id, deleted: false })
                .update({
                result: finalResult
            })
                .returning('*');
            return updatedRow;
        }
    }));
});
export const addSyncConfigToJob = (id, sync_config_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield schema().from(SYNC_JOB_TABLE).where({ id, deleted: false }).update({
        sync_config_id
    });
});
export const isSyncJobRunning = (sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .from(SYNC_JOB_TABLE)
        .where({
        sync_id,
        deleted: false,
        status: SyncStatus.RUNNING
    })
        .orderBy('created_at', 'desc')
        .limit(1);
    if (result && result.length > 0) {
        return result[0];
    }
    return null;
});
export const isInitialSyncStillRunning = (sync_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield schema()
        .from(SYNC_JOB_TABLE)
        .where({
        sync_id,
        deleted: false,
        type: SyncType.INITIAL,
        status: SyncStatus.RUNNING
    })
        .first();
    // if it has been running for more than 24 hours then we should assume it is stuck
    const moreThan24Hours = result && result.updated_at ? new Date(result.updated_at).getTime() < new Date().getTime() - MAX_SYNC_DURATION : false;
    if (result && !moreThan24Hours) {
        return true;
    }
    return false;
});
export function softDeleteJobs({ syncId, limit }) {
    return __awaiter(this, void 0, void 0, function* () {
        return db
            .knex('_nango_sync_jobs')
            .update({
            deleted: true,
            deleted_at: db.knex.fn.now()
        })
            .whereIn('id', function (sub) {
            sub.select('id').from('_nango_sync_jobs').where({ deleted: false, sync_id: syncId }).limit(limit);
        });
    });
}
//# sourceMappingURL=job.service.js.map