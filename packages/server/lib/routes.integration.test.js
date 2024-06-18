var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { migrateLogsMapping } from '@nangohq/logs';
import { seeders } from '@nangohq/shared';
import { multipleMigrations } from '@nangohq/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runServer } from './utils/tests.js';
let api;
describe('GET /logs', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        yield migrateLogsMapping();
        api = yield runServer();
    }));
    afterAll(() => {
        api.server.close();
    });
    it('should handle invalid json', () => __awaiter(void 0, void 0, void 0, function* () {
        const { env } = yield seeders.seedAccountEnvAndUser();
        const res = yield fetch(`${api.url}/api/v1/environment/callback`, {
            method: 'POST',
            body: 'undefined',
            headers: { Authorization: `Bearer ${env.secret_key}`, 'content-type': 'application/json' }
        });
        expect(yield res.json()).toStrictEqual({
            error: {
                code: 'invalid_json',
                message: expect.any(String) // unfortunately the message is different depending on the platform
            }
        });
    }));
});
//# sourceMappingURL=routes.integration.test.js.map