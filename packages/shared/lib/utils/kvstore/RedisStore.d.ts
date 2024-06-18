import type { KVStore } from './KVStore.js';
export declare class RedisKVStore implements KVStore {
    private client;
    constructor(url: string);
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, canOverride?: boolean, ttlInMs?: number): Promise<void>;
    exists(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
}
