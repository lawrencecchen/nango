var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { InMemoryKVStore } from './InMemoryStore.js';
import { RedisKVStore } from './RedisStore.js';
export { InMemoryKVStore } from './InMemoryStore.js';
export { RedisKVStore } from './RedisStore.js';
export function createKVStore() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = process.env['NANGO_REDIS_URL'];
        if (url) {
            const store = new RedisKVStore(url);
            yield store.connect();
            return store;
        }
        return new InMemoryKVStore();
    });
}
//# sourceMappingURL=index.js.map