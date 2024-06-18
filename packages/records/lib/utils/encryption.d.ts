import type { FormattedRecord, UnencryptedRecord, UnencryptedRecordData } from '../types.js';
export declare function decryptRecord(record: FormattedRecord): UnencryptedRecordData;
export declare function decryptRecords(records: FormattedRecord[]): UnencryptedRecord[];
export declare function encryptRecords(records: FormattedRecord[]): FormattedRecord[];
