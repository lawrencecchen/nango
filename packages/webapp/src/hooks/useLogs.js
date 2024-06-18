"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchFilters = exports.useSearchMessages = exports.useGetOperation = exports.useSearchOperations = void 0;
const react_1 = require("react");
const swr_1 = __importDefault(require("swr"));
const api_1 = require("../utils/api");
const logs_1 = require("../utils/logs");
function useSearchOperations(env, body, isLive) {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [data, setData] = (0, react_1.useState)();
    const [error, setError] = (0, react_1.useState)();
    const signal = (0, react_1.useRef)();
    function manualFetch(cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (signal.current && !signal.current.signal.aborted) {
                signal.current.abort();
            }
            setLoading(true);
            signal.current = new AbortController();
            try {
                let period = body.period;
                // Slide the window automatically when live
                // We do it only at query time so the URL stays shareable (datadog style)
                if (isLive && period) {
                    const tmp = (0, logs_1.slidePeriod)(period);
                    period = { from: tmp.from.toISOString(), to: tmp.to.toISOString() };
                }
                const res = yield (0, api_1.apiFetch)(`/api/v1/logs/operations?env=${env}`, {
                    method: 'POST',
                    body: JSON.stringify(Object.assign(Object.assign({}, body), { period, cursor })),
                    signal: signal.current.signal
                });
                if (res.status !== 200) {
                    return { error: (yield res.json()) };
                }
                return { res: (yield res.json()) };
            }
            catch (err) {
                if (err instanceof DOMException && err.ABORT_ERR) {
                    return;
                }
                return { error: err };
            }
            finally {
                setLoading(false);
            }
        });
    }
    function fetchData(cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            const man = yield manualFetch(cursor);
            if (!man) {
                return;
            }
            if (man.error) {
                setData(undefined);
                setError(typeof man.error === 'string' || man.error instanceof Error ? { error: { message: man.error } } : man.error);
                return;
            }
            setError(undefined);
            setData(man.res);
        });
    }
    // We trigger manually to control live refresh, infinite scroll
    // useEffect(() => {
    //     if (enabled && !loading) {
    //         void fetchData();
    //     }
    // }, [enabled, env, body.limit, body.states, body.integrations, body.period, body.types, body.connections, body.syncs]);
    function trigger(cursor) {
        if (!loading) {
            void fetchData(cursor);
        }
    }
    return { data, error, loading, trigger, manualFetch };
}
exports.useSearchOperations = useSearchOperations;
function useGetOperation(env, params) {
    const { data, error, mutate } = (0, swr_1.default)(`/api/v1/logs/operations/${params.operationId}?env=${env}`, api_1.swrFetcher);
    const loading = !data && !error;
    function trigger() {
        if (!loading) {
            void mutate();
        }
    }
    return {
        loading,
        error,
        operation: data === null || data === void 0 ? void 0 : data.data,
        trigger
    };
}
exports.useGetOperation = useGetOperation;
function useSearchMessages(env, body) {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [data, setData] = (0, react_1.useState)();
    const [error, setError] = (0, react_1.useState)();
    const signal = (0, react_1.useRef)();
    function manualFetch(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (signal.current && !signal.current.signal.aborted) {
                signal.current.abort();
            }
            setLoading(true);
            signal.current = new AbortController();
            try {
                const res = yield (0, api_1.apiFetch)(`/api/v1/logs/messages?env=${env}`, {
                    method: 'POST',
                    body: JSON.stringify(Object.assign(Object.assign({}, body), opts)),
                    signal: signal.current.signal
                });
                if (res.status !== 200) {
                    return { error: (yield res.json()) };
                }
                return { res: (yield res.json()) };
            }
            catch (err) {
                if (err instanceof DOMException && err.ABORT_ERR) {
                    return;
                }
                return { error: err };
            }
            finally {
                setLoading(false);
            }
        });
    }
    function fetchData(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const man = yield manualFetch(opts);
            if (!man) {
                return;
            }
            if (man.error) {
                setData(undefined);
                setError(man.error);
                return;
            }
            setError(undefined);
            setData(man.res);
        });
    }
    function trigger(opts) {
        if (!loading) {
            void fetchData(opts);
        }
    }
    return { data, error, loading, trigger, manualFetch };
}
exports.useSearchMessages = useSearchMessages;
function useSearchFilters(enabled, env, body) {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [data, setData] = (0, react_1.useState)();
    const [error, setError] = (0, react_1.useState)();
    function fetchData() {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            try {
                const res = yield (0, api_1.apiFetch)(`/api/v1/logs/filters?env=${env}`, {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                if (res.status !== 200) {
                    setData(undefined);
                    setError((yield res.json()));
                    return;
                }
                setError(undefined);
                setData((yield res.json()));
            }
            catch (err) {
                setData(undefined);
                setError(err);
            }
            finally {
                setLoading(false);
            }
        });
    }
    (0, react_1.useEffect)(() => {
        if (enabled && !loading) {
            void fetchData();
        }
    }, [env, enabled, body.category, body.search]);
    function trigger() {
        if (enabled && !loading) {
            void fetchData();
        }
    }
    return { data, error, loading, trigger };
}
exports.useSearchFilters = useSearchFilters;
//# sourceMappingURL=useLogs.js.map