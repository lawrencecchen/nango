var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Locking } from './locking.js';
import { InMemoryKVStore } from '../kvstore/InMemoryStore.js';
describe('Locking', () => {
    let store;
    let locking;
    const KEY = 'key';
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        store = new InMemoryKVStore();
        locking = new Locking(store);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        store.delete(KEY);
    }));
    it('should acquire and release a lock', () => __awaiter(void 0, void 0, void 0, function* () {
        yield locking.acquire(KEY, 1000);
        yield locking.release(KEY);
    }));
    it('should throws an error if ttlInMs is not positive', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect(locking.acquire(KEY, 0)).rejects.toEqual(new Error(`lock's TTL must be greater than 0`));
        yield expect(locking.tryAcquire(KEY, 0, 10000)).rejects.toThrowError(`lock's TTL must be greater than 0`);
    }));
    it('should prevents acquisition of existing lock', () => __awaiter(void 0, void 0, void 0, function* () {
        yield locking.acquire(KEY, 1000);
        yield expect(locking.acquire(KEY, 1000)).rejects.toThrowError('Failed to acquire lock for key: key');
    }));
    it('should aquire an expired lock', () => __awaiter(void 0, void 0, void 0, function* () {
        yield locking.acquire(KEY, 200);
        yield new Promise((resolve) => setTimeout(resolve, 500));
        yield locking.acquire(KEY, 200);
    }));
    it('should wait and acquire a expired lock', () => __awaiter(void 0, void 0, void 0, function* () {
        yield locking.acquire(KEY, 1000);
        yield expect(locking.tryAcquire(KEY, 200, 2000)).resolves.not.toThrow();
    }));
    it('should wait and acquire a released lock', () => __awaiter(void 0, void 0, void 0, function* () {
        yield locking.acquire(KEY, 1000);
        setTimeout(() => {
            locking.release(KEY);
        }, 500);
        yield expect(locking.tryAcquire(KEY, 200, 1000)).resolves.not.toThrow();
    }));
});
//# sourceMappingURL=locking.unit.test.js.map