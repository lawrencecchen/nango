var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
/* eslint-disable @typescript-eslint/unbound-method */
import { Nango } from '@nangohq/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockErrorManagerReport } from '../utils/error.manager.mocks.js';
import configService from '../services/config.service.js';
import { NangoAction } from './sync.js';
import { isValidHttpUrl } from '../utils/utils.js';
import proxyService from '../services/proxy.service.js';
const nangoProps = {
    secretKey: '***',
    providerConfigKey: 'github',
    connectionId: 'connection-1',
    dryRun: false,
    activityLogId: 1,
    accountId: 1,
    environmentId: 1,
    lastSyncDate: new Date()
};
describe('cache', () => {
    let nangoAction;
    let nango;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        nangoAction = new NangoAction(Object.assign({}, nangoProps));
        nango = new Nango({ secretKey: '***' });
        const nodeClient = (yield import('@nangohq/node')).Nango;
        nodeClient.prototype.getConnection = vi.fn().mockReturnValue({ credentials: {} });
        nodeClient.prototype.setMetadata = vi.fn().mockReturnValue({});
        nodeClient.prototype.getIntegration = vi.fn().mockReturnValue({ config: { provider: 'github' } });
        vi.spyOn(proxyService, 'route').mockImplementation(() => Promise.resolve({ response: {}, activityLogs: [] }));
    }));
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Proxy', () => {
        it('memoizes connection', () => __awaiter(void 0, void 0, void 0, function* () {
            yield nangoAction.proxy({ endpoint: '/issues' });
            yield nangoAction.proxy({ endpoint: '/issues' });
            expect(nango.getConnection).toHaveBeenCalledTimes(1);
        }));
        it('get connection if memoized connection is too old', () => __awaiter(void 0, void 0, void 0, function* () {
            yield nangoAction.proxy({ endpoint: '/issues' });
            const later = Date.now() + 61000;
            vi.spyOn(Date, 'now').mockReturnValue(later);
            yield nangoAction.proxy({ endpoint: '/issues' });
            expect(nango.getConnection).toHaveBeenCalledTimes(2);
        }));
    });
    describe('Metadata', () => {
        it('getMetadata should reuse connection', () => __awaiter(void 0, void 0, void 0, function* () {
            yield nangoAction.getConnection();
            yield nangoAction.getMetadata();
            expect(nango.getConnection).toHaveBeenCalledTimes(1);
        }));
        it('setMetadata should invalidate connection', () => __awaiter(void 0, void 0, void 0, function* () {
            yield nangoAction.getConnection();
            yield nangoAction.setMetadata({});
            yield nangoAction.getConnection();
            yield nangoAction.getMetadata();
            expect(nango.getConnection).toHaveBeenCalledTimes(2);
        }));
    });
    describe('Integration', () => {
        it('getWebhookURL should reuse integration', () => __awaiter(void 0, void 0, void 0, function* () {
            yield nangoAction.getWebhookURL();
            yield nangoAction.getWebhookURL();
            expect(nango.getIntegration).toHaveBeenCalledTimes(1);
        }));
    });
});
describe('Pagination', () => {
    const providerConfigKey = 'github';
    const connectionId = 'connection-1';
    const cursorPagination = {
        type: 'cursor',
        cursor_path_in_response: 'metadata.next_cursor',
        cursor_name_in_request: 'cursor',
        limit_name_in_request: 'limit',
        response_path: 'issues'
    };
    const offsetPagination = {
        type: 'offset',
        limit_name_in_request: 'per_page',
        offset_name_in_request: 'offset',
        response_path: 'issues'
    };
    const linkPagination = {
        type: 'link',
        response_path: 'issues',
        limit_name_in_request: 'limit',
        link_path_in_response_body: 'metadata.next_cursor'
    };
    const paginationConfigs = [cursorPagination, offsetPagination, linkPagination];
    let nangoAction;
    let nango;
    beforeEach(() => {
        const config = {
            secretKey: 'encrypted',
            serverUrl: 'https://example.com',
            providerConfigKey,
            connectionId,
            dryRun: true
        };
        nangoAction = new NangoAction(config);
        nango = new Nango({ secretKey: config.secretKey });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    it('Throws error if there is no pagination config in provider template', () => __awaiter(void 0, void 0, void 0, function* () {
        const template = {
            auth_mode: 'OAUTH2',
            proxy: { base_url: '' },
            authorization_url: '',
            token_url: ''
        };
        (yield import('@nangohq/node')).Nango.prototype.getIntegration = vi.fn().mockReturnValue({ config: { provider: 'github' } });
        vi.spyOn(configService, 'getTemplate').mockImplementation(() => template);
        const expectedErrorMessage = 'There was no pagination configuration for this integration or configuration passed in';
        yield expect(() => nangoAction.paginate({ endpoint: '' }).next()).rejects.toThrowError(expectedErrorMessage);
    }));
    it('Sends pagination params in body for POST HTTP method', () => __awaiter(void 0, void 0, void 0, function* () {
        stubProviderTemplate(cursorPagination);
        mockErrorManagerReport();
        vi.spyOn(configService, 'getProviderConfig').mockImplementation(() => {
            return Promise.resolve({});
        });
        // TODO: mock to return at least one more page to check that cursor is passed in body too
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi.fn().mockReturnValue({ data: { issues: [] } });
        (yield import('@nangohq/node')).Nango.prototype.getIntegration = vi.fn().mockReturnValue({ config: { provider: 'github' } });
        (yield import('@nangohq/node')).Nango.prototype.getConnection = vi.fn().mockReturnValue({ credentials: {} });
        const endpoint = '/issues';
        yield nangoAction.paginate({ endpoint, method: 'POST', paginate: { limit: 2 }, connectionId: 'abc' }).next();
        expect(nango.proxy).toHaveBeenCalledWith({
            method: 'POST',
            endpoint,
            headers: {
                'user-agent': expect.any(String)
            },
            data: { limit: 2 },
            paginate: { limit: 2 },
            connectionId: 'abc',
            providerConfigKey: 'github'
        });
    }));
    it('Overrides template pagination params with ones passed in the proxy config', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        stubProviderTemplate(cursorPagination);
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi
            .fn()
            .mockReturnValueOnce({ data: { issues: [{}, {}, {}] } })
            .mockReturnValueOnce({ data: { issues: [] } });
        const endpoint = '/issues';
        const paginationConfigOverride = {
            type: 'offset',
            limit_name_in_request: 'per_page',
            limit: 3,
            offset_name_in_request: 'offset',
            response_path: 'issues'
        };
        const generator = nangoAction.paginate({ endpoint, paginate: paginationConfigOverride });
        try {
            for (var generator_1 = __asyncValues(generator), generator_1_1; generator_1_1 = yield generator_1.next(), !generator_1_1.done;) {
                const batch = generator_1_1.value;
                expect(batch.length).toBe(3);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (generator_1_1 && !generator_1_1.done && (_a = generator_1.return)) yield _a.call(generator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        expect(nango.proxy).toHaveBeenLastCalledWith({
            method: 'GET',
            endpoint,
            headers: {
                'user-agent': expect.any(String)
            },
            params: { offset: '3', per_page: 3 },
            paginate: paginationConfigOverride,
            providerConfigKey,
            connectionId
        });
    }));
    it('Paginates using offset', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_2, _b;
        stubProviderTemplate(offsetPagination);
        const firstBatch = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const secondBatch = [{ id: 4 }, { id: 5 }, { id: 6 }];
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi
            .fn()
            .mockReturnValueOnce({ data: { issues: firstBatch } })
            .mockReturnValueOnce({ data: { issues: secondBatch } })
            .mockReturnValueOnce({ data: { issues: [] } });
        const endpoint = '/issues';
        const generator = nangoAction.paginate({ endpoint });
        const actualRecords = [];
        try {
            for (var generator_2 = __asyncValues(generator), generator_2_1; generator_2_1 = yield generator_2.next(), !generator_2_1.done;) {
                const batch = generator_2_1.value;
                actualRecords.push(...batch);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (generator_2_1 && !generator_2_1.done && (_b = generator_2.return)) yield _b.call(generator_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        const expectedRecords = [...firstBatch, ...secondBatch];
        expect(actualRecords).toStrictEqual(expectedRecords);
    }));
    it('Paginates using cursor', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_3, _c;
        stubProviderTemplate(cursorPagination);
        const firstBatch = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const secondBatch = [{ id: 4 }, { id: 5 }, { id: 6 }];
        const thirdBatch = [{ id: 7 }, { id: 8 }, { id: 9 }];
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi
            .fn()
            .mockReturnValueOnce({
            data: {
                issues: firstBatch,
                metadata: {
                    next_cursor: '2'
                }
            }
        })
            .mockReturnValueOnce({
            data: {
                issues: secondBatch,
                metadata: {
                    next_cursor: '2'
                }
            }
        })
            .mockReturnValueOnce({ data: { issues: thirdBatch } });
        const endpoint = '/issues';
        const generator = nangoAction.paginate({ endpoint });
        const actualRecords = [];
        try {
            for (var generator_3 = __asyncValues(generator), generator_3_1; generator_3_1 = yield generator_3.next(), !generator_3_1.done;) {
                const batch = generator_3_1.value;
                actualRecords.push(...batch);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (generator_3_1 && !generator_3_1.done && (_c = generator_3.return)) yield _c.call(generator_3);
            }
            finally { if (e_3) throw e_3.error; }
        }
        const expectedRecords = [...firstBatch, ...secondBatch, ...thirdBatch];
        expect(actualRecords).toStrictEqual(expectedRecords);
    }));
    it('Stops pagination if cursor is empty', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_4, _d;
        stubProviderTemplate(cursorPagination);
        const onlyBatch = [{ id: 1 }, { id: 2 }, { id: 3 }];
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi.fn().mockReturnValueOnce({
            data: {
                issues: onlyBatch,
                metadata: {
                    next_cursor: ''
                }
            }
        });
        const endpoint = '/issues';
        const generator = nangoAction.paginate({ endpoint });
        const actualRecords = [];
        try {
            for (var generator_4 = __asyncValues(generator), generator_4_1; generator_4_1 = yield generator_4.next(), !generator_4_1.done;) {
                const batch = generator_4_1.value;
                actualRecords.push(...batch);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (generator_4_1 && !generator_4_1.done && (_d = generator_4.return)) yield _d.call(generator_4);
            }
            finally { if (e_4) throw e_4.error; }
        }
        expect(actualRecords).toStrictEqual(onlyBatch);
    }));
    it.each(paginationConfigs)('Extracts records from nested body param for $type pagination type', (paginationConfig) => __awaiter(void 0, void 0, void 0, function* () {
        var e_5, _e;
        stubProviderTemplate(paginationConfig);
        const firstBatch = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const emptyBatch = [];
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi
            .fn()
            .mockReturnValueOnce({
            data: {
                issues: firstBatch,
                metadata: {
                    next_cursor: ''
                }
            }
        })
            .mockReturnValueOnce({
            data: {
                issues: emptyBatch,
                metadata: {
                    next_cursor: ''
                }
            }
        });
        const endpoint = '/issues';
        const generator = nangoAction.paginate({ endpoint });
        const actualRecords = [];
        try {
            for (var generator_5 = __asyncValues(generator), generator_5_1; generator_5_1 = yield generator_5.next(), !generator_5_1.done;) {
                const batch = generator_5_1.value;
                actualRecords.push(...batch);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (generator_5_1 && !generator_5_1.done && (_e = generator_5.return)) yield _e.call(generator_5);
            }
            finally { if (e_5) throw e_5.error; }
        }
        expect(actualRecords).toStrictEqual(firstBatch);
    }));
    it.each([
        // TODO: validate proper config is passed to proxy
        ['https://api.gihub.com/issues?page=2', 'https://api.gihub.com/issues?page=3'],
        ['/issues?page=2', '/issues?page=3']
    ])('Paginates using next URL/path %s from body', (nextUrlOrPathValue, anotherNextUrlOrPathValue) => __awaiter(void 0, void 0, void 0, function* () {
        var e_6, _f;
        stubProviderTemplate(linkPagination);
        const firstBatch = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const secondBatch = [{ id: 4 }, { id: 5 }, { id: 6 }];
        const thirdBatch = [{ id: 7 }, { id: 8 }, { id: 9 }];
        (yield import('@nangohq/node')).Nango.prototype.proxy = vi
            .fn()
            .mockReturnValueOnce({
            data: {
                issues: firstBatch,
                metadata: {
                    next_cursor: nextUrlOrPathValue
                }
            }
        })
            .mockReturnValueOnce({
            data: {
                issues: secondBatch,
                metadata: {
                    next_cursor: anotherNextUrlOrPathValue
                }
            }
        })
            .mockReturnValueOnce({ data: { issues: thirdBatch } });
        const endpoint = '/issues';
        const generator = nangoAction.paginate({ endpoint });
        const actualRecords = [];
        try {
            for (var generator_6 = __asyncValues(generator), generator_6_1; generator_6_1 = yield generator_6.next(), !generator_6_1.done;) {
                const batch = generator_6_1.value;
                actualRecords.push(...batch);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (generator_6_1 && !generator_6_1.done && (_f = generator_6.return)) yield _f.call(generator_6);
            }
            finally { if (e_6) throw e_6.error; }
        }
        const expectedRecords = [...firstBatch, ...secondBatch, ...thirdBatch];
        let expectedEndpoint;
        if (isValidHttpUrl(anotherNextUrlOrPathValue)) {
            const url = new URL(anotherNextUrlOrPathValue);
            expectedEndpoint = url.pathname + url.search;
        }
        else {
            expectedEndpoint = anotherNextUrlOrPathValue;
        }
        expect(actualRecords).toStrictEqual(expectedRecords);
        expect(nango.proxy).toHaveBeenCalledWith(expect.objectContaining({
            endpoint: expectedEndpoint
        }));
    }));
    const stubProviderTemplate = (paginationConfig) => {
        const template = buildTemplate(paginationConfig);
        vi.spyOn(configService, 'getTemplate').mockImplementation(() => template);
    };
    const buildTemplate = (paginationConfig) => {
        return {
            auth_mode: 'OAUTH2',
            proxy: { base_url: 'https://api.github.com/', paginate: paginationConfig },
            authorization_url: '',
            token_url: ''
        };
    };
});
describe('Log', () => {
    it('should enforce activityLogId when not in dryRun', () => {
        expect(() => {
            new NangoAction(Object.assign(Object.assign({}, nangoProps), { activityLogId: undefined }));
        }).toThrowError(new Error('Parameter activityLogId is required when not in dryRun'));
    });
    it('should not fail on null', () => __awaiter(void 0, void 0, void 0, function* () {
        const nangoAction = new NangoAction(Object.assign(Object.assign({}, nangoProps), { dryRun: true }));
        yield nangoAction.log(null);
    }));
    it('should allow level', () => __awaiter(void 0, void 0, void 0, function* () {
        const mock = vi.fn(() => ({ response: { status: 200 } }));
        const nangoAction = new NangoAction(Object.assign({}, nangoProps), { persistApi: mock });
        yield nangoAction.log('hello', { level: 'error' });
        expect(mock).toHaveBeenCalledWith({
            data: {
                activityLogId: 1,
                level: 'error',
                msg: 'hello',
                timestamp: expect.any(Number)
            },
            headers: {
                Authorization: 'Bearer ***'
            },
            method: 'POST',
            url: '/environment/1/log'
        });
    }));
    it('should enforce type: log message + object + level', () => __awaiter(void 0, void 0, void 0, function* () {
        const nangoAction = new NangoAction(Object.assign(Object.assign({}, nangoProps), { dryRun: true }));
        // @ts-expect-error Level is wrong on purpose, if it's not breaking anymore the type is broken
        yield nangoAction.log('hello', { foo: 'bar' }, { level: 'foobar' });
    }));
    it('should enforce type: log message +level', () => __awaiter(void 0, void 0, void 0, function* () {
        const nangoAction = new NangoAction(Object.assign(Object.assign({}, nangoProps), { dryRun: true }));
        // @ts-expect-error Level is wrong on purpose, if it's not breaking anymore the type is broken
        yield nangoAction.log('hello', { level: 'foobar' });
    }));
    it('should enforce type: log message + object', () => __awaiter(void 0, void 0, void 0, function* () {
        const nangoAction = new NangoAction(Object.assign(Object.assign({}, nangoProps), { dryRun: true }));
        yield nangoAction.log('hello', { foo: 'bar' });
    }));
});
//# sourceMappingURL=sync.unit.test.js.map