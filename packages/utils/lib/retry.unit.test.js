var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it } from 'vitest';
import { retry } from './retry.js';
describe('retry', () => {
    it('should retry', () => __awaiter(void 0, void 0, void 0, function* () {
        let count = 0;
        const result = yield retry(() => {
            count++;
            if (count < 3) {
                throw new Error('my error');
            }
            return count;
        }, {
            maxAttempts: 3,
            delayMs: () => 0,
            retryIf: () => true
        });
        expect(result).toEqual(3);
    }));
    it('should throw error after max attempts', () => __awaiter(void 0, void 0, void 0, function* () {
        let count = 0;
        try {
            yield retry(() => {
                count++;
                throw new Error('my error');
            }, {
                maxAttempts: 3,
                delayMs: () => 0,
                retryIf: () => true
            });
        }
        catch (error) {
            expect(error.message).toEqual('my error');
        }
        expect(count).toBe(3);
    }));
    it('should not retry if error condition is false ', () => __awaiter(void 0, void 0, void 0, function* () {
        let count = 0;
        try {
            yield retry(() => {
                count++;
                if (count < 3) {
                    throw new Error('my error');
                }
                return count;
            }, {
                maxAttempts: 3,
                delayMs: () => 0,
                retryIf: (error) => error.message === 'another error'
            });
        }
        catch (error) {
            expect(error.message).toEqual('my error');
        }
        expect(count).toBe(1);
    }));
});
//# sourceMappingURL=retry.unit.test.js.map