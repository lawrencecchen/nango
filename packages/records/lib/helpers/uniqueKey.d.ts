import type { FormattedRecord } from '../types.js';
export declare function getUniqueId(record: FormattedRecord): string;
export declare function verifyUniqueKeysAreUnique(records: FormattedRecord[]): {
    nonUniqueKeys: Set<string>;
};
export declare function removeDuplicateKey(records: FormattedRecord[]): {
    records: FormattedRecord[];
    nonUniqueKeys: string[];
};
