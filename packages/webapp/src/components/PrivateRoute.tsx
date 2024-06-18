import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useMeta } from '../hooks/useMeta';
import { useStore } from '../store';
import { useAnalyticsIdentify } from '../utils/analytics';
import { useUser } from '../hooks/useUser';
import PageNotFound from '../pages/PageNotFound';

export const PrivateRoute: React.FC = () => {
    const { meta, error, loading } = useMeta();
    const [notFoundEnv, setNotFoundEnv] = useState(false);
    const [ready, setReady] = useState(false);
    const { user } = useUser(Boolean(meta && ready && !notFoundEnv));
    const identify = useAnalyticsIdentify();

    const env = useStore((state) => state.env);
    const setStoredEnvs = useStore((state) => state.setEnvs);
    const setBaseUrl = useStore((state) => state.setBaseUrl);
    const setEmail = useStore((state) => state.setEmail);
    const setDebugMode = useStore((state) => state.setDebugMode);
    const setEnv = useStore((state) => state.setEnv);

    useEffect(() => {
        if (!meta || error) {
            return;
        }

        setStoredEnvs(meta.environments);
        setBaseUrl(meta.baseUrl);
        setEmail(meta.email);
        setDebugMode(meta.debugMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meta, error]);

    useEffect(() => {
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
            } else {
                // Otherwise we pick the first one available
                setEnv(meta.environments[0].name);
            }

            setNotFoundEnv(true);
        } else {
            setEnv(currentEnv);
        }

        // it's ready when datastore and path are finally reconciliated
        setReady(true);
    }, [meta, loading, env, error, setEnv]);

    useEffect(() => {
        if (user) {
            identify(user);
        }
    }, [user, identify]);

    if (loading || !ready) {
        return null;
    }

    if (notFoundEnv) {
        return <PageNotFound />;
    }
    if (error) {
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
};
