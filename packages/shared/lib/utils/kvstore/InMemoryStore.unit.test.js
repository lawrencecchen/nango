var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryKVStore } from './InMemoryStore.js';
describe('InMemoryKVStore', () => {
    let store;
    beforeEach(() => {
        store = new InMemoryKVStore();
    });
    it('should set and get a value', () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.set('key', 'value');
        const value = yield store.get('key');
        expect(value).toEqual('value');
    }));
    it('should return null for a non-existent key', () => __awaiter(void 0, void 0, void 0, function* () {
        const value = yield store.get('do-not-exist');
        expect(value).toBeNull();
    }));
    it('should allow overriding a key', () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.set('key', 'value');
        yield store.set('key', 'value2', true);
        const value = yield store.get('key');
        expect(value).toEqual('value2');
    }));
    it('should not allow overriding a key', () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.set('key', 'value');
        yield expect(store.set('key', 'value2', false)).rejects.toEqual(new Error('Key already exists'));
    }));
    it('should return null for a key that has expired', () => __awaiter(void 0, void 0, void 0, function* () {
        const ttlInMs = 1000;
        yield store.set('key', 'value', true, ttlInMs);
        yield new Promise((resolve) => setTimeout(resolve, ttlInMs * 2));
        const value = yield store.get('key');
        expect(value).toBeNull();
    }));
    it('should not return null for a key that has not expired', () => __awaiter(void 0, void 0, void 0, function* () {
        const ttlInMs = 2000;
        yield store.set('key', 'value', true, ttlInMs);
        yield new Promise((resolve) => setTimeout(resolve, ttlInMs / 2));
        const value = yield store.get('key');
        expect(value).toEqual('value');
    }));
    it('should allow setting an expired key', () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.set('key', 'value', false, 10);
        yield new Promise((resolve) => setTimeout(resolve, 20));
        yield expect(store.set('key', 'value', false)).resolves.not.toThrow();
    }));
    it('should allow setting a key with a TTL of 0', () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.set('key', 'value', true, 0);
        const value = yield store.get('key');
        expect(value).toEqual('value');
    }));
    it('should allow deleting a key', () => __awaiter(void 0, void 0, void 0, function* () {
        yield store.delete('key');
        const value = yield store.get('key');
        expect(value).toBeNull();
    }));
    it('should allow checking if a key exists', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect(store.exists('key')).resolves.toEqual(false);
        yield store.set('key', 'value');
        yield expect(store.exists('key')).resolves.toEqual(true);
    }));
});
//# sourceMappingURL=InMemoryStore.unit.test.js.map