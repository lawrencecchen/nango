import { InMemoryKVStore } from './InMemoryStore.js.js';
import { RedisKVStore } from './RedisStore.js.js';

export { InMemoryKVStore } from './InMemoryStore.js.js';
export { RedisKVStore } from './RedisStore.js.js';
export type { KVStore } from './KVStore.js.js';

export async function createKVStore() {
    const url = process.env['NANGO_REDIS_URL'];
    if (url) {
        const store = new RedisKVStore(url);
        await store.connect();
        return store;
    }

    return new InMemoryKVStore();
}
