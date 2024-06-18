import type { CreateTRPCProxyClient } from '@trpc/client';

import type { AppRouter } from './server.js';
export declare function getJobsClient(url: string): CreateTRPCProxyClient<AppRouter>;
