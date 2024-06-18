var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { inspect } from 'node:util';
import { createServer } from 'node:http';
import express from 'express';
import { expect } from 'vitest';
import getPort from 'get-port';
import { router } from '../routes.js';
function uriParamsReplacer(tpl, data) {
    let res = tpl;
    for (const [key, value] of Object.entries(data)) {
        res = res.replace(`:${key}`, value);
    }
    return res;
}
/**
 * Type safe API fetch
 */
export function apiFetch(baseUrl) {
    return function apiFetch(path, { method, query, token, body, params }) {
        return __awaiter(this, void 0, void 0, function* () {
            const search = new URLSearchParams(query);
            const url = new URL(`${baseUrl}${path}?${search.toString()}`);
            const headers = new Headers();
            if (token) {
                headers.append('Authorization', `Bearer ${token}`);
            }
            if (body) {
                headers.append('content-type', 'application/json');
            }
            const res = yield fetch(params ? uriParamsReplacer(url.href, params) : url, {
                method: method || 'GET',
                headers,
                body: body ? JSON.stringify(body) : null
            });
            let json = null;
            if (res.status !== 204) {
                json = yield res.json();
            }
            return { res, json: json || {} };
        });
    };
}
/**
 * Assert API response is an error
 */
export function isError(json) {
    if (!('error' in json)) {
        console.log('isError', inspect(json, true, 100));
        throw new Error('Response is not an error');
    }
}
/**
 * Assert API response is a success
 */
export function isSuccess(json) {
    if (json && 'error' in json) {
        console.log('isSuccess', inspect(json, true, 100));
        throw new Error('Response is not a success');
    }
}
/**
 * Check if an endpoint is protected by some auth
 */
export function shouldBeProtected({ res, json }) {
    isError(json);
    expect(json).toStrictEqual({
        error: { message: 'Authentication failed. The request is missing the Authorization header.', payload: {}, code: 'missing_auth_header' }
    });
    expect(res.status).toBe(401);
}
/**
 * Check if an endpoint requires the query params to be set
 */
export function shouldRequireQueryEnv({ res, json }) {
    isError(json);
    expect(json).toStrictEqual({
        error: {
            code: 'invalid_query_params',
            errors: [{ code: 'invalid_type', message: 'Required', path: ['env'] }]
        }
    });
    expect(res.status).toBe(400);
}
/**
 * Run the API in the test
 */
export function runServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = createServer(express().use(router));
        const port = yield getPort();
        return new Promise((resolve) => {
            server.listen(port, () => {
                const url = `http://localhost:${port}`;
                resolve({ server, url, fetch: apiFetch(url) });
            });
        });
    });
}
//# sourceMappingURL=tests.js.map