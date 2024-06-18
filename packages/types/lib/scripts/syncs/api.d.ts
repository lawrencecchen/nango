export interface SyncResult {
    added: number;
    updated: number;
    deleted: number;
}
export declare type SyncType = 'INCREMENTAL' | 'INITIAL';
