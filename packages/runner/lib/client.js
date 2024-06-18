import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { fetch, Agent } from 'undici';
export function getRunnerClient(url) {
    return createTRPCProxyClient({
        transformer: superjson,
        links: [
            httpBatchLink({
                url,
                // @ts-expect-error type discrepancy between undici and node and trpc
                fetch(url, options) {
                    return fetch(url, Object.assign(Object.assign({}, options), { dispatcher: new Agent({
                            headersTimeout: 0,
                            connectTimeout: 0,
                            bodyTimeout: 0
                        }) }));
                }
            })
        ]
    });
}
//# sourceMappingURL=client.js.map