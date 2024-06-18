import type { KVStore } from '../kvstore/KVStore.js';
export declare class Locking {
    private store;
    constructor(store: KVStore);
    tryAcquire(key: string, ttlInMs: number, acquisitionTimeoutMs: number): Promise<void>;
    acquire(key: string, ttlInMs: number): Promise<void>;
    release(key: string): Promise<void>;
}
