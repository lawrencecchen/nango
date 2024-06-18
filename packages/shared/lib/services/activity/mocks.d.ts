export declare function mockCreateActivityLog(): import('@vitest/spy').SpyInstance<[log: ActivityLog], Promise<number>>;
export declare function mockCreateActivityLogMessage(): import('@vitest/spy').SpyInstance<
    [logMessage: ActivityLogMessage, logToConsole?: boolean],
    Promise<boolean>
>;
export declare function mockUpdateSuccess(): import('@vitest/spy').SpyInstance<[id: number, success: boolean], Promise<void>>;
export declare function mockAddEndTime(): import('@vitest/spy').SpyInstance<[activity_log_id: number], Promise<void>>;
