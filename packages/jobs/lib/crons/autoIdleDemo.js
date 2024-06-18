var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { schedule } from 'node-cron';
import { CommandToActivityLog, ErrorSourceEnum, SyncCommand, createActivityLog, createActivityLogMessageAndEnd, errorManager, updateSuccess as updateSuccessActivityLog, updateScheduleStatus, findPausableDemoSyncs, SpanTypes, getOrchestratorUrl, Orchestrator } from '@nangohq/shared';
import { getLogger } from '@nangohq/utils';
import tracer from 'dd-trace';
import { logContextGetter } from '@nangohq/logs';
import { records as recordsService } from '@nangohq/records';
import { OrchestratorClient } from '@nangohq/nango-orchestrator';
const logger = getLogger('Jobs');
const orchestrator = new Orchestrator(new OrchestratorClient({ baseUrl: getOrchestratorUrl() }));
export function cronAutoIdleDemo() {
    schedule('1 * * * *', () => {
        const span = tracer.startSpan(SpanTypes.JOBS_IDLE_DEMO);
        tracer.scope().activate(span, () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield exec();
            }
            catch (err) {
                const e = new Error('failed_to_auto_idle_demo', { cause: err instanceof Error ? err.message : err });
                errorManager.report(e, { source: ErrorSourceEnum.PLATFORM }, tracer);
            }
            span.finish();
        }));
    });
}
export function exec() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info('[autoidle] starting');
        const syncs = yield findPausableDemoSyncs();
        logger.info(`[autoidle] found ${syncs.length} syncs`);
        const action = CommandToActivityLog['PAUSE'];
        for (const sync of syncs) {
            const activityLogId = yield createActivityLog({
                level: 'info',
                success: false,
                action,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: String(sync.connection_id),
                provider: sync.provider,
                provider_config_key: sync.unique_key,
                environment_id: sync.environment_id,
                operation_name: sync.name
            });
            if (!activityLogId) {
                continue;
            }
            const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'sync', action: 'pause' }, message: 'Sync' }, {
                account: { id: sync.account_id, name: sync.account_name },
                environment: { id: sync.environment_id, name: sync.environment_name },
                integration: { id: sync.config_id, name: sync.provider_unique_key, provider: sync.provider },
                connection: { id: sync.connection_unique_id, name: sync.connection_id },
                syncConfig: { id: sync.sync_config_id, name: sync.name }
            });
            logger.info(`[autoidle] pausing ${sync.id}`);
            const res = yield orchestrator.runSyncCommandHelper({
                scheduleId: sync.schedule_id,
                syncId: sync.id,
                command: SyncCommand.PAUSE,
                activityLogId: activityLogId,
                environmentId: sync.environment_id,
                providerConfigKey: sync.unique_key,
                connectionId: sync.connection_id,
                syncName: sync.name,
                logCtx,
                recordsService,
                initiator: 'auto_idle_demo'
            });
            if (res.isErr()) {
                yield logCtx.failed();
                continue;
            }
            const resDb = yield updateScheduleStatus(sync.schedule_id, SyncCommand.PAUSE, activityLogId, sync.environment_id, logCtx);
            if (resDb.isErr()) {
                yield logCtx.failed();
                continue;
            }
            yield createActivityLogMessageAndEnd({
                level: 'info',
                environment_id: sync.environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `Demo sync was automatically paused after being idle for a day`
            });
            yield updateSuccessActivityLog(activityLogId, true);
            yield logCtx.info('Demo sync was automatically paused after being idle for a day');
            yield logCtx.success();
        }
        logger.info(`[autoidle] done`);
    });
}
//# sourceMappingURL=autoIdleDemo.js.map