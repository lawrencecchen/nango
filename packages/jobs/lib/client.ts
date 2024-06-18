import type { CreateTRPCProxyClient } from '@trpc/client';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server.js.js';
import superjson from 'superjson';

export function getJobsClient(url: string): CreateTRPCProxyClient<AppRouter> {
    return createTRPCProxyClient<AppRouter>({
        transformer: superjson,
        links: [httpBatchLink({ url })]
    });
}
