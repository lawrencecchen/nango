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
    return async function f({ query, body, params }) {
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
            const res = await fetch(url, {
                method: route.method,
                headers,
                body: body ? JSON.stringify(body) : null,
                signal: AbortSignal.timeout(config?.timeoutMs || 120000)
            });
            let json = {};
            if (res.headers.get('content-type')?.includes('application/json')) {
                json = (await res.json());
            }
            if (res.status >= 400) {
                return { error: { code: 'fetch_failed', message: `${route.method} ${url} failed with status code ${res.status}: ${JSON.stringify(json)}` } };
            }
            return json;
        }
        catch (error) {
            return { error: { code: 'fetch_failed', message: `${route.method} ${url} failed: ${error}` } };
        }
    };
};
//# sourceMappingURL=route.js.map