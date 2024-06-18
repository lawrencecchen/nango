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
import * as NangoConfigService from './nango-config.service.js';
describe('Nango Config Interval tests', () => {
    it('throws error when interval is less than 5 minutes', () => __awaiter(void 0, void 0, void 0, function* () {
        const { success, error } = NangoConfigService.getInterval('every 4m', new Date());
        expect(success).toBe(false);
        expect(error === null || error === void 0 ? void 0 : error.message).toBe('Sync interval is too short. The minimum interval is 5 minutes.');
    }));
    it('Can parse every half day', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        let { success, error, response } = NangoConfigService.getInterval('every half day', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '12h', offset: 0 });
        const tenMinutes = new Date('2023-07-18T00:10:00');
        ({ success, error, response } = NangoConfigService.getInterval('every half day', tenMinutes));
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '12h', offset: 600000 });
    }));
    it('Can parse every 1.5 hours', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error, response } = NangoConfigService.getInterval('every 1.5 hours', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '1.5 hours', offset: 0 });
    }));
    it('Can parse every day', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error, response } = NangoConfigService.getInterval('every day', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '1d', offset: 0 });
    }));
    it('Can parse every 5 minutes', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error, response } = NangoConfigService.getInterval('every 5m', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '5m', offset: 0 });
    }));
    it('Can parse every 10 minutes', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error, response } = NangoConfigService.getInterval('every 10m', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '10m', offset: 0 });
    }));
    it('Can parse every week', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error, response } = NangoConfigService.getInterval('every week', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '1w', offset: 0 });
    }));
    it('Can parse every month', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error, response } = NangoConfigService.getInterval('every month', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '30d', offset: 0 });
    }));
    it('Returns error for unsupported interval format', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T00:00:00');
        const { success, error } = NangoConfigService.getInterval('every yearasdad', date);
        expect(success).toBe(false);
        expect(error === null || error === void 0 ? void 0 : error.message).toBe('Sync interval is invalid. The interval should be a time unit.');
    }));
    it('Can parse intervals with different starting offset', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T12:30:00');
        const { success, error, response } = NangoConfigService.getInterval('every 1h', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '1h', offset: 1800000 });
    }));
    it('Gives back a correct offset', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T12:30:00');
        const { success, error, response } = NangoConfigService.getInterval('every 1h', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '1h', offset: 1800000 });
    }));
    it('Gives back a correct offset with 5 after with an interval of 30 minutes', () => __awaiter(void 0, void 0, void 0, function* () {
        const date = new Date('2023-07-18T12:35:00');
        const { success, error, response } = NangoConfigService.getInterval('every 30m', date);
        expect(success).toBe(true);
        expect(error).toBe(null);
        expect(response).toEqual({ interval: '30m', offset: 300000 }); // 300000 is 5 minutes
    }));
});
//# sourceMappingURL=nango-config.service.unit.test.js.map