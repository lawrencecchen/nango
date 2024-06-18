var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { getLogger } from '@nangohq/utils';
import errorManager, { ErrorSourceEnum } from '../../utils/error.manager.js';
const logger = getLogger('Activity');
const activityLogTableName = '_nango_activity_logs';
const activityLogMessageTableName = '_nango_activity_log_messages';
/**
 * _nango_activity_logs
 * _nango_activity_log_messages
 * @desc Store activity logs for all user facing operations
 *
 * _nango_activity_logs:
 *      index:
 *          - environment_id
 *          - session_id
 *
 * _nango_activity_log_messages:
 *     index:
 *          - environment_id
 *          - activity_log_id: activity_log_id_index
 *          - created_at: created_at_index
 */
export function createActivityLog(log) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!log.environment_id) {
            return null;
        }
        try {
            const result = yield db.knex.from(activityLogTableName).insert(log, ['id']);
            if (Array.isArray(result) && result.length === 1 && result[0] !== null && 'id' in result[0]) {
                return result[0].id;
            }
        }
        catch (e) {
            errorManager.report(e, {
                source: ErrorSourceEnum.PLATFORM,
                environmentId: log.environment_id,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    log
                }
            });
        }
        return null;
    });
}
export function updateProvider(id, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!id) {
            return;
        }
        yield db.knex.from(activityLogTableName).where({ id }).update({
            provider
        });
    });
}
export function updateProviderConfigKey(id, provider_config_key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!id) {
            return;
        }
        yield db.knex.from(activityLogTableName).where({ id }).update({
            provider_config_key
        });
    });
}
export function updateConnectionId(id, connection_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex.from(activityLogTableName).where({ id }).update({
            connection_id
        });
    });
}
export function updateProviderConfigAndConnectionId(id, provider_config_key, connection_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateConnectionId(id, connection_id);
        yield db.knex.from(activityLogTableName).where({ id }).update({
            provider_config_key
        });
    });
}
export function updateSuccess(id, success) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!id) {
            return;
        }
        yield db.knex.from(activityLogTableName).where({ id }).update({
            success
        });
    });
}
export function updateEndpoint(id, endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!id) {
            return;
        }
        yield db.knex.from(activityLogTableName).where({ id }).update({
            endpoint
        });
    });
}
export function updateAction(id, action) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex.from(activityLogTableName).where({ id }).update({
            action
        });
    });
}
export function createActivityLogAndLogMessage(log, logMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const logId = yield createActivityLog(log);
        if (logId === null) {
            return null;
        }
        logMessage.activity_log_id = logId;
        yield createActivityLogMessage(logMessage);
        return logId;
    });
}
export function createActivityLogMessage(logMessage, logToConsole = true) {
    return __awaiter(this, void 0, void 0, function* () {
        if (logToConsole) {
            logger.log(logMessage.level, logMessage.content);
        }
        if (!logMessage.activity_log_id) {
            return false;
        }
        try {
            const result = yield db.knex.from(activityLogMessageTableName).insert(logMessage, ['id']);
            if (Array.isArray(result) && result.length === 1 && result[0] !== null && 'id' in result[0]) {
                return true;
            }
        }
        catch (e) {
            errorManager.report(e, {
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    logMessage
                }
            });
        }
        return false;
    });
}
export function addEndTime(activity_log_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db.knex.from(activityLogTableName).where({ id: activity_log_id }).update({
                end: Date.now()
            });
        }
        catch (e) {
            errorManager.report(e, {
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    activity_log_id
                }
            });
        }
    });
}
export function createActivityLogMessageAndEnd(logMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!logMessage.activity_log_id) {
            return;
        }
        yield createActivityLogMessage(logMessage);
        if (logMessage.activity_log_id !== undefined) {
            yield addEndTime(logMessage.activity_log_id);
        }
    });
}
export function getTopLevelLogByEnvironment(environment_id, limit = 20, offset = 0, { status, script, connection, integration, date }) {
    return __awaiter(this, void 0, void 0, function* () {
        const logs = db.knex
            .from('_nango_activity_logs')
            .where({ environment_id })
            .orderBy('_nango_activity_logs.timestamp', 'desc')
            .offset(offset)
            .limit(limit);
        if (status === 'success' || status === 'failure') {
            logs.where({ success: status === 'success' });
        }
        if (status === 'in_progress') {
            logs.where({ success: null });
        }
        if (script) {
            logs.where({ operation_name: script });
        }
        if (connection) {
            logs.where({ connection_id: connection });
        }
        if (integration) {
            logs.where({ provider_config_key: integration });
        }
        if (date) {
            const dateObj = new Date(date);
            const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0'); // Add leading zero if needed
            const day = dateObj.getUTCDate().toString().padStart(2, '0'); // Add leading zero if needed
            const formattedDate = `${month}/${day}/${dateObj.getUTCFullYear()}`;
            logs.whereRaw("date_trunc('day', to_timestamp(_nango_activity_logs.timestamp / 1000)) = ?", [formattedDate]);
        }
        yield logs.select('_nango_activity_logs.*');
        return logs || [];
    });
}
export function activityFilter(environment_id, filterColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        const logsQuery = db.knex
            .from('_nango_activity_logs')
            .where({
            environment_id
        })
            .andWhereNot({
            [filterColumn]: '',
            action: 'sync deploy'
        })
            .whereNotNull(filterColumn)
            .groupBy(filterColumn)
            .select(filterColumn)
            .orderBy(filterColumn, 'asc');
        const logs = yield logsQuery;
        const distinctValues = logs
            .map((log) => log[filterColumn])
            .filter((value) => typeof value === 'string');
        return distinctValues;
    });
}
/**
 * Retrieves log messages and organizes them by log ID using raw SQL.
 * @desc Iterates over an array of log IDs, fetching the corresponding log messages
 * from the database and grouping them by log ID using a raw SQL query.
 *
 * @param logIds - An array of log IDs to retrieve messages for.
 * @returns A promise that resolves to an object containing arrays of ActivityLogMessage objects,
 * each keyed by its associated log ID.
 */
export function getLogMessagesForLogs(logIds, environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const limit = 1000;
            // Rank Partition will create one group per activity_log_id
            // and allow us to ORDER with a GROUP by and add a "pseudo limit"
            const query = `
        SELECT
            *
        FROM (
            SELECT
                *,
                RANK() OVER (PARTITION BY activity_log_id ORDER BY created_at DESC) AS rank
            FROM
                _nango_activity_log_messages) AS partition
        WHERE
            activity_log_id IN (${logIds.map(() => '?').join(',')})
            AND environment_id = ${environment_id}
            AND partition.rank <= ${limit};`;
            const result = yield db.knex.raw(query, logIds);
            const groupedMessages = {};
            for (const row of result.rows) {
                if (typeof groupedMessages[row.activity_log_id] === 'undefined') {
                    groupedMessages[row.activity_log_id] = [];
                }
                groupedMessages[row.activity_log_id].push(row);
            }
            return groupedMessages;
        }
        catch (error) {
            console.error(error);
            return [];
        }
    });
}
export function createActivityLogDatabaseErrorMessageAndEnd(baseMessage, error, activityLogId, environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let errorMessage = baseMessage;
        if ('code' in error)
            errorMessage += ` Error code: ${error.code}.\n`;
        if ('detail' in error)
            errorMessage += ` Detail: ${error.detail}.\n`;
        errorMessage += `Error Message: ${error.message}`;
        yield createActivityLogMessageAndEnd({
            level: 'error',
            environment_id,
            activity_log_id: activityLogId,
            timestamp: Date.now(),
            content: errorMessage
        });
    });
}
export function findOldActivities({ retention, limit }) {
    return __awaiter(this, void 0, void 0, function* () {
        const q = db.knex
            .queryBuilder()
            .from('_nango_activity_logs')
            .select('id')
            .where(db.knex.raw(`_nango_activity_logs.updated_at <  NOW() - INTERVAL '${retention} days'`))
            .limit(limit);
        const logs = yield q;
        return logs;
    });
}
export function deleteLog({ activityLogId }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex.from('_nango_activity_logs').where({ id: activityLogId }).del();
    });
}
export function deleteLogsMessages({ activityLogId, limit }) {
    return __awaiter(this, void 0, void 0, function* () {
        const del = yield db.knex
            .from('_nango_activity_log_messages')
            .whereIn('id', db.knex.queryBuilder().select('id').from('_nango_activity_log_messages').where({ activity_log_id: activityLogId }).limit(limit))
            .del();
        return del;
    });
}
//# sourceMappingURL=activity.service.js.map