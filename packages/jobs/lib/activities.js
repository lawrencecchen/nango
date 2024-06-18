var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Context, CancelledFailure } from '@temporalio/activity';
import { TimeoutFailure, TerminatedFailure } from '@temporalio/client';
import { createSyncJob, SyncStatus, SyncType, configService, createActivityLog, LogActionEnum, syncRunService, environmentService, createActivityLogMessage, createActivityLogAndLogMessage, ErrorSourceEnum, errorManager, telemetry, updateSyncJobStatus, updateLatestJobSyncStatus, LogTypes, isInitialSyncStillRunning, getSyncByIdAndName, getLastSyncDate, getSyncConfigRaw, featureFlags } from '@nangohq/shared';
import { records as recordsService } from '@nangohq/records';
import { getLogger, stringifyError, errorToObject } from '@nangohq/utils';
import { logContextGetter } from '@nangohq/logs';
import { sendSync } from '@nangohq/webhooks';
import integrationService from './integration.service.js';
import { bigQueryClient, slackService } from './clients.js';
const logger = getLogger('Jobs');
export function routeSync(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { syncId, syncJobId, syncName, nangoConnection, debug } = args;
        let environmentId = nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id;
        const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
        const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${environmentId}`, false);
        const isOrchestrator = isGloballyEnabled || isEnvEnabled;
        if (isOrchestrator) {
            return true;
        }
        // https://typescript.temporal.io/api/classes/activity.Context
        const context = Context.current();
        if (!(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id)) {
            environmentId = (yield environmentService.getEnvironmentIdForAccountAssumingProd(nangoConnection.account_id));
        }
        const providerConfig = (yield configService.getProviderConfig(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key, environmentId));
        const syncConfig = (yield getSyncConfigRaw({
            environmentId: providerConfig.environment_id,
            config_id: providerConfig.id,
            name: syncName,
            isAction: false
        }));
        return syncProvider({
            providerConfig,
            syncConfig,
            syncId: syncId,
            syncJobId: syncJobId,
            syncName,
            syncType: SyncType.INITIAL,
            nangoConnection: Object.assign(Object.assign({}, nangoConnection), { environment_id: environmentId }),
            temporalContext: context,
            debug: debug === true
        });
    });
}
export function runAction(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input, nangoConnection, actionName, activityLogId } = args;
        const providerConfig = (yield configService.getProviderConfig(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key, nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id));
        const context = Context.current();
        const syncRun = new syncRunService({
            bigQueryClient,
            integrationService,
            recordsService,
            slackService,
            writeToDb: true,
            logCtx: yield logContextGetter.get({ id: String(activityLogId) }),
            sendSyncWebhook: sendSync,
            nangoConnection,
            syncName: actionName,
            isAction: true,
            syncType: SyncType.ACTION,
            activityLogId,
            input,
            provider: providerConfig.provider,
            debug: false,
            temporalContext: context
        });
        const actionResults = yield syncRun.run();
        return actionResults;
    });
}
export function scheduleAndRouteSync(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { syncId, syncName, nangoConnection, debug } = args;
        let environmentId = nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id;
        let syncJobId;
        const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
        const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${environmentId}`, false);
        const isOrchestrator = isGloballyEnabled || isEnvEnabled;
        if (isOrchestrator) {
            return true;
        }
        const initialSyncStillRunning = yield isInitialSyncStillRunning(syncId);
        if (initialSyncStillRunning) {
            const content = `The continuous sync "${syncName}" with sync id ${syncId} did not run because the initial sync is still running. It will attempt to run at the next scheduled time.`;
            logger.log('info', content);
            yield telemetry.log(LogTypes.SYNC_OVERLAP, content, LogActionEnum.SYNC, {
                environmentId: String(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id),
                connectionId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                providerConfigKey: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                syncName,
                syncId
            });
            return true;
        }
        // https://typescript.temporal.io/api/classes/activity.Context
        const context = Context.current();
        const lastSyncDate = yield getLastSyncDate(syncId);
        const syncType = lastSyncDate ? SyncType.INCREMENTAL : SyncType.INITIAL;
        let providerConfig;
        let syncConfig = null;
        try {
            if (!(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id)) {
                environmentId = (yield environmentService.getEnvironmentIdForAccountAssumingProd(nangoConnection.account_id));
                syncJobId = yield createSyncJob(syncId, syncType, SyncStatus.RUNNING, context.info.workflowExecution.workflowId, nangoConnection, context.info.workflowExecution.runId);
            }
            else {
                syncJobId = yield createSyncJob(syncId, syncType, SyncStatus.RUNNING, context.info.workflowExecution.workflowId, nangoConnection, context.info.workflowExecution.runId);
            }
            providerConfig = (yield configService.getProviderConfig(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key, environmentId));
            syncConfig = (yield getSyncConfigRaw({
                environmentId: providerConfig.environment_id,
                config_id: providerConfig.id,
                name: syncName,
                isAction: false
            }));
            return syncProvider({
                providerConfig,
                syncConfig,
                syncId,
                syncJobId: syncJobId === null || syncJobId === void 0 ? void 0 : syncJobId.id,
                syncName,
                syncType,
                nangoConnection: Object.assign(Object.assign({}, nangoConnection), { environment_id: environmentId }),
                temporalContext: context,
                debug: debug === true
            });
        }
        catch (err) {
            const prettyError = stringifyError(err, { pretty: true });
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.SYNC,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                provider_config_key: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                provider: '',
                session_id: '',
                environment_id: environmentId,
                operation_name: syncName
            };
            const content = `The continuous sync failed to run because of a failure to obtain the provider config for ${syncName} with the following error: ${prettyError}`;
            const activityLogId = yield createActivityLogAndLogMessage(log, {
                level: 'error',
                environment_id: environmentId,
                timestamp: Date.now(),
                content
            });
            const { account, environment } = (yield environmentService.getAccountAndEnvironment({ environmentId: nangoConnection.environment_id }));
            const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'sync', action: 'run' }, message: 'Sync' }, {
                account,
                environment,
                integration: providerConfig ? { id: providerConfig.id, name: providerConfig.unique_key, provider: providerConfig.provider } : undefined,
                connection: { id: nangoConnection.id, name: nangoConnection.connection_id },
                syncConfig: syncConfig ? { id: syncConfig.id, name: syncConfig.sync_name } : undefined
            });
            yield logCtx.error('The continuous sync failed to run because of a failure to obtain the provider config', { error: err, syncName });
            yield logCtx.failed();
            yield telemetry.log(LogTypes.SYNC_FAILURE, content, LogActionEnum.SYNC, {
                environmentId: String(environmentId),
                connectionId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                providerConfigKey: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                syncId,
                syncName,
                level: 'error'
            });
            errorManager.report(content, {
                environmentId,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.SYNC,
                metadata: {
                    syncType,
                    connectionId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                    providerConfigKey: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                    syncName
                }
            });
            return false;
        }
    });
}
/**
 * Sync Provider
 * @desc take in a provider, use the nango.yaml config to find
 * the integrations where that provider is used and call the sync
 * accordingly with the user defined integration code
 */
export function syncProvider({ providerConfig, syncConfig, syncId, syncJobId, syncName, syncType, nangoConnection, temporalContext, debug = false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const action = syncType === SyncType.INITIAL ? LogActionEnum.FULL_SYNC : LogActionEnum.SYNC;
        let logCtx;
        try {
            const log = {
                level: 'info',
                success: null,
                action,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: nangoConnection.connection_id,
                provider_config_key: nangoConnection.provider_config_key,
                provider: providerConfig.provider,
                session_id: syncJobId ? syncJobId === null || syncJobId === void 0 ? void 0 : syncJobId.toString() : '',
                environment_id: nangoConnection.environment_id,
                operation_name: syncName
            };
            const activityLogId = (yield createActivityLog(log));
            const { account, environment } = (yield environmentService.getAccountAndEnvironment({ environmentId: nangoConnection.environment_id }));
            logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'sync', action: 'run' }, message: 'Sync' }, {
                account,
                environment,
                integration: { id: providerConfig.id, name: providerConfig.unique_key, provider: providerConfig.provider },
                connection: { id: nangoConnection.id, name: nangoConnection.connection_id },
                syncConfig: { id: syncConfig.id, name: syncConfig.sync_name }
            });
            if (debug) {
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `Starting sync ${syncType} for ${syncName} with syncId ${syncId} and syncJobId ${syncJobId} with execution id of ${temporalContext.info.workflowExecution.workflowId} for attempt #${temporalContext.info.attempt}`
                });
                yield logCtx.info('Starting sync', {
                    syncType,
                    syncName,
                    syncId,
                    syncJobId,
                    attempt: temporalContext.info.attempt,
                    workflowId: temporalContext.info.workflowExecution.workflowId
                });
            }
            const syncRun = new syncRunService({
                bigQueryClient,
                integrationService,
                recordsService,
                slackService,
                sendSyncWebhook: sendSync,
                writeToDb: true,
                syncId,
                syncJobId,
                nangoConnection,
                syncName,
                syncType,
                activityLogId,
                provider: providerConfig.provider,
                temporalContext,
                debug,
                logCtx
            });
            const result = yield syncRun.run();
            return result.response;
        }
        catch (err) {
            const prettyError = stringifyError(err, { pretty: true });
            const log = {
                level: 'info',
                success: false,
                action,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                provider_config_key: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                provider: providerConfig.provider,
                session_id: syncJobId ? syncJobId === null || syncJobId === void 0 ? void 0 : syncJobId.toString() : '',
                environment_id: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id,
                operation_name: syncName
            };
            const content = `The ${syncType} sync failed to run because of a failure to create the job and run the sync with the error: ${prettyError}`;
            yield createActivityLogAndLogMessage(log, {
                level: 'error',
                environment_id: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id,
                timestamp: Date.now(),
                content
            });
            if (logCtx) {
                yield logCtx.error('Failed to create the job', { error: err });
                yield logCtx.failed();
            }
            yield telemetry.log(LogTypes.SYNC_OVERLAP, content, action, {
                environmentId: String(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id),
                syncId,
                connectionId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                providerConfigKey: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                syncName
            });
            errorManager.report(content, {
                environmentId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id,
                source: ErrorSourceEnum.PLATFORM,
                operation: action,
                metadata: {
                    connectionId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
                    providerConfigKey: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
                    syncType,
                    syncName
                }
            });
            return false;
        }
    });
}
export function runWebhook(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input, nangoConnection, activityLogId, parentSyncName } = args;
        const providerConfig = (yield configService.getProviderConfig(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key, nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id));
        const sync = yield getSyncByIdAndName(nangoConnection.id, parentSyncName);
        const context = Context.current();
        const syncJobId = yield createSyncJob(sync === null || sync === void 0 ? void 0 : sync.id, SyncType.WEBHOOK, SyncStatus.RUNNING, context.info.workflowExecution.workflowId, nangoConnection, context.info.workflowExecution.runId);
        const syncRun = new syncRunService({
            bigQueryClient,
            integrationService,
            recordsService,
            slackService,
            writeToDb: true,
            nangoConnection,
            sendSyncWebhook: sendSync,
            syncJobId: syncJobId === null || syncJobId === void 0 ? void 0 : syncJobId.id,
            syncName: parentSyncName,
            isAction: false,
            syncType: SyncType.WEBHOOK,
            syncId: sync === null || sync === void 0 ? void 0 : sync.id,
            isWebhook: true,
            activityLogId,
            logCtx: yield logContextGetter.get({ id: String(activityLogId) }),
            input,
            provider: providerConfig.provider,
            debug: false,
            temporalContext: context
        });
        const result = yield syncRun.run();
        return result.success;
    });
}
export function runPostConnectionScript(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, nangoConnection, activityLogId, file_location } = args;
        const providerConfig = (yield configService.getProviderConfig(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key, nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id));
        const context = Context.current();
        const syncRun = new syncRunService({
            bigQueryClient,
            integrationService,
            recordsService,
            slackService,
            writeToDb: true,
            nangoConnection,
            syncName: name,
            sendSyncWebhook: sendSync,
            isAction: false,
            isPostConnectionScript: true,
            syncType: SyncType.POST_CONNECTION_SCRIPT,
            isWebhook: false,
            activityLogId,
            logCtx: yield logContextGetter.get({ id: String(activityLogId) }),
            provider: providerConfig.provider,
            fileLocation: file_location,
            debug: false,
            temporalContext: context
        });
        const result = yield syncRun.run();
        return result;
    });
}
export function reportFailure(error, workflowArguments, timeout, max_attempts) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const { nangoConnection } = workflowArguments;
        let type = 'webhook';
        let name = '';
        if ('syncName' in workflowArguments) {
            name = workflowArguments.syncName;
            type = 'sync';
        }
        else if ('actionName' in workflowArguments) {
            name = workflowArguments.actionName;
            type = 'action';
        }
        else {
            name = workflowArguments.name;
        }
        let content = `The ${type} "${name}" failed `;
        const context = Context.current();
        if (error instanceof CancelledFailure) {
            content += `due to a cancellation.`;
        }
        else if (error.cause instanceof TerminatedFailure || ((_a = error.cause) === null || _a === void 0 ? void 0 : _a.name) === 'TerminatedFailure') {
            content += `due to a termination.`;
        }
        else if (error.cause instanceof TimeoutFailure || ((_b = error.cause) === null || _b === void 0 ? void 0 : _b.name) === 'TimeoutFailure') {
            if (error.cause.timeoutType === 3) {
                content += `due to a timeout with respect to the max schedule length timeout of ${timeout}.`;
            }
            else {
                content += `due to a timeout and a lack of heartbeat with ${max_attempts} attempts.`;
            }
        }
        else {
            content += `due to a unknown failure.`;
        }
        yield telemetry.log(LogTypes.FLOW_JOB_TIMEOUT_FAILURE, content, LogActionEnum.SYNC, {
            environmentId: String(nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id),
            name,
            connectionId: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.connection_id,
            providerConfigKey: nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.provider_config_key,
            error: JSON.stringify(errorToObject(error)),
            info: JSON.stringify(context.info),
            workflowId: context.info.workflowExecution.workflowId,
            runId: context.info.workflowExecution.runId,
            level: 'error'
        });
        if (type === 'sync' && 'syncId' in workflowArguments) {
            if ('syncJobId' in workflowArguments) {
                yield updateSyncJobStatus(workflowArguments.syncJobId, SyncStatus.STOPPED);
            }
            else {
                yield updateLatestJobSyncStatus(workflowArguments.syncId, SyncStatus.STOPPED);
            }
        }
    });
}
export function cancelActivity(workflowArguments) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { syncId, nangoConnection } = workflowArguments;
            const environmentId = nangoConnection === null || nangoConnection === void 0 ? void 0 : nangoConnection.environment_id;
            if ('syncJobId' in workflowArguments) {
                yield updateSyncJobStatus(workflowArguments.syncJobId, SyncStatus.STOPPED);
            }
            else {
                yield updateLatestJobSyncStatus(workflowArguments.syncId, SyncStatus.STOPPED);
            }
            yield integrationService.cancelScript(syncId, environmentId);
        }
        catch (e) {
            const content = `The sync "${workflowArguments.syncName}" with sync id ${workflowArguments.syncId} failed to cancel with the following error: ${e instanceof Error ? e.message : stringifyError(e)}`;
            errorManager.report(content, {
                environmentId: (_a = workflowArguments.nangoConnection) === null || _a === void 0 ? void 0 : _a.environment_id,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.SYNC,
                metadata: {
                    connectionId: (_b = workflowArguments.nangoConnection) === null || _b === void 0 ? void 0 : _b.connection_id,
                    providerConfigKey: (_c = workflowArguments.nangoConnection) === null || _c === void 0 ? void 0 : _c.provider_config_key,
                    syncName: workflowArguments.syncName,
                    syncId: workflowArguments.syncId
                }
            });
        }
    });
}
//# sourceMappingURL=activities.js.map