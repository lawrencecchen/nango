import type { KVStore } from './KVStore.js';
export declare class InMemoryKVStore implements KVStore {
    private store;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string, canOverride?: boolean, ttlInMs?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    private isExpired;
}
