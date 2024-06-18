import type { CreateTRPCProxyClient } from '@trpc/client';

import type { AppRouter } from './server.js';
export declare type ProxyAppRouter = CreateTRPCProxyClient<AppRouter>;
export declare function getRunnerClient(url: string): ProxyAppRouter;
