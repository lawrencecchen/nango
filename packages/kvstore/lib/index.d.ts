import { InMemoryKVStore } from './InMemoryStore.js';
import { RedisKVStore } from './RedisStore.js';
export { InMemoryKVStore } from './InMemoryStore.js';
export { RedisKVStore } from './RedisStore.js';
export type { KVStore } from './KVStore.js';
export declare function createKVStore(): Promise<InMemoryKVStore | RedisKVStore>;
