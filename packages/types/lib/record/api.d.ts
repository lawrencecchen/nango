export declare type RecordLastAction = 'ADDED' | 'UPDATED' | 'DELETED' | 'added' | 'updated' | 'deleted';
export interface RecordMetadata {
    first_seen_at: string;
    last_modified_at: string;
    last_action: RecordLastAction;
    deleted_at: string | null;
    cursor: string;
}
export interface NangoRecord {
    [key: string]: any;
    id: string | number;
    _nango_metadata: RecordMetadata;
}
