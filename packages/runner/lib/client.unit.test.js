var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll } from 'vitest';
import { getRunnerClient } from './client.js';
import { server } from './server.js';
describe('Runner client', () => {
    const port = 3095;
    const serverUrl = `http://localhost:${port}`;
    let client;
    beforeAll(() => {
        client = getRunnerClient(serverUrl);
        server.listen(port);
    });
    it('should get server health', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield client.health.query();
        expect(result).toEqual({ status: 'ok' });
    }));
    it('should run code', () => __awaiter(void 0, void 0, void 0, function* () {
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
        yield expect(run).resolves.toEqual([1, 2, 3]);
    }));
});
//# sourceMappingURL=client.unit.test.js.map