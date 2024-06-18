var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createClient } from 'redis';
export class RedisKVStore {
    constructor(url) {
        this.client = createClient({ url: url });
        this.client.on('error', (err) => {
            console.error(`Redis (kvstore) error: ${err}`);
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.connect().then(() => { });
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(key);
        });
    }
    set(key, value, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {};
            if (opts) {
                if (opts.ttlInMs && opts.ttlInMs > 0) {
                    options['PX'] = opts.ttlInMs;
                }
                if (opts.canOverride === false) {
                    options['NX'] = true;
                }
            }
            const res = yield this.client.set(key, value, options);
            if (res !== 'OK') {
                throw new Error(`Failed to set key: ${key}, value: ${value}, ${JSON.stringify(options)}`);
            }
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.client.exists(key)) > 0;
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.del(key);
        });
    }
}
//# sourceMappingURL=RedisStore.js.map