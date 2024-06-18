declare type RecordValue = string | number | boolean | null | undefined | object | Record<string, string | boolean | number>;
export interface RecordInput {
    id: string;
    [index: string]: RecordValue;
}
export interface FormattedRecord {
    id: string;
    external_id: string;
    json: RecordData;
    data_hash: string;
    connection_id: number;
    model: string;
    sync_id: string;
    sync_job_id: number;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}
export declare type FormattedRecordWithMetadata = FormattedRecord & RecordMetadata;
export declare type UnencryptedRecord = FormattedRecord & {
    record: UnencryptedRecordData;
};
export interface EncryptedRecordData {
    iv: string;
    authTag: string;
    encryptedValue: string;
}
export declare type RecordData = UnencryptedRecordData | EncryptedRecordData;
export declare type UnencryptedRecordData = Record<string, RecordValue> & {
    id: string;
};
export declare type ReturnedRecord = {
    _nango_metadata: RecordMetadata;
} & Record<string, RecordValue> & {
        id: string;
    };
export declare type LastAction = 'ADDED' | 'UPDATED' | 'DELETED' | 'added' | 'updated' | 'deleted';
interface RecordMetadata {
    first_seen_at: string;
    last_modified_at: string;
    last_action: LastAction;
    deleted_at: string | null;
    cursor: string;
}
export interface GetRecordsResponse {
    records: ReturnedRecord[];
    next_cursor?: string | null;
}
export interface UpsertSummary {
    addedKeys: string[];
    updatedKeys: string[];
    deletedKeys?: string[];
    nonUniqueKeys: string[];
}
export {};
