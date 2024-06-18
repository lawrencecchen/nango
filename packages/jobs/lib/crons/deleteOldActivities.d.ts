export declare function deleteOldActivityLogs(): void;
/**
 * Postgres does not allow DELETE LIMIT so we batch ourself to limit the memory footprint of this query.
 */
export declare function exec(): Promise<void>;
