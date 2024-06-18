var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import ms from 'ms';
import { Err, Ok, stringifyError, metrics } from '@nangohq/utils';
import { v4 as uuid } from 'uuid';
import tracer from 'dd-trace';
import { NangoError } from '../utils/error.js';
import telemetry, { LogTypes } from '../utils/telemetry.js';
import { createActivityLog, createActivityLogMessage, createActivityLogMessageAndEnd, updateSuccess as updateSuccessActivityLog } from '../services/activity/activity.service.js';
import { SYNC_TASK_QUEUE, WEBHOOK_TASK_QUEUE } from '../constants.js';
import featureFlags from '../utils/featureflags.js';
import errorManager, { ErrorSourceEnum } from '../utils/error.manager.js';
import SyncClient from './sync.client.js';
import { LogActionEnum } from '../models/Activity.js';
import { SyncCommand } from '../models/index.js';
import { clearLastSyncDate } from '../services/sync/sync.service.js';
import { isSyncJobRunning } from '../services/sync/job.service.js';
import { updateSyncScheduleFrequency } from '../services/sync/schedule.service.js';
import { getSyncConfigRaw } from '../services/sync/config/config.service.js';
import environmentService from '../services/environment.service.js';
function getTemporal() {
    return __awaiter(this, void 0, void 0, function* () {
        const instance = yield SyncClient.getInstance();
        if (!instance) {
            throw new Error('Temporal client not initialized');
        }
        return instance.getClient();
    });
}
const ScheduleName = {
    get: ({ environmentId, syncId }) => {
        return `environment:${environmentId}:sync:${syncId}`;
    },
    parse: (scheduleName) => {
        const parts = scheduleName.split(':');
        if (parts.length !== 4 || parts[0] !== 'environment' || isNaN(Number(parts[1])) || parts[2] !== 'sync' || !parts[3] || parts[3].length === 0) {
            return Err(`Invalid schedule name: ${scheduleName}. expected format: environment:<environmentId>:sync:<syncId>`);
        }
        return Ok({ environmentId: Number(parts[1]), syncId: parts[3] });
    }
};
export class Orchestrator {
    constructor(client) {
        this.client = client;
    }
    searchSchedules(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const scheduleNames = props.map(({ syncId, environmentId }) => ScheduleName.get({ environmentId, syncId }));
            const schedules = yield this.client.searchSchedules({ scheduleNames, limit: scheduleNames.length });
            if (schedules.isErr()) {
                return Err(`Failed to get schedules: ${stringifyError(schedules.error)}`);
            }
            const scheduleMap = schedules.value.reduce((map, schedule) => {
                const parsed = ScheduleName.parse(schedule.name);
                if (parsed.isOk()) {
                    map.set(parsed.value.syncId, schedule);
                }
                return map;
            }, new Map());
            return Ok(scheduleMap);
        });
    }
    triggerAction({ connection, actionName, input, activityLogId, environment_id, logCtx }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const workflowId = `${SYNC_TASK_QUEUE}.ACTION:${actionName}.${connection.connection_id}.${uuid()}`;
            try {
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id,
                    activity_log_id: activityLogId,
                    content: `Starting action workflow ${workflowId} in the task queue: ${SYNC_TASK_QUEUE}`,
                    params: {
                        input: JSON.stringify(input, null, 2)
                    },
                    timestamp: Date.now()
                });
                yield logCtx.info(`Starting action workflow ${workflowId} in the task queue: ${SYNC_TASK_QUEUE}`, { input });
                let res;
                const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:immediate', 'global', false);
                const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:immediate', `${environment_id}`, false);
                const activeSpan = tracer.scope().active();
                const spanTags = {
                    'action.name': actionName,
                    'connection.id': connection.id,
                    'connection.connection_id': connection.connection_id,
                    'connection.provider_config_key': connection.provider_config_key,
                    'connection.environment_id': connection.environment_id
                };
                if (isGloballyEnabled || isEnvEnabled) {
                    const span = tracer.startSpan('execute.action', Object.assign({ tags: spanTags }, (activeSpan ? { childOf: activeSpan } : {})));
                    try {
                        const groupKey = 'action';
                        const executionId = `${groupKey}:environment:${connection.environment_id}:connection:${connection.id}:action:${actionName}:at:${new Date().toISOString()}:${uuid()}`;
                        const parsedInput = input ? JSON.parse(JSON.stringify(input)) : null;
                        const args = {
                            actionName,
                            connection: {
                                id: connection.id,
                                connection_id: connection.connection_id,
                                provider_config_key: connection.provider_config_key,
                                environment_id: connection.environment_id
                            },
                            activityLogId,
                            input: parsedInput
                        };
                        const actionResult = yield this.client.executeAction({
                            name: executionId,
                            groupKey,
                            args
                        });
                        res = actionResult.mapError((e) => new NangoError('action_failure', Object.assign({ error: e.message }, (e.payload ? { payload: e.payload } : {}))));
                        if (res.isErr()) {
                            span.setTag('error', res.error);
                        }
                    }
                    catch (e) {
                        const errorMsg = `Execute: Failed to parse input '${JSON.stringify(input)}': ${stringifyError(e)}`;
                        const error = new NangoError('action_failure', { error: errorMsg });
                        span.setTag('error', e);
                        return Err(error);
                    }
                    finally {
                        span.finish();
                    }
                }
                else {
                    const span = tracer.startSpan('execute.actionTemporal', Object.assign({ tags: spanTags }, (activeSpan ? { childOf: activeSpan } : {})));
                    try {
                        const temporal = yield getTemporal();
                        const actionHandler = yield temporal.workflow.execute('action', {
                            taskQueue: SYNC_TASK_QUEUE,
                            workflowId,
                            args: [
                                {
                                    actionName,
                                    nangoConnection: {
                                        id: connection.id,
                                        connection_id: connection.connection_id,
                                        provider_config_key: connection.provider_config_key,
                                        environment_id: connection.environment_id
                                    },
                                    input,
                                    activityLogId
                                }
                            ]
                        });
                        const { error: rawError, response } = actionHandler;
                        if (rawError) {
                            // Errors received from temporal are raw objects not classes
                            const error = new NangoError(rawError['type'], rawError['payload'], rawError['status']);
                            res = Err(error);
                            yield logCtx.error(`Failed with error ${rawError['type']}`, { payload: rawError['payload'] });
                        }
                        else {
                            res = Ok(response);
                        }
                        if (res.isErr()) {
                            span.setTag('error', res.error);
                        }
                    }
                    catch (e) {
                        span.setTag('error', e);
                        throw e;
                    }
                    finally {
                        span.finish();
                    }
                }
                if (res.isErr()) {
                    throw res.error;
                }
                const content = `The action workflow ${workflowId} was successfully run. A truncated response is: ${(_a = JSON.stringify(res.value, null, 2)) === null || _a === void 0 ? void 0 : _a.slice(0, 100)}`;
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content
                });
                yield updateSuccessActivityLog(activityLogId, true);
                yield logCtx.info(content);
                yield telemetry.log(LogTypes.ACTION_SUCCESS, content, LogActionEnum.ACTION, {
                    workflowId,
                    input: JSON.stringify(input, null, 2),
                    connection: JSON.stringify(connection),
                    actionName
                }, `actionName:${actionName}`);
                return res;
            }
            catch (err) {
                const errorMessage = stringifyError(err, { pretty: true });
                const error = new NangoError('action_failure', { errorMessage });
                const content = `The action workflow ${workflowId} failed with error: ${err}`;
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content
                });
                yield logCtx.error(content);
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId: connection.environment_id,
                    metadata: {
                        actionName,
                        connectionDetails: JSON.stringify(connection),
                        input
                    }
                });
                yield telemetry.log(LogTypes.ACTION_FAILURE, content, LogActionEnum.ACTION, {
                    workflowId,
                    input: JSON.stringify(input, null, 2),
                    connection: JSON.stringify(connection),
                    actionName,
                    level: 'error'
                }, `actionName:${actionName}`);
                return Err(error);
            }
            finally {
                const endTime = Date.now();
                const totalRunTime = (endTime - startTime) / 1000;
                metrics.duration(metrics.Types.ACTION_TRACK_RUNTIME, totalRunTime);
            }
        });
    }
    triggerWebhook({ account, environment, integration, connection, webhookName, syncConfig, input, logContextGetter }) {
        return __awaiter(this, void 0, void 0, function* () {
            const log = {
                level: 'info',
                success: null,
                action: LogActionEnum.WEBHOOK,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: connection.connection_id,
                provider_config_key: connection.provider_config_key,
                provider: integration.provider,
                environment_id: connection.environment_id,
                operation_name: webhookName
            };
            const activityLogId = yield createActivityLog(log);
            const logCtx = yield logContextGetter.create({
                id: String(activityLogId),
                operation: { type: 'webhook', action: 'incoming' },
                message: 'Received a webhook',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
            }, {
                account,
                environment,
                integration: { id: integration.id, name: integration.unique_key, provider: integration.provider },
                connection: { id: connection.id, name: connection.connection_id },
                syncConfig: { id: syncConfig.id, name: syncConfig.sync_name }
            });
            const workflowId = `${WEBHOOK_TASK_QUEUE}.WEBHOOK:${syncConfig.sync_name}:${webhookName}.${connection.connection_id}.${Date.now()}`;
            try {
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: integration.environment_id,
                    activity_log_id: activityLogId,
                    content: `Starting webhook workflow ${workflowId} in the task queue: ${WEBHOOK_TASK_QUEUE}`,
                    params: {
                        input: JSON.stringify(input, null, 2)
                    },
                    timestamp: Date.now()
                });
                yield logCtx.info('Starting webhook workflow', { workflowId, input });
                const _a = connection, { credentials, credentials_iv, credentials_tag, deleted, deleted_at } = _a, nangoConnectionWithoutCredentials = __rest(_a, ["credentials", "credentials_iv", "credentials_tag", "deleted", "deleted_at"]);
                const activeSpan = tracer.scope().active();
                const spanTags = {
                    'webhook.name': webhookName,
                    'connection.id': connection.id,
                    'connection.connection_id': connection.connection_id,
                    'connection.provider_config_key': connection.provider_config_key,
                    'connection.environment_id': connection.environment_id
                };
                let res;
                const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:immediate', 'global', false);
                const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:immediate', `${integration.environment_id}`, false);
                if (isGloballyEnabled || isEnvEnabled) {
                    const span = tracer.startSpan('execute.webhook', Object.assign({ tags: spanTags }, (activeSpan ? { childOf: activeSpan } : {})));
                    try {
                        const groupKey = 'webhook';
                        const executionId = `${groupKey}:environment:${connection.environment_id}:connection:${connection.id}:webhook:${webhookName}:at:${new Date().toISOString()}:${uuid()}`;
                        const parsedInput = input ? JSON.parse(JSON.stringify(input)) : null;
                        const args = {
                            webhookName,
                            parentSyncName: syncConfig.sync_name,
                            connection: {
                                id: connection.id,
                                connection_id: connection.connection_id,
                                provider_config_key: connection.provider_config_key,
                                environment_id: connection.environment_id
                            },
                            input: parsedInput,
                            activityLogId: activityLogId
                        };
                        const webhookResult = yield this.client.executeWebhook({
                            name: executionId,
                            groupKey,
                            args
                        });
                        res = webhookResult.mapError((e) => { var _a; return new NangoError('action_failure', (_a = e.payload) !== null && _a !== void 0 ? _a : { error: e.message }); });
                        if (res.isErr()) {
                            span.setTag('error', res.error);
                        }
                    }
                    catch (e) {
                        const errorMsg = `Execute: Failed to parse input '${JSON.stringify(input)}': ${stringifyError(e)}`;
                        const error = new NangoError('action_failure', { error: errorMsg });
                        span.setTag('error', e);
                        return Err(error);
                    }
                    finally {
                        span.finish();
                    }
                }
                else {
                    const span = tracer.startSpan('execute.webhookTemporal', Object.assign({ tags: spanTags }, (activeSpan ? { childOf: activeSpan } : {})));
                    try {
                        const temporal = yield getTemporal();
                        const webhookHandler = yield temporal.workflow.execute('webhook', {
                            taskQueue: WEBHOOK_TASK_QUEUE,
                            workflowId,
                            args: [
                                {
                                    name: webhookName,
                                    parentSyncName: syncConfig.sync_name,
                                    nangoConnection: nangoConnectionWithoutCredentials,
                                    input,
                                    activityLogId
                                }
                            ]
                        });
                        const { error, response } = webhookHandler;
                        if (error) {
                            res = Err(error);
                        }
                        else {
                            res = Ok(response);
                        }
                        if (res.isErr()) {
                            span.setTag('error', res.error);
                        }
                    }
                    catch (e) {
                        span.setTag('error', e);
                        throw e;
                    }
                    finally {
                        span.finish();
                    }
                }
                if (res.isErr()) {
                    throw res.error;
                }
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: integration.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `The webhook workflow ${workflowId} was successfully run.`
                });
                yield logCtx.info('The webhook workflow was successfully run');
                yield logCtx.success();
                yield updateSuccessActivityLog(activityLogId, true);
                return res;
            }
            catch (e) {
                const errorMessage = stringifyError(e, { pretty: true });
                const error = new NangoError('webhook_script_failure', { errorMessage });
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: integration.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `The webhook workflow ${workflowId} failed with error: ${errorMessage}`
                });
                yield logCtx.error('The webhook workflow failed', { error: e });
                yield logCtx.failed();
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId: connection.environment_id,
                    metadata: {
                        parentSyncName: syncConfig.sync_name,
                        webhookName,
                        connectionDetails: JSON.stringify(connection),
                        input
                    }
                });
                return Err(error);
            }
        });
    }
    triggerPostConnectionScript({ connection, name, fileLocation, activityLogId, logCtx }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const workflowId = `${SYNC_TASK_QUEUE}.POST_CONNECTION_SCRIPT:${name}.${connection.connection_id}.${uuid()}`;
            try {
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: connection.environment_id,
                    activity_log_id: activityLogId,
                    content: `Starting post connection script workflow ${workflowId} in the task queue: ${SYNC_TASK_QUEUE}`,
                    timestamp: Date.now()
                });
                yield logCtx.info(`Starting post connection script workflow ${workflowId} in the task queue: ${SYNC_TASK_QUEUE}`);
                let res;
                const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:immediate', 'global', false);
                const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:immediate', `${connection.environment_id}`, false);
                const activeSpan = tracer.scope().active();
                const spanTags = {
                    'postConnection.name': name,
                    'connection.id': connection.id,
                    'connection.connection_id': connection.connection_id,
                    'connection.provider_config_key': connection.provider_config_key,
                    'connection.environment_id': connection.environment_id
                };
                if (isGloballyEnabled || isEnvEnabled) {
                    const span = tracer.startSpan('execute.action', Object.assign({ tags: spanTags }, (activeSpan ? { childOf: activeSpan } : {})));
                    try {
                        const groupKey = 'post-connection-script';
                        const executionId = `${groupKey}:environment:${connection.environment_id}:connection:${connection.id}:post-connection-script:${name}:at:${new Date().toISOString()}:${uuid()}`;
                        const args = {
                            postConnectionName: name,
                            connection: {
                                id: connection.id,
                                connection_id: connection.connection_id,
                                provider_config_key: connection.provider_config_key,
                                environment_id: connection.environment_id
                            },
                            activityLogId,
                            fileLocation
                        };
                        const result = yield this.client.executePostConnection({
                            name: executionId,
                            groupKey,
                            args
                        });
                        res = result.mapError((e) => { var _a; return new NangoError('post_connection_failure', (_a = e.payload) !== null && _a !== void 0 ? _a : { error: e.message }); });
                        if (res.isErr()) {
                            span.setTag('error', res.error);
                        }
                    }
                    catch (e) {
                        span.setTag('error', e);
                        throw e;
                    }
                    finally {
                        span.finish();
                    }
                }
                else {
                    const span = tracer.startSpan('execute.postConnectionTemporal', Object.assign({ tags: spanTags }, (activeSpan ? { childOf: activeSpan } : {})));
                    try {
                        const temporal = yield getTemporal();
                        const postConnectionScriptHandler = yield temporal.workflow.execute('postConnectionScript', {
                            taskQueue: SYNC_TASK_QUEUE,
                            workflowId,
                            args: [
                                {
                                    name,
                                    nangoConnection: {
                                        id: connection.id,
                                        connection_id: connection.connection_id,
                                        provider_config_key: connection.provider_config_key,
                                        environment_id: connection.environment_id
                                    },
                                    fileLocation,
                                    activityLogId
                                }
                            ]
                        });
                        const { error: rawError, response } = postConnectionScriptHandler;
                        if (rawError) {
                            // Errors received from temporal are raw objects not classes
                            const error = new NangoError(rawError['type'], rawError['payload'], rawError['status']);
                            res = Err(error);
                            yield logCtx.error(`Failed with error ${rawError['type']}`, { payload: rawError['payload'] });
                        }
                        else {
                            res = Ok(response);
                        }
                        if (res.isErr()) {
                            span.setTag('error', res.error);
                        }
                    }
                    catch (e) {
                        span.setTag('error', e);
                        throw e;
                    }
                    finally {
                        span.finish();
                    }
                }
                if (res.isErr()) {
                    throw res.error;
                }
                const content = `The post connection script workflow ${workflowId} was successfully run. A truncated response is: ${(_a = JSON.stringify(res.value, null, 2)) === null || _a === void 0 ? void 0 : _a.slice(0, 100)}`;
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: connection.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content
                });
                yield updateSuccessActivityLog(activityLogId, true);
                yield logCtx.info(content);
                yield telemetry.log(LogTypes.POST_CONNECTION_SCRIPT_SUCCESS, content, LogActionEnum.POST_CONNECTION_SCRIPT, {
                    workflowId,
                    input: '',
                    connection: JSON.stringify(connection),
                    name
                }, `postConnectionScript:${name}`);
                return res;
            }
            catch (err) {
                const errorMessage = stringifyError(err, { pretty: true });
                const error = new NangoError('post_connection_script_failure', { errorMessage });
                const content = `The post-connection-script workflow ${workflowId} failed with error: ${err}`;
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: connection.environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content
                });
                yield logCtx.error(content);
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId: connection.environment_id,
                    metadata: {
                        name,
                        connectionDetails: JSON.stringify(connection)
                    }
                });
                yield telemetry.log(LogTypes.POST_CONNECTION_SCRIPT_FAILURE, content, LogActionEnum.POST_CONNECTION_SCRIPT, {
                    workflowId,
                    input: '',
                    connection: JSON.stringify(connection),
                    name,
                    level: 'error'
                }, `postConnectionScript:${name}`);
                return Err(error);
            }
            finally {
                const endTime = Date.now();
                const totalRunTime = (endTime - startTime) / 1000;
                metrics.duration(metrics.Types.POST_CONNECTION_SCRIPT_RUNTIME, totalRunTime);
            }
        });
    }
    updateSyncFrequency({ syncId, interval, syncName, environmentId, activityLogId, logCtx }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
            const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${environmentId}`, false);
            const isOrchestrator = isGloballyEnabled || isEnvEnabled;
            // Orchestrator
            const scheduleName = ScheduleName.get({ environmentId, syncId });
            const cleanInterval = this.cleanInterval(interval);
            if (isOrchestrator && cleanInterval.isErr()) {
                errorManager.report(cleanInterval.error, {
                    source: ErrorSourceEnum.CUSTOMER,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId,
                    metadata: {
                        syncName,
                        scheduleName,
                        interval
                    }
                });
                return Err(cleanInterval.error);
            }
            let res = Ok(undefined);
            if (cleanInterval.isOk()) {
                const frequencyMs = ms(cleanInterval.value);
                res = yield this.client.updateSyncFrequency({ scheduleName, frequencyMs });
            }
            // Legacy
            const { success, error } = yield updateSyncScheduleFrequency(syncId, interval, syncName, environmentId, activityLogId, logCtx);
            if (isOrchestrator) {
                if (res.isErr()) {
                    errorManager.report(res.error, {
                        source: ErrorSourceEnum.PLATFORM,
                        operation: LogActionEnum.SYNC_CLIENT,
                        environmentId,
                        metadata: {
                            syncName,
                            scheduleName,
                            interval
                        }
                    });
                }
                else {
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.info(`Sync frequency updated to ${interval}ms.`));
                }
                return res;
            }
            return success ? Ok(undefined) : Err((_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : 'Failed to update sync frequency');
        });
    }
    runSyncCommand({ syncId, command, activityLogId, environmentId, logCtx, recordsService, initiator }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cancelling = (syncId) => __awaiter(this, void 0, void 0, function* () {
                    const syncJob = yield isSyncJobRunning(syncId);
                    if (!syncJob || !(syncJob === null || syncJob === void 0 ? void 0 : syncJob.run_id)) {
                        return Err(`Sync job not found for syncId: ${syncId}`);
                    }
                    yield this.client.cancel({ taskId: syncJob === null || syncJob === void 0 ? void 0 : syncJob.run_id, reason: initiator });
                    return Ok(undefined);
                });
                const scheduleName = ScheduleName.get({ environmentId, syncId });
                switch (command) {
                    case SyncCommand.CANCEL:
                        return cancelling(syncId);
                    case SyncCommand.PAUSE:
                        return this.client.pauseSync({ scheduleName });
                    case SyncCommand.UNPAUSE:
                        return yield this.client.unpauseSync({ scheduleName });
                    case SyncCommand.RUN:
                        return this.client.executeSync({ scheduleName });
                    case SyncCommand.RUN_FULL: {
                        yield cancelling(syncId);
                        yield clearLastSyncDate(syncId);
                        const del = yield recordsService.deleteRecordsBySyncId({ syncId });
                        yield createActivityLogMessage({
                            level: 'info',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            timestamp: Date.now(),
                            content: `Records for the sync were deleted successfully`
                        });
                        yield logCtx.info(`Records for the sync were deleted successfully`, del);
                        return this.client.executeSync({ scheduleName });
                    }
                }
            }
            catch (err) {
                const errorMessage = stringifyError(err, { pretty: true });
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environmentId,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `The sync command: ${command} failed with error: ${errorMessage}`
                });
                yield logCtx.error(`Sync command failed "${command}"`, { error: err, command });
                return Err(err);
            }
        });
    }
    // TODO: remove once temporal is removed
    runSyncCommandHelper(props) {
        return __awaiter(this, void 0, void 0, function* () {
            const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
            const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${props.environmentId}`, false);
            const isOrchestrator = isGloballyEnabled || isEnvEnabled;
            const runWithOrchestrator = () => {
                return this.runSyncCommand({
                    syncId: props.syncId,
                    command: props.command,
                    activityLogId: props.activityLogId,
                    environmentId: props.environmentId,
                    logCtx: props.logCtx,
                    recordsService: props.recordsService,
                    initiator: props.initiator
                });
            };
            const runLegacy = () => __awaiter(this, void 0, void 0, function* () {
                const syncClient = yield SyncClient.getInstance();
                if (!syncClient) {
                    return Err(new NangoError('failed_to_get_sync_client'));
                }
                const res = yield syncClient.runSyncCommand({
                    scheduleId: props.scheduleId,
                    syncId: props.syncId,
                    command: props.command,
                    activityLogId: props.activityLogId,
                    environmentId: props.environmentId,
                    providerConfigKey: props.providerConfigKey,
                    connectionId: props.connectionId,
                    syncName: props.syncName,
                    nangoConnectionId: props.nangoConnectionId,
                    logCtx: props.logCtx,
                    recordsService: props.recordsService,
                    initiator: props.initiator
                });
                return res.isErr() ? Err(res.error) : Ok(undefined);
            });
            const isRunFullCommand = props.command === SyncCommand.RUN_FULL;
            if (isRunFullCommand) {
                // RUN_FULL command is triggering side effect (deleting records, ...)
                // so we run only orchestrator OR legacy
                if (isOrchestrator) {
                    return runWithOrchestrator();
                }
                return yield runLegacy();
            }
            else {
                // if the command is NOT a run command,
                // we run BOTH orchestrator and legacy
                const [resOrchestrator, resLegacy] = yield Promise.all([runWithOrchestrator(), runLegacy()]);
                if (isOrchestrator) {
                    return resOrchestrator;
                }
                return resLegacy;
            }
        });
    }
    deleteSync({ syncId, environmentId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.client.deleteSync({ scheduleName: `environment:${environmentId}:sync:${syncId}` });
            if (res.isErr()) {
                errorManager.report(res.error, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC,
                    environmentId,
                    metadata: { syncId, environmentId }
                });
            }
            return res;
        });
    }
    scheduleSync({ nangoConnection, sync, providerConfig, syncName, syncData, logContextGetter, debug = false, shouldLog }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let logCtx;
            try {
                const activityLogId = yield createActivityLog({
                    level: 'info',
                    success: null,
                    action: LogActionEnum.SYNC_INIT,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    connection_id: nangoConnection.connection_id,
                    provider_config_key: nangoConnection.provider_config_key,
                    provider: providerConfig.provider,
                    session_id: (_a = sync === null || sync === void 0 ? void 0 : sync.id) === null || _a === void 0 ? void 0 : _a.toString(),
                    environment_id: nangoConnection.environment_id,
                    operation_name: syncName
                });
                if (!activityLogId) {
                    return Err(new NangoError('failed_to_create_activity_log'));
                }
                const syncConfig = yield getSyncConfigRaw({
                    environmentId: nangoConnection.environment_id,
                    config_id: providerConfig.id,
                    name: syncName,
                    isAction: false
                });
                const { account, environment } = (yield environmentService.getAccountAndEnvironment({ environmentId: nangoConnection.environment_id }));
                logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'sync', action: 'init' }, message: 'Sync initialization' }, {
                    account,
                    environment,
                    integration: { id: providerConfig.id, name: providerConfig.unique_key, provider: providerConfig.provider },
                    connection: { id: nangoConnection.id, name: nangoConnection.connection_id },
                    syncConfig: { id: syncConfig.id, name: syncConfig.sync_name }
                }, { dryRun: shouldLog });
                const interval = this.cleanInterval(syncData.runs);
                if (interval.isErr()) {
                    const content = `The sync was not scheduled due to an error with the sync interval "${syncData.runs}": ${interval.error.message}`;
                    yield createActivityLogMessageAndEnd({
                        level: 'error',
                        environment_id: nangoConnection.environment_id,
                        activity_log_id: activityLogId,
                        timestamp: Date.now(),
                        content
                    });
                    yield logCtx.error('The sync was not created or started due to an error with the sync interval', {
                        error: interval.error,
                        runs: syncData.runs
                    });
                    yield logCtx.failed();
                    errorManager.report(content, {
                        source: ErrorSourceEnum.CUSTOMER,
                        operation: LogActionEnum.SYNC_CLIENT,
                        environmentId: nangoConnection.environment_id,
                        metadata: {
                            connectionDetails: nangoConnection,
                            providerConfig,
                            syncName,
                            sync,
                            syncData
                        }
                    });
                    yield updateSuccessActivityLog(activityLogId, false);
                    return Err(interval.error);
                }
                const schedule = yield this.client.recurring({
                    name: ScheduleName.get({ environmentId: nangoConnection.environment_id, syncId: sync.id }),
                    state: syncData.auto_start ? 'STARTED' : 'PAUSED',
                    frequencyMs: ms(interval.value),
                    groupKey: 'sync',
                    retry: { max: 0 },
                    timeoutSettingsInSecs: {
                        createdToStarted: 60 * 60,
                        startedToCompleted: 60 * 60 * 24,
                        heartbeat: 30 * 60 // 30 minutes
                    },
                    startsAt: new Date(),
                    args: {
                        type: 'sync',
                        syncId: sync.id,
                        syncName,
                        debug,
                        connection: {
                            id: nangoConnection.id,
                            provider_config_key: nangoConnection.provider_config_key,
                            environment_id: nangoConnection.environment_id,
                            connection_id: nangoConnection.connection_id
                        }
                    }
                });
                if (schedule.isErr()) {
                    throw schedule.error;
                }
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: nangoConnection.environment_id,
                    activity_log_id: activityLogId,
                    content: `Scheduled to run "${syncData.runs}"`,
                    timestamp: Date.now()
                });
                yield logCtx.info('Scheduled successfully', { runs: syncData.runs });
                yield logCtx.success();
                return Ok(undefined);
            }
            catch (err) {
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.SYNC_CLIENT,
                    environmentId: nangoConnection.environment_id,
                    metadata: {
                        syncName,
                        connectionDetails: JSON.stringify(nangoConnection),
                        syncId: sync.id,
                        providerConfig,
                        syncData: JSON.stringify(syncData)
                    }
                });
                if (logCtx) {
                    yield logCtx.error('Failed to init sync', { error: err });
                    yield logCtx.failed();
                }
                return Err(`Failed to schedule sync: ${err}`);
            }
        });
    }
    // TODO: remove once temporal is removed
    scheduleSyncHelper(nangoConnection, sync, providerConfig, syncName, syncData, logContextGetter, debug = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const isGloballyEnabled = yield featureFlags.isEnabled('orchestrator:schedule', 'global', false);
            const isEnvEnabled = yield featureFlags.isEnabled('orchestrator:schedule', `${nangoConnection.environment_id}`, false);
            const isOrchestrator = isGloballyEnabled || isEnvEnabled;
            const res = yield this.scheduleSync({
                nangoConnection,
                sync,
                providerConfig,
                syncName,
                syncData,
                logContextGetter,
                shouldLog: isOrchestrator,
                debug
            });
            const syncClient = yield SyncClient.getInstance();
            let resTemporal;
            if (syncClient) {
                try {
                    const shouldLog = !isOrchestrator;
                    yield syncClient.startContinuous(nangoConnection, sync, providerConfig, syncName, syncData, logContextGetter, shouldLog, debug);
                    resTemporal = Ok(undefined);
                }
                catch (e) {
                    resTemporal = Err(`Failed to schedule sync: ${e}`);
                }
            }
            else {
                resTemporal = Err(new NangoError('failed_to_get_sync_client'));
            }
            return isOrchestrator ? res : resTemporal;
        });
    }
    cleanInterval(runs) {
        if (runs === 'every half day') {
            return Ok('12h');
        }
        if (runs === 'every half hour') {
            return Ok('30m');
        }
        if (runs === 'every quarter hour') {
            return Ok('15m');
        }
        if (runs === 'every hour') {
            return Ok('1h');
        }
        if (runs === 'every day') {
            return Ok('1d');
        }
        if (runs === 'every month') {
            return Ok('30d');
        }
        if (runs === 'every week') {
            return Ok('7d');
        }
        const interval = runs.replace('every ', '');
        if (!ms(interval)) {
            const error = new NangoError('sync_interval_invalid');
            return Err(error);
        }
        if (ms(interval) < ms('5m')) {
            const error = new NangoError('sync_interval_too_short');
            return Err(error);
        }
        return Ok(interval);
    }
}
//# sourceMappingURL=orchestrator.js.map