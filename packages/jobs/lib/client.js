import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
export function getJobsClient(url) {
    return createTRPCProxyClient({
        transformer: superjson,
        links: [httpBatchLink({ url })]
    });
}
//# sourceMappingURL=client.js.map