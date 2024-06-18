"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateRoute = void 0;
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const useMeta_1 = require("../hooks/useMeta");
const store_1 = require("../store");
const analytics_1 = require("../utils/analytics");
const useUser_1 = require("../hooks/useUser");
const PageNotFound_1 = __importDefault(require("../pages/PageNotFound"));
const PrivateRoute = () => {
    const { meta, error, loading } = (0, useMeta_1.useMeta)();
    const [notFoundEnv, setNotFoundEnv] = (0, react_1.useState)(false);
    const [ready, setReady] = (0, react_1.useState)(false);
    const { user } = (0, useUser_1.useUser)(Boolean(meta && ready && !notFoundEnv));
    const identify = (0, analytics_1.useAnalyticsIdentify)();
    const env = (0, store_1.useStore)((state) => state.env);
    const setStoredEnvs = (0, store_1.useStore)((state) => state.setEnvs);
    const setBaseUrl = (0, store_1.useStore)((state) => state.setBaseUrl);
    const setEmail = (0, store_1.useStore)((state) => state.setEmail);
    const setDebugMode = (0, store_1.useStore)((state) => state.setDebugMode);
    const setEnv = (0, store_1.useStore)((state) => state.setEnv);
    (0, react_1.useEffect)(() => {
        if (!meta || error) {
            return;
        }
        setStoredEnvs(meta.environments);
        setBaseUrl(meta.baseUrl);
        setEmail(meta.email);
        setDebugMode(meta.debugMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meta, error]);
    (0, react_1.useEffect)(() => {
        if (!meta || error) {
            return;
        }
        let currentEnv = env;
        // sync path with datastore
        const pathSplit = location.pathname.split('/');
        if (pathSplit.length > 0 && env !== pathSplit[1]) {
            currentEnv = pathSplit[1];
        }
        // The store set does not match available envs
        if (!meta.environments.find(({ name }) => name === currentEnv)) {
            if (currentEnv !== 'dev' && meta.environments.find(({ name }) => name === 'dev')) {
                // If the specified env is not dev and it's available we set the store value so the back home button works
                // because of self hosting we can't assume dev is always there
                setEnv('dev');
            }
            else {
                // Otherwise we pick the first one available
                setEnv(meta.environments[0].name);
            }
            setNotFoundEnv(true);
        }
        else {
            setEnv(currentEnv);
        }
        // it's ready when datastore and path are finally reconciliated
        setReady(true);
    }, [meta, loading, env, error, setEnv]);
    (0, react_1.useEffect)(() => {
        if (user) {
            identify(user);
        }
    }, [user, identify]);
    if (loading || !ready) {
        return null;
    }
    if (notFoundEnv) {
        return <PageNotFound_1.default />;
    }
    if (error) {
        return <react_router_dom_1.Navigate to="/signin" replace/>;
    }
    return <react_router_dom_1.Outlet />;
};
exports.PrivateRoute = PrivateRoute;
//# sourceMappingURL=PrivateRoute.js.map