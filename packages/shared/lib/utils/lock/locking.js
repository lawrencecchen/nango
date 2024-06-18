var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { stringifyError } from '@nangohq/utils';
export class Locking {
    constructor(store) {
        this.store = store;
    }
    tryAcquire(key, ttlInMs, acquisitionTimeoutMs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ttlInMs <= 0) {
                throw new Error(`lock's TTL must be greater than 0`);
            }
            if (acquisitionTimeoutMs <= 0) {
                throw new Error(`acquisitionTimeoutMs must be greater than 0`);
            }
            const start = Date.now();
            while (Date.now() - start < acquisitionTimeoutMs) {
                try {
                    yield this.acquire(key, ttlInMs);
                    return;
                }
                catch (_a) {
                    yield new Promise((resolve) => setTimeout(resolve, 50));
                }
            }
            throw new Error(`Acquiring lock for key: ${key} timed out after ${acquisitionTimeoutMs}ms`);
        });
    }
    acquire(key, ttlInMs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ttlInMs <= 0) {
                throw new Error(`lock's TTL must be greater than 0`);
            }
            try {
                yield this.store.set(key, '1', false, ttlInMs);
            }
            catch (err) {
                throw new Error(`Failed to acquire lock for key: ${key} ${stringifyError(err)}`);
            }
        });
    }
    release(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store.delete(key);
        });
    }
}
//# sourceMappingURL=locking.js.map