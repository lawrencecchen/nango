import type { CreateTRPCProxyClient } from '@trpc/client';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from './server.js';

export function getJobsClient(url: string): CreateTRPCProxyClient<AppRouter> {
    return createTRPCProxyClient<AppRouter>({
        transformer: superjson,
        links: [httpBatchLink({ url })]
    });
}
