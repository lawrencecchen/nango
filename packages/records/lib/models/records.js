var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { Err, Ok, retry } from '@nangohq/utils';
import { db } from '../db/client.js';
import { decryptRecord, decryptRecords, encryptRecords } from '../utils/encryption.js';
import { RECORDS_TABLE } from '../constants.js';
import { removeDuplicateKey, getUniqueId } from '../helpers/uniqueKey.js';
import { logger } from '../utils/logger.js';
dayjs.extend(utc);
const BATCH_SIZE = 1000;
export function getRecords({ connectionId, model, modifiedAfter, limit, filter, cursor }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!model) {
                const error = new Error('missing_model');
                return Err(error);
            }
            let query = db
                .from(RECORDS_TABLE)
                .timeout(60000) // timeout after 1 minute
                .where({
                connection_id: connectionId,
                model
            })
                .orderBy([
                { column: 'updated_at', order: 'asc' },
                { column: 'id', order: 'asc' }
            ]);
            if (cursor) {
                const decodedCursorValue = Buffer.from(cursor, 'base64').toString('ascii');
                const [cursorSort, cursorId] = decodedCursorValue.split('||');
                if (!cursorSort || !cursorId) {
                    const error = new Error('invalid_cursor_value');
                    return Err(error);
                }
                query = query.where((builder) => void builder
                    .where('updated_at', '>', cursorSort)
                    .orWhere((builder) => void builder.where('updated_at', '=', cursorSort).andWhere('id', '>', cursorId)));
            }
            if (limit) {
                if (isNaN(Number(limit))) {
                    const error = new Error('invalid_limit');
                    return Err(error);
                }
                query = query.limit(Number(limit) + 1);
            }
            else {
                query = query.limit(101);
            }
            if (modifiedAfter) {
                const time = dayjs(modifiedAfter);
                if (!time.isValid()) {
                    const error = new Error('invalid_timestamp');
                    return Err(error);
                }
                const formattedDelta = time.toISOString();
                query = query.andWhere('updated_at', '>=', formattedDelta);
            }
            if (filter) {
                const formattedFilter = filter.toUpperCase();
                switch (true) {
                    case formattedFilter.includes('ADDED') && formattedFilter.includes('UPDATED'):
                        query = query.andWhere('deleted_at', null).andWhere(function () {
                            void this.where('created_at', '=', db.raw('updated_at')).orWhere('created_at', '!=', db.raw('updated_at'));
                        });
                        break;
                    case formattedFilter.includes('UPDATED') && formattedFilter.includes('DELETED'):
                        query = query.andWhere(function () {
                            void this.where('deleted_at', null).andWhere('created_at', '!=', db.raw('updated_at'));
                        });
                        break;
                    case formattedFilter.includes('ADDED') && formattedFilter.includes('DELETED'):
                        query = query.andWhere(function () {
                            void this.where('deleted_at', null).andWhere('created_at', '=', db.raw('updated_at'));
                        });
                        break;
                    case formattedFilter === 'ADDED':
                        query = query.andWhere('deleted_at', null).andWhere('created_at', '=', db.raw('updated_at'));
                        break;
                    case formattedFilter === 'UPDATED':
                        query = query.andWhere('deleted_at', null).andWhere('created_at', '!=', db.raw('updated_at'));
                        break;
                    case formattedFilter === 'DELETED':
                        query = query.andWhereNot({ deleted_at: null });
                        break;
                }
            }
            const rawResults = yield query.select(
            // PostgreSQL stores timestamp with microseconds precision
            // however, javascript date only supports milliseconds precision
            // we therefore convert timestamp to string (using to_json()) in order to avoid precision loss
            db.raw(`
                id,
                json,
                to_json(created_at) as first_seen_at,
                to_json(updated_at) as last_modified_at,
                to_json(deleted_at) as deleted_at,
                CASE
                    WHEN deleted_at IS NOT NULL THEN 'DELETED'
                    WHEN created_at = updated_at THEN 'ADDED'
                    ELSE 'UPDATED'
                END as last_action
            `));
            if (rawResults.length === 0) {
                return Ok({ records: [], next_cursor: null });
            }
            const results = rawResults.map((item) => {
                const decryptedData = decryptRecord(item);
                const encodedCursor = Buffer.from(`${item.last_modified_at}||${item.id}`).toString('base64');
                return Object.assign(Object.assign({}, decryptedData), { _nango_metadata: {
                        first_seen_at: item.first_seen_at,
                        last_modified_at: item.last_modified_at,
                        last_action: item.last_action,
                        deleted_at: item.deleted_at,
                        cursor: encodedCursor
                    } });
            });
            if (results.length > Number(limit || 100)) {
                results.pop();
                rawResults.pop();
                const cursorRawElement = rawResults[rawResults.length - 1];
                if (cursorRawElement) {
                    const encodedCursorValue = Buffer.from(`${cursorRawElement.last_modified_at}||${cursorRawElement.id}`).toString('base64');
                    return Ok({ records: results, next_cursor: encodedCursorValue });
                }
            }
            return Ok({ records: results, next_cursor: null });
        }
        catch (_error) {
            const e = new Error(`List records error for model ${model}`);
            return Err(e);
        }
    });
}
export function upsert({ records, connectionId, model, softDelete = false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { records: recordsWithoutDuplicates, nonUniqueKeys } = removeDuplicateKey(records);
        if (!recordsWithoutDuplicates || recordsWithoutDuplicates.length === 0) {
            return Err(`There are no records to upsert because there were no records that were not duplicates to insert, but there were ${records.length} records received for the "${model}" model.`);
        }
        let summary = { addedKeys: [], updatedKeys: [], deletedKeys: [], nonUniqueKeys };
        try {
            yield db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < recordsWithoutDuplicates.length; i += BATCH_SIZE) {
                    const chunk = recordsWithoutDuplicates.slice(i, i + BATCH_SIZE);
                    const chunkSummary = yield getUpsertSummary({ records: chunk, connectionId, model, nonUniqueKeys, softDelete, trx });
                    summary = {
                        addedKeys: [...summary.addedKeys, ...chunkSummary.addedKeys],
                        updatedKeys: [...summary.updatedKeys, ...chunkSummary.updatedKeys],
                        deletedKeys: [...(summary.deletedKeys || []), ...(chunkSummary.deletedKeys || [])],
                        nonUniqueKeys: nonUniqueKeys
                    };
                    const encryptedRecords = encryptRecords(chunk);
                    // Retry upserting if deadlock detected
                    // https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html
                    const upserting = () => trx.from(RECORDS_TABLE).insert(encryptedRecords).onConflict(['connection_id', 'external_id', 'model']).merge();
                    yield retry(upserting, {
                        maxAttempts: 3,
                        delayMs: 500,
                        retryIf: (error) => {
                            if ('code' in error) {
                                const errorCode = error.code;
                                return errorCode === '40P01'; // deadlock_detected
                            }
                            return false;
                        }
                    });
                }
            }));
            return Ok(summary);
        }
        catch (error) {
            let errorMessage = `Failed to upsert records to table ${RECORDS_TABLE}.\n`;
            errorMessage += `Model: ${model}, Nango Connection ID: ${connectionId}.\n`;
            errorMessage += `Attempted to insert/update/delete: ${recordsWithoutDuplicates.length} records\n`;
            if ('code' in error) {
                const errorCode = error.code;
                errorMessage += `Error code: ${errorCode}.\n`;
                let errorDetail = '';
                switch (errorCode) {
                    case '22001': {
                        errorDetail = "String length exceeds the column's maximum length (string_data_right_truncation)";
                        break;
                    }
                }
                if (errorDetail)
                    errorMessage += `Info: ${errorDetail}.\n`;
            }
            logger.error(`${errorMessage}${error}`);
            return Err(errorMessage);
        }
    });
}
export function update({ records, connectionId, model }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { records: recordsWithoutDuplicates, nonUniqueKeys } = removeDuplicateKey(records);
        if (!recordsWithoutDuplicates || recordsWithoutDuplicates.length === 0) {
            return Err(`There are no records to upsert because there were no records that were not duplicates to insert, but there were ${records.length} records received for the "${model}" model.`);
        }
        try {
            const updatedKeys = [];
            yield db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < recordsWithoutDuplicates.length; i += BATCH_SIZE) {
                    const chunk = recordsWithoutDuplicates.slice(i, i + BATCH_SIZE);
                    updatedKeys.push(...(yield getUpdatedKeys({ records: chunk, connectionId, model, trx })));
                    const recordsToUpdate = [];
                    const rawOldRecords = yield getRecordsByExternalIds({ externalIds: updatedKeys, connectionId, model, trx });
                    for (const rawOldRecord of rawOldRecords) {
                        if (!rawOldRecord) {
                            continue;
                        }
                        const { record: oldRecord } = rawOldRecord, oldRecordRest = __rest(rawOldRecord, ["record"]);
                        const record = records.find((record) => record.external_id === oldRecord.id);
                        const newRecord = Object.assign(Object.assign({}, oldRecordRest), { json: Object.assign(Object.assign({}, oldRecord), record === null || record === void 0 ? void 0 : record.json), updated_at: new Date() });
                        recordsToUpdate.push(newRecord);
                    }
                    const encryptedRecords = encryptRecords(recordsToUpdate);
                    yield trx.from(RECORDS_TABLE).insert(encryptedRecords).onConflict(['connection_id', 'external_id', 'model']).merge();
                }
            }));
            return Ok({
                addedKeys: [],
                updatedKeys,
                deletedKeys: [],
                nonUniqueKeys
            });
        }
        catch (error) {
            let errorMessage = `Failed to update records to table ${RECORDS_TABLE}.\n`;
            errorMessage += `Model: ${model}, Nango Connection ID: ${connectionId}.\n`;
            errorMessage += `Attempted to update: ${recordsWithoutDuplicates.length} records\n`;
            if ('code' in error)
                errorMessage += `Error code: ${error.code}.\n`;
            if ('detail' in error)
                errorMessage += `Detail: ${error.detail}.\n`;
            if ('message' in error)
                errorMessage += `Error Message: ${error.message}`;
            return Err(errorMessage);
        }
    });
}
export function deleteRecordsBySyncId({ syncId, limit = 5000 }) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalDeletedRecords = 0;
        let deletedRecords = 0;
        do {
            deletedRecords = yield db
                .from(RECORDS_TABLE)
                .whereIn('id', function (sub) {
                void sub.select('id').from(RECORDS_TABLE).where({ sync_id: syncId }).limit(limit);
            })
                .del();
            totalDeletedRecords += deletedRecords;
        } while (deletedRecords >= limit);
        return { totalDeletedRecords };
    });
}
// Mark all non-deleted records that don't belong to currentGeneration as deleted
// returns the ids of records being deleted
export function markNonCurrentGenerationRecordsAsDeleted({ connectionId, model, syncId, generation }) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = db.fn.now(6);
        return (yield db
            .from(RECORDS_TABLE)
            .where({
            connection_id: connectionId,
            model,
            sync_id: syncId,
            deleted_at: null
        })
            .whereNot({
            sync_job_id: generation
        })
            .update({
            deleted_at: now,
            updated_at: now,
            sync_job_id: generation
        })
            .returning('id'));
    });
}
/**
 * getUpdatedKeys
 * @desc returns a list of the keys that exist in the records tables but have a different data_hash
 */
function getUpdatedKeys({ records, connectionId, model, trx }) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = records.map((record) => getUniqueId(record));
        const keysWithHash = records.map((record) => [getUniqueId(record), record.data_hash]);
        const rowsToUpdate = (yield trx
            .from(RECORDS_TABLE)
            .pluck('external_id')
            .where({
            connection_id: connectionId,
            model
        })
            .whereIn('external_id', keys)
            .whereNotIn(['external_id', 'data_hash'], keysWithHash));
        return rowsToUpdate;
    });
}
function getUpsertSummary({ records, connectionId, model, nonUniqueKeys, softDelete, trx }) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = records.map((record) => getUniqueId(record));
        const nonDeletedKeys = yield trx
            .from(RECORDS_TABLE)
            .where({
            connection_id: connectionId,
            model,
            deleted_at: null
        })
            .whereIn('external_id', keys)
            .pluck('external_id');
        if (softDelete) {
            return {
                addedKeys: [],
                updatedKeys: [],
                deletedKeys: nonDeletedKeys,
                nonUniqueKeys: nonUniqueKeys
            };
        }
        else {
            const addedKeys = keys.filter((key) => !nonDeletedKeys.includes(key));
            const updatedKeys = yield getUpdatedKeys({ records, connectionId, model, trx });
            return {
                addedKeys,
                updatedKeys,
                deletedKeys: [],
                nonUniqueKeys: nonUniqueKeys
            };
        }
    });
}
function getRecordsByExternalIds({ externalIds, connectionId, model, trx }) {
    return __awaiter(this, void 0, void 0, function* () {
        const encryptedRecords = yield trx
            .from(RECORDS_TABLE)
            .where({
            connection_id: connectionId,
            model
        })
            .whereIn('external_id', externalIds);
        if (!encryptedRecords) {
            return [];
        }
        const result = decryptRecords(encryptedRecords);
        if (!result || result.length === 0) {
            return [];
        }
        return result;
    });
}
//# sourceMappingURL=records.js.map