import type { KVStore } from './KVStore.js';
export declare class FeatureFlags {
    kvstore: KVStore | undefined;
    constructor(kvstore: KVStore | undefined);
    isEnabled({
        key,
        distinctId,
        fallback,
        isExcludingFlag
    }: {
        key: string;
        distinctId: string;
        fallback: boolean;
        isExcludingFlag?: boolean;
    }): Promise<boolean>;
}
