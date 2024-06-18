import type { ActivityLog, ActivityLogMessage, LogAction } from '@nangohq/models/Activity.js';
export declare type ActivityLogMessagesGrouped = Record<number, ActivityLogMessage[]>;
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
export declare function createActivityLog(log: ActivityLog): Promise<number | null>;
export declare function updateProvider(id: number, provider: string): Promise<void>;
export declare function updateProviderConfigKey(id: number, provider_config_key: string): Promise<void>;
export declare function updateConnectionId(id: number, connection_id: string): Promise<void>;
export declare function updateProviderConfigAndConnectionId(id: number, provider_config_key: string, connection_id: string): Promise<void>;
export declare function updateSuccess(id: number, success: boolean | null): Promise<void>;
export declare function updateEndpoint(id: number, endpoint: string): Promise<void>;
export declare function updateAction(id: number, action: LogAction): Promise<void>;
export declare function createActivityLogAndLogMessage(log: ActivityLog, logMessage: ActivityLogMessage): Promise<number | null>;
export declare function createActivityLogMessage(logMessage: ActivityLogMessage, logToConsole?: boolean): Promise<boolean>;
export declare function addEndTime(activity_log_id: number): Promise<void>;
export declare function createActivityLogMessageAndEnd(logMessage: ActivityLogMessage): Promise<void>;
export declare function getTopLevelLogByEnvironment(
    environment_id: number,
    limit: number,
    offset: number,
    {
        status,
        script,
        connection,
        integration,
        date
    }: {
        status?: string | undefined;
        script?: string | undefined;
        connection?: string | undefined;
        integration?: string | undefined;
        date?: string | undefined;
    }
): Promise<ActivityLog[]>;
export declare function activityFilter(environment_id: number, filterColumn: 'connection_id' | 'provider_config_key'): Promise<string[]>;
/**
 * Retrieves log messages and organizes them by log ID using raw SQL.
 * @desc Iterates over an array of log IDs, fetching the corresponding log messages
 * from the database and grouping them by log ID using a raw SQL query.
 *
 * @param logIds - An array of log IDs to retrieve messages for.
 * @returns A promise that resolves to an object containing arrays of ActivityLogMessage objects,
 * each keyed by its associated log ID.
 */
export declare function getLogMessagesForLogs(logIds: number[], environment_id: number): Promise<ActivityLogMessagesGrouped>;
export declare function createActivityLogDatabaseErrorMessageAndEnd(
    baseMessage: string,
    error: any,
    activityLogId: number,
    environment_id: number
): Promise<void>;
export declare function findOldActivities({ retention, limit }: { retention: number; limit: number }): Promise<
    {
        id: number;
    }[]
>;
export declare function deleteLog({ activityLogId }: { activityLogId: number }): Promise<void>;
export declare function deleteLogsMessages({ activityLogId, limit }: { activityLogId: number; limit: number }): Promise<number>;
