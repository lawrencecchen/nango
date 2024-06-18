var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import './tracer.js';
import './utils/loadEnv.js';
import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'node:http';
import db from '@nangohq/database';
import { NANGO_VERSION, getGlobalOAuthCallbackUrl, getServerPort, getWebsocketsPath } from '@nangohq/shared';
import { getLogger } from '@nangohq/utils';
import { migrate as migrateRecords } from '@nangohq/records';
import { start as migrateLogs } from '@nangohq/logs';
import oAuthSessionService from './services/oauth-session.service.js';
import migrate from './utils/migrate.js';
import publisher from './clients/publisher.client.js';
import { router } from './routes.js';
import { refreshTokens } from './refreshTokens.js';
const { NANGO_MIGRATE_AT_START = 'true' } = process.env;
const logger = getLogger('Server');
const app = express();
app.use('/', router);
const server = http.createServer(app);
// -------
// Websocket
const wss = new WebSocketServer({ server, path: getWebsocketsPath() });
wss.on('connection', (ws) => __awaiter(void 0, void 0, void 0, function* () {
    yield publisher.subscribe(ws);
}));
db.enableMetrics();
// Set to 'false' to disable migration at startup. Appropriate when you
// have multiple replicas of the service running and you do not want them
// all trying to migrate the database at the same time. In this case, the
// operator should run migrate.ts once before starting the service.
if (NANGO_MIGRATE_AT_START === 'true') {
    await migrate();
    await migrateLogs();
    await migrateRecords();
}
else {
    logger.info('Not migrating database');
}
await oAuthSessionService.clearStaleSessions();
refreshTokens();
const port = getServerPort();
server.listen(port, () => {
    logger.info(`✅ Nango Server with version ${NANGO_VERSION} is listening on port ${port}. OAuth callback URL: ${getGlobalOAuthCallbackUrl()}`);
    logger.info(`\n   |     |     |     |     |     |     |\n   |     |     |     |     |     |     |\n   |     |     |     |     |     |     |  \n \\ | / \\ | / \\ | / \\ | / \\ | / \\ | / \\ | /\n  \\|/   \\|/   \\|/   \\|/   \\|/   \\|/   \\|/\n------------------------------------------\nLaunch Nango at http://localhost:${port}\n------------------------------------------\n  /|\\   /|\\   /|\\   /|\\   /|\\   /|\\   /|\\\n / | \\ / | \\ / | \\ / | \\ / | \\ / | \\ / | \\\n   |     |     |     |     |     |     |\n   |     |     |     |     |     |     |\n   |     |     |     |     |     |     |`);
});
//# sourceMappingURL=server.js.map