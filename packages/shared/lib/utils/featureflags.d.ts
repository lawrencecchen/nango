import { RedisKVStore } from './kvstore/RedisStore.js';
declare class FeatureFlags {
    redis: RedisKVStore | undefined;
    constructor(redis: RedisKVStore | undefined);
    isEnabled(key: string, distinctId: string, fallback: boolean, isExcludingFlag?: boolean): Promise<boolean>;
}
declare const _default: FeatureFlags;
export default _default;
