var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as cron from 'node-cron';
import db from '@nangohq/database';
import { errorManager, ErrorSourceEnum, connectionService } from '@nangohq/shared';
import { stringifyError, getLogger, metrics, stringToHash } from '@nangohq/utils';
import { logContextGetter } from '@nangohq/logs';
import tracer from 'dd-trace';
import { connectionRefreshFailed as connectionRefreshFailedHook, connectionRefreshSuccess as connectionRefreshSuccessHook } from './hooks/hooks.js';
const logger = getLogger('Server');
const cronName = '[refreshTokens]';
export function refreshTokens() {
    cron.schedule('*/10 * * * *', () => __awaiter(this, void 0, void 0, function* () {
        (() => __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            try {
                yield exec();
            }
            catch (err) {
                const e = new Error('failed_to_refresh_tokens', {
                    cause: err instanceof Error ? err.message : String(err)
                });
                errorManager.report(e, { source: ErrorSourceEnum.PLATFORM }, tracer);
            }
            finally {
                metrics.duration(metrics.Types.REFRESH_TOKENS, Date.now() - start);
            }
        }))().catch((error) => {
            logger.error('Failed to execute refreshTokens cron job');
            logger.error(error);
        });
    }));
}
export function exec() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info(`${cronName} starting`);
        const lockKey = stringToHash(cronName);
        // Lock to prevent multiple instances of this cron job from running at the same time
        yield db.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { rows } = yield trx.raw(`SELECT pg_try_advisory_xact_lock(?);`, [lockKey]);
            if (!((_a = rows === null || rows === void 0 ? void 0 : rows[0]) === null || _a === void 0 ? void 0 : _a.pg_try_advisory_xact_lock)) {
                logger.info(`${cronName} could not acquire lock, skipping`);
                return;
            }
            const staleConnections = yield connectionService.getOldConnections({ days: 1, limit: 500 });
            logger.info(`${cronName} found ${staleConnections.length} stale connections`);
            for (const staleConnection of staleConnections) {
                const { connection_id, environment, provider_config_key, account } = staleConnection;
                logger.info(`${cronName} refreshing token for connectionId: ${connection_id}, accountId: ${account.id}`);
                try {
                    const credentialResponse = yield connectionService.getConnectionCredentials({
                        account,
                        environment,
                        connectionId: connection_id,
                        providerConfigKey: provider_config_key,
                        logContextGetter,
                        instantRefresh: false,
                        onRefreshSuccess: connectionRefreshSuccessHook,
                        onRefreshFailed: connectionRefreshFailedHook
                    });
                    if (credentialResponse.isOk()) {
                        metrics.increment(metrics.Types.REFRESH_TOKENS_SUCCESS);
                    }
                    else {
                        metrics.increment(metrics.Types.REFRESH_TOKENS_FAILED);
                    }
                }
                catch (err) {
                    logger.error(`${cronName} failed to refresh token for connectionId: ${connection_id} ${stringifyError(err)}`);
                    metrics.increment(metrics.Types.REFRESH_TOKENS_FAILED);
                }
            }
        }));
        logger.info(`${cronName} ✅ done`);
    });
}
//# sourceMappingURL=refreshTokens.js.map