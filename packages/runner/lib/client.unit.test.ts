import { expect, describe, it, beforeAll } from 'vitest';
import { getRunnerClient } from './client.js.js';
import { server } from './server.js.js';

describe('Runner client', () => {
    const port = 3095;
    const serverUrl = `http://localhost:${port}`;
    let client: ReturnType<typeof getRunnerClient>;

    beforeAll(() => {
        client = getRunnerClient(serverUrl);
        server.listen(port);
    });

    it('should get server health', async () => {
        const result = await client.health.query();
        expect(result).toEqual({ status: 'ok' });
    });

    it('should run code', async () => {
        const nangoProps = {
            host: 'http://localhost:3003',
            connectionId: 'connection-id',
            environmentId: 1,
            providerConfigKey: 'provider-config-key',
            activityLogId: 1,
            secretKey: 'secret-key',
            nangoConnectionId: 1,
            syncId: 'sync-id',
            syncJobId: 1,
            lastSyncDate: new Date(),
            dryRun: true,
            attributes: {},
            track_deletes: false,
            logMessages: {
                counts: { updated: 0, added: 0, deleted: 0 },
                messages: []
            },

            stubbedMetadata: {}
        };
        const jsCode = `
        f = async (nango) => {
            const s = nango.lastSyncDate.toISOString();
            const b = Buffer.from("hello world");
            const t = await Promise.resolve(setTimeout(() => {}, 5));
            return [1, 2, 3]
        };
        exports.default = f
        `;
        const isInvokedImmediately = false;
        const isWebhook = false;

        const run = client.run.mutate({ nangoProps, isInvokedImmediately, isWebhook, code: jsCode });
        await expect(run).resolves.toEqual([1, 2, 3]);
    });
});
