var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const createRoute = (server, rh) => {
    const safeHandler = (req, res, next) => Promise.resolve(rh.handler(req, res, next)).catch((error) => next(error));
    if (rh.method === 'GET') {
        server.get(rh.path, rh.validate, safeHandler);
    }
    else if (rh.method === 'POST') {
        server.post(rh.path, rh.validate, safeHandler);
    }
    else if (rh.method === 'PATCH') {
        server.patch(rh.path, rh.validate, safeHandler);
    }
    else if (rh.method === 'PUT') {
        server.put(rh.path, rh.validate, safeHandler);
    }
    else if (rh.method === 'DELETE') {
        server.delete(rh.path, rh.validate, safeHandler);
    }
};
export const routeFetch = (baseUrl, route, config) => {
    return function f({ query, body, params }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const search = query ? `?${new URLSearchParams(query)}` : '';
            let path = route.path;
            if (params) {
                for (const [key, value] of Object.entries(params)) {
                    path = path.replace(`:${key}`, value);
                }
            }
            AbortSignal.timeout = function timeout(ms) {
                const ctrl = new AbortController();
                setTimeout(() => ctrl.abort(), ms);
                return ctrl.signal;
            };
            const url = `${baseUrl}${path}${search.toString()}`;
            try {
                const headers = body ? { 'content-type': 'application/json' } : {};
                const res = yield fetch(url, {
                    method: route.method,
                    headers,
                    body: body ? JSON.stringify(body) : null,
                    signal: AbortSignal.timeout((config === null || config === void 0 ? void 0 : config.timeoutMs) || 120000)
                });
                let json = {};
                if ((_a = res.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('application/json')) {
                    json = (yield res.json());
                }
                if (res.status >= 400) {
                    return { error: { code: 'fetch_failed', message: `${route.method} ${url} failed with status code ${res.status}: ${JSON.stringify(json)}` } };
                }
                return json;
            }
            catch (error) {
                return { error: { code: 'fetch_failed', message: `${route.method} ${url} failed: ${error}` } };
            }
        });
    };
};
//# sourceMappingURL=route.js.map