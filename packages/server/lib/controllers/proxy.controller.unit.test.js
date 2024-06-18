import { expect, describe, it } from 'vitest';
import { parseHeaders } from './proxy.controller.js';
describe('Proxy Controller Construct URL Tests', () => {
    it('Should parse headers that starts with Nango-Proxy or nango-proxy', () => {
        const req = {
            rawHeaders: ['Nango-Proxy-Test-Header', 'TestValue', 'nango-proxy-another-header', 'AnotherValue', 'Irrelevant-Header', 'IrrelevantValue']
        };
        const parsedHeaders = parseHeaders(req);
        expect(parsedHeaders).toEqual({
            'Test-Header': 'TestValue',
            'another-header': 'AnotherValue'
        });
    });
    it('Should return an empty object when there are no Nango-Proxy or nango-proxy headers', () => {
        const req = {
            rawHeaders: ['Irrelevant-Header-One', 'IrrelevantValueOne', 'Irrelevant-Header-Two', 'IrrelevantValueTwo']
        };
        const parsedHeaders = parseHeaders(req);
        expect(parsedHeaders).toEqual({});
    });
    it('Should handle the case when rawHeaders is not an array or empty', () => {
        const req = {};
        const parsedHeaders = parseHeaders(req);
        expect(parsedHeaders).toEqual({});
    });
});
//# sourceMappingURL=proxy.controller.unit.test.js.map