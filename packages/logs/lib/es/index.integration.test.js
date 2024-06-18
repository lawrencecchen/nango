var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { beforeAll, describe, expect, it } from 'vitest';
import { nanoid } from '@nangohq/utils';
import { deleteIndex, migrateMapping } from './helpers.js';
import { client } from './client.js';
import { indexMessages } from './schema.js';
import { createMessage, getOperation, update } from '../models/messages.js';
import { getFormattedMessage } from '../models/helpers.js';
// This file is sequential
describe('mapping', () => {
    const today = new Date().toISOString().split('T')[0];
    let fullIndexName;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        indexMessages.index = `index-messages-${nanoid()}`.toLocaleLowerCase();
        fullIndexName = `${indexMessages.index}.${today}`;
        // Delete before otherwise it's hard to debug
        yield deleteIndex({ prefix: 'index-messages' });
    }));
    it('should not have an index before migration', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect(client.indices.getMapping({ index: fullIndexName })).rejects.toThrow();
    }));
    it('should migrate', () => __awaiter(void 0, void 0, void 0, function* () {
        yield migrateMapping();
    }));
    it('should have create index and alias', () => __awaiter(void 0, void 0, void 0, function* () {
        yield client.indices.getMapping({ index: indexMessages.index });
        yield client.indices.getMapping({ index: fullIndexName });
    }));
    it('should create one index automatically on log', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const today = new Date();
        // Log to automatically create an index
        const id = nanoid();
        yield createMessage(getFormattedMessage({ id, message: 'hello', operation: { type: 'action' }, createdAt: today.toISOString() }));
        yield update({ id, data: { state: 'failed', createdAt: today.toISOString() } });
        // Should have created a today index
        const mapping = yield client.indices.getMapping({ index: fullIndexName });
        expect(mapping[fullIndexName]).toMatchSnapshot();
        const settings = yield client.indices.getSettings({ index: fullIndexName });
        expect((_c = (_b = (_a = settings[fullIndexName]) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b.index) === null || _c === void 0 ? void 0 : _c.analysis).toMatchSnapshot();
        expect((_f = (_e = (_d = settings[fullIndexName]) === null || _d === void 0 ? void 0 : _d.settings) === null || _e === void 0 ? void 0 : _e.index) === null || _f === void 0 ? void 0 : _f.sort).toMatchSnapshot();
        expect((_j = (_h = (_g = settings[fullIndexName]) === null || _g === void 0 ? void 0 : _g.settings) === null || _h === void 0 ? void 0 : _h.index) === null || _j === void 0 ? void 0 : _j.lifecycle).toMatchSnapshot();
    }));
    it('should create yesterday index automatically', () => __awaiter(void 0, void 0, void 0, function* () {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayIndexName = `${indexMessages.index}.${yesterday.toISOString().split('T')[0]}`;
        // Log to automatically create an index
        const id = nanoid();
        yield createMessage(getFormattedMessage({ id, message: 'hello', operation: { type: 'action' }, createdAt: yesterday.toISOString() }));
        yield update({ id, data: { state: 'failed', createdAt: yesterday.toISOString() } });
        // Should have created a yesterday index
        yield client.indices.getMapping({ index: yesterdayIndexName });
        const doc = yield getOperation({ id });
        expect(doc.state).toBe('failed');
    }));
});
//# sourceMappingURL=index.integration.test.js.map