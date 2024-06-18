var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class InMemoryKVStore {
    constructor() {
        this.store = new Map();
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = this.store.get(key);
            if (res === undefined) {
                return null;
            }
            if (this.isExpired(res)) {
                this.store.delete(key);
                return null;
            }
            return Promise.resolve(res.value);
        });
    }
    set(key, value, canOverride = true, ttlInMs = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = this.store.get(key);
            const isExpired = res && this.isExpired(res);
            if (isExpired || canOverride || res === undefined) {
                this.store.set(key, { value: value, timestamp: Date.now(), ttlInMs: ttlInMs });
                return Promise.resolve();
            }
            return Promise.reject(new Error('Key already exists'));
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            this.store.delete(key);
            return Promise.resolve();
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(this.store.has(key));
        });
    }
    isExpired(value) {
        if (value.ttlInMs > 0 && value.timestamp + value.ttlInMs < Date.now()) {
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=InMemoryStore.js.map