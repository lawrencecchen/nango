import type { KVStore } from './KVStore.js.js';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

export class RedisKVStore implements KVStore {
    private client: RedisClientType;

    constructor(url: string) {
        this.client = createClient({ url: url });

        this.client.on('error', (err) => {
            console.error(`Redis (kvstore) error: ${err}`);
        });
    }

    public async connect(): Promise<void> {
        return this.client.connect().then(() => {});
    }

    public async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    public async set(key: string, value: string, opts?: { canOverride?: boolean; ttlInMs?: number }): Promise<void> {
        const options: any = {};
        if (opts) {
            if (opts.ttlInMs && opts.ttlInMs > 0) {
                options['PX'] = opts.ttlInMs;
            }
            if (opts.canOverride === false) {
                options['NX'] = true;
            }
        }
        const res = await this.client.set(key, value, options);
        if (res !== 'OK') {
            throw new Error(`Failed to set key: ${key}, value: ${value}, ${JSON.stringify(options)}`);
        }
    }

    public async exists(key: string): Promise<boolean> {
        return (await this.client.exists(key)) > 0;
    }

    public async delete(key: string): Promise<void> {
        await this.client.del(key);
    }
}
