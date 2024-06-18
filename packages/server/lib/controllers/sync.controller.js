var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import tracer from 'dd-trace';
import { deploy as deployScriptConfig, connectionService, getSyncs, verifyOwnership, isSyncValid, getSyncNamesByConnectionId, getSyncsByProviderConfigKey, SyncClient, updateScheduleStatus, updateSuccess as updateSuccessActivityLog, createActivityLogMessageAndEnd, createActivityLog, getAndReconcileDifferences, getSyncConfigsWithConnectionsByEnvironmentId, getProviderConfigBySyncAndAccount, SyncCommand, CommandToActivityLog, errorManager, analytics, AnalyticsTypes, ErrorSourceEnum, LogActionEnum, NangoError, configService, syncManager, getAttributes, flowService, getActionOrModelByEndpoint, getSyncsBySyncConfigId, updateFrequency, getInterval, findSyncByConnections, setFrequency, getSyncAndActionConfigsBySyncNameAndConfigId, createActivityLogMessage, trackFetch, syncCommandToOperation, getSyncConfigRaw } from '@nangohq/shared';
import { defaultOperationExpiration, logContextGetter } from '@nangohq/logs';
import { isHosted } from '@nangohq/utils';
import { records as recordsService } from '@nangohq/records';
import { getOrchestrator } from '../utils/utils.js';
const orchestrator = getOrchestrator();
class SyncController {
    deploySync(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let debug;
                let singleDeployMode;
                let flowConfigs;
                let postConnectionScriptsByProvider = [];
                let reconcile;
                if (req.body.syncs) {
                    ({
                        syncs: flowConfigs,
                        reconcile,
                        debug,
                        singleDeployMode
                    } = req.body);
                }
                else {
                    ({ flowConfigs, postConnectionScriptsByProvider, reconcile, debug, singleDeployMode } = req.body);
                }
                const { environment, account } = res.locals;
                let reconcileSuccess = true;
                const { success, error, response: syncConfigDeployResult } = yield deployScriptConfig({
                    environment,
                    account,
                    flows: flowConfigs,
                    nangoYamlBody: req.body.nangoYamlBody || '',
                    postConnectionScriptsByProvider,
                    debug,
                    logContextGetter,
                    orchestrator
                });
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (reconcile) {
                    const logCtx = yield logContextGetter.get({ id: String(syncConfigDeployResult === null || syncConfigDeployResult === void 0 ? void 0 : syncConfigDeployResult.activityLogId) });
                    const success = yield getAndReconcileDifferences({
                        environmentId: environment.id,
                        flows: flowConfigs,
                        performAction: reconcile,
                        activityLogId: syncConfigDeployResult === null || syncConfigDeployResult === void 0 ? void 0 : syncConfigDeployResult.activityLogId,
                        debug,
                        singleDeployMode,
                        logCtx,
                        logContextGetter,
                        orchestrator
                    });
                    if (!success) {
                        reconcileSuccess = false;
                    }
                }
                if (!reconcileSuccess) {
                    res.status(500).send({ message: 'There was an error deploying syncs, please check the activity tab and report this issue to support' });
                    return;
                }
                void analytics.trackByEnvironmentId(AnalyticsTypes.SYNC_DEPLOY_SUCCESS, environment.id);
                res.send(syncConfigDeployResult === null || syncConfigDeployResult === void 0 ? void 0 : syncConfigDeployResult.result);
            }
            catch (e) {
                const environmentId = res.locals['environment'].id;
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    environmentId,
                    operation: LogActionEnum.SYNC_DEPLOY
                });
                next(e);
            }
        });
    }
    confirmation(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let debug, singleDeployMode, flowConfigs;
                if (req.body.syncs) {
                    ({ syncs: flowConfigs, debug, singleDeployMode } = req.body);
                }
                else {
                    ({ flowConfigs, debug, singleDeployMode } = req.body);
                }
                const environmentId = res.locals['environment'].id;
                const result = yield getAndReconcileDifferences({
                    environmentId,
                    flows: flowConfigs,
                    performAction: false,
                    activityLogId: null,
                    debug,
                    singleDeployMode,
                    logContextGetter,
                    orchestrator
                });
                res.send(result);
            }
            catch (e) {
                next(e);
            }
        });
    }
    getAllRecords(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { model, delta, modified_after, modifiedAfter, limit, filter, cursor, next_cursor } = req.query;
                const environmentId = res.locals['environment'].id;
                const connectionId = req.get('Connection-Id');
                const providerConfigKey = req.get('Provider-Config-Key');
                if (modifiedAfter) {
                    const error = new NangoError('incorrect_param', { incorrect: 'modifiedAfter', correct: 'modified_after' });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (next_cursor) {
                    const error = new NangoError('incorrect_param', { incorrect: 'next_cursor', correct: 'cursor' });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                const { error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environmentId);
                if (error || !connection) {
                    const nangoError = new NangoError('unknown_connection', { connectionId, providerConfigKey, environmentId });
                    errorManager.errResFromNangoErr(res, nangoError);
                    return;
                }
                const result = yield recordsService.getRecords({
                    connectionId: connection.id,
                    model: model,
                    modifiedAfter: (delta || modified_after),
                    limit: limit,
                    filter: filter,
                    cursor: cursor
                });
                if (result.isErr()) {
                    errorManager.errResFromNangoErr(res, new NangoError('pass_through_error', result.error));
                    return;
                }
                yield trackFetch(connection.id);
                res.send(result.value);
            }
            catch (e) {
                next(e);
            }
        });
    }
    getSyncsByParams(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                const { connection_id, provider_config_key } = req.query;
                const { success, error, response: connection } = yield connectionService.getConnection(connection_id, provider_config_key, environment.id);
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (!connection) {
                    const error = new NangoError('unknown_connection', { connection_id, provider_config_key, environmentName: environment.name });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (isHosted) {
                    res.send([]);
                    return;
                }
                const syncs = yield getSyncs(connection, orchestrator);
                res.send(syncs);
            }
            catch (e) {
                next(e);
            }
        });
    }
    getSyncs(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                const syncs = yield getSyncConfigsWithConnectionsByEnvironmentId(environment.id);
                const flows = flowService.getAllAvailableFlows();
                res.send({ syncs, flows });
            }
            catch (e) {
                next(e);
            }
        });
    }
    trigger(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { syncs: syncNames, full_resync } = req.body;
                const provider_config_key = req.body.provider_config_key || req.get('Provider-Config-Key');
                if (!provider_config_key) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                const connection_id = req.body.connection_id || req.get('Connection-Id');
                if (typeof syncNames === 'string') {
                    res.status(400).send({ message: 'Syncs must be an array' });
                    return;
                }
                if (!syncNames) {
                    res.status(400).send({ message: 'Missing sync names' });
                    return;
                }
                if (full_resync && typeof full_resync !== 'boolean') {
                    res.status(400).send({ message: 'full_resync must be a boolean' });
                    return;
                }
                const { environment } = res.locals;
                const { success, error } = yield syncManager.runSyncCommand({
                    recordsService,
                    orchestrator,
                    environment,
                    providerConfigKey: provider_config_key,
                    syncNames: syncNames,
                    command: full_resync ? SyncCommand.RUN_FULL : SyncCommand.RUN,
                    logContextGetter,
                    connectionId: connection_id,
                    initiator: 'API call'
                });
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                res.sendStatus(200);
            }
            catch (e) {
                next(e);
            }
        });
    }
    actionOrModel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const providerConfigKey = req.get('Provider-Config-Key');
                const connectionId = req.get('Connection-Id');
                const path = '/' + req.params['0'];
                if (!connectionId) {
                    res.status(400).send({ error: 'Missing connection id' });
                    return;
                }
                if (!providerConfigKey) {
                    res.status(400).send({ error: 'Missing provider config key' });
                    return;
                }
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environmentId);
                if (!success) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                const { action, model } = yield getActionOrModelByEndpoint(connection, req.method, path);
                if (action) {
                    const input = req.body || req.params[1];
                    req.body = {};
                    req.body['action_name'] = action;
                    req.body['input'] = input;
                    yield this.triggerAction(req, res, next);
                }
                else if (model) {
                    req.query['model'] = model;
                    yield this.getAllRecords(req, res, next);
                }
                else {
                    res.status(404).send({ message: `Unknown endpoint '${req.method} ${path}'` });
                }
            }
            catch (e) {
                next(e);
            }
        });
    }
    triggerAction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const active = tracer.scope().active();
            const span = tracer.startSpan('server.sync.triggerAction', {
                childOf: active
            });
            const { input, action_name } = req.body;
            const { account, environment } = res.locals;
            const environmentId = environment.id;
            const connectionId = req.get('Connection-Id');
            const providerConfigKey = req.get('Provider-Config-Key');
            let logCtx;
            try {
                if (!action_name || typeof action_name !== 'string') {
                    res.status(400).send({ error: 'Missing action name' });
                    span.finish();
                    return;
                }
                if (!connectionId) {
                    res.status(400).send({ error: 'Missing connection id' });
                    span.finish();
                    return;
                }
                if (!providerConfigKey) {
                    res.status(400).send({ error: 'Missing provider config key' });
                    span.finish();
                    return;
                }
                const { success, error, response: connection } = yield connectionService.getConnection(connectionId, providerConfigKey, environmentId);
                if (!success || !connection) {
                    errorManager.errResFromNangoErr(res, error);
                    span.finish();
                    return;
                }
                const provider = yield configService.getProviderConfig(providerConfigKey, environmentId);
                if (!provider) {
                    res.status(404).json({ error: { code: 'not_found' } });
                    return;
                }
                const syncConfig = yield getSyncConfigRaw({ environmentId, config_id: provider.id, name: action_name, isAction: true });
                if (!syncConfig) {
                    res.status(404).json({ error: { code: 'not_found' } });
                    return;
                }
                const log = {
                    level: 'info',
                    success: false,
                    action: LogActionEnum.ACTION,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    connection_id: connection.connection_id,
                    provider: provider.provider,
                    provider_config_key: connection.provider_config_key,
                    environment_id: environmentId,
                    operation_name: action_name
                };
                span.setTag('nango.actionName', action_name)
                    .setTag('nango.connectionId', connectionId)
                    .setTag('nango.environmentId', environmentId)
                    .setTag('nango.providerConfigKey', providerConfigKey);
                const activityLogId = yield createActivityLog(log);
                if (!activityLogId) {
                    throw new NangoError('failed_to_create_activity_log');
                }
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'action' },
                    message: 'Start action',
                    expiresAt: defaultOperationExpiration.action()
                }, {
                    account,
                    environment,
                    integration: { id: provider.id, name: connection.provider_config_key, provider: provider.provider },
                    connection: { id: connection.id, name: connection.connection_id },
                    syncConfig: { id: syncConfig.id, name: syncConfig.sync_name },
                    meta: { input }
                });
                const syncClient = yield SyncClient.getInstance();
                if (!syncClient) {
                    throw new NangoError('failed_to_get_sync_client');
                }
                const actionResponse = yield getOrchestrator().triggerAction({
                    connection,
                    actionName: action_name,
                    input,
                    activityLogId,
                    environment_id: environmentId,
                    logCtx
                });
                if (actionResponse.isOk()) {
                    span.finish();
                    yield logCtx.success();
                    res.status(200).json(actionResponse.value);
                    return;
                }
                else {
                    span.setTag('nango.error', actionResponse.error);
                    yield logCtx.error('Failed to run action', { error: actionResponse.error });
                    yield logCtx.failed();
                    errorManager.errResFromNangoErr(res, actionResponse.error);
                    span.finish();
                    return;
                }
            }
            catch (err) {
                span.setTag('nango.error', err);
                span.finish();
                if (logCtx) {
                    yield logCtx.error('Failed to run action', { error: err });
                    yield logCtx.failed();
                }
                next(err);
            }
        });
    }
    getSyncProvider(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const { syncName } = req.query;
                if (!syncName) {
                    res.status(400).send({ message: 'Missing sync name!' });
                    return;
                }
                const providerConfigKey = yield getProviderConfigBySyncAndAccount(syncName, environmentId);
                res.send(providerConfigKey);
            }
            catch (e) {
                next(e);
            }
        });
    }
    pause(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { syncs: syncNames, provider_config_key, connection_id } = req.body;
                if (!provider_config_key) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                if (typeof syncNames === 'string') {
                    res.status(400).send({ message: 'Syncs must be an array' });
                    return;
                }
                if (!syncNames) {
                    res.status(400).send({ message: 'Missing sync names' });
                    return;
                }
                const { environment } = res.locals;
                yield syncManager.runSyncCommand({
                    recordsService,
                    orchestrator,
                    environment,
                    providerConfigKey: provider_config_key,
                    syncNames: syncNames,
                    command: SyncCommand.PAUSE,
                    logContextGetter,
                    connectionId: connection_id,
                    initiator: 'API call'
                });
                res.sendStatus(200);
            }
            catch (e) {
                next(e);
            }
        });
    }
    start(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { syncs: syncNames, provider_config_key, connection_id } = req.body;
                if (!provider_config_key) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                if (typeof syncNames === 'string') {
                    res.status(400).send({ message: 'Syncs must be an array' });
                    return;
                }
                if (!syncNames) {
                    res.status(400).send({ message: 'Missing sync names' });
                    return;
                }
                const { environment } = res.locals;
                yield syncManager.runSyncCommand({
                    recordsService,
                    orchestrator,
                    environment,
                    providerConfigKey: provider_config_key,
                    syncNames: syncNames,
                    command: SyncCommand.UNPAUSE,
                    logContextGetter,
                    connectionId: connection_id,
                    initiator: 'API call'
                });
                res.sendStatus(200);
            }
            catch (e) {
                next(e);
            }
        });
    }
    getSyncStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { syncs: passedSyncNames, provider_config_key, connection_id } = req.query;
                let syncNames = passedSyncNames;
                if (!provider_config_key) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                if (!syncNames) {
                    res.status(400).send({ message: 'Sync names must be passed in' });
                    return;
                }
                const environmentId = res.locals['environment'].id;
                let connection = null;
                if (connection_id) {
                    const connectionResult = yield connectionService.getConnection(connection_id, provider_config_key, environmentId);
                    const { success: connectionSuccess, error: connectionError } = connectionResult;
                    if (!connectionSuccess || !connectionResult.response) {
                        errorManager.errResFromNangoErr(res, connectionError);
                        return;
                    }
                    connection = connectionResult.response;
                }
                if (syncNames === '*') {
                    if (connection && connection.id) {
                        syncNames = yield getSyncNamesByConnectionId(connection.id);
                    }
                    else {
                        const syncs = yield getSyncsByProviderConfigKey(environmentId, provider_config_key);
                        syncNames = syncs.map((sync) => sync.name);
                    }
                }
                else {
                    syncNames = syncNames.split(',');
                }
                const { success, error, response: syncsWithStatus } = yield syncManager.getSyncStatus(environmentId, provider_config_key, syncNames, orchestrator, connection_id, false, connection);
                if (!success || !syncsWithStatus) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                res.send({ syncs: syncsWithStatus });
            }
            catch (e) {
                next(e);
            }
        });
    }
    syncCommand(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let logCtx;
            try {
                const { account, environment } = res.locals;
                const { schedule_id, command, nango_connection_id, sync_id, sync_name, provider } = req.body;
                const connection = yield connectionService.getConnectionById(nango_connection_id);
                if (!connection) {
                    res.status(404).json({ error: { code: 'not_found' } });
                    return;
                }
                const config = yield configService.getProviderConfig(connection.provider_config_key, environment.id);
                if (!config) {
                    res.status(404).json({ error: { code: 'not_found' } });
                    return;
                }
                const syncConfig = yield getSyncConfigRaw({ environmentId: config.environment_id, config_id: config.id, name: sync_name, isAction: false });
                if (!syncConfig) {
                    res.status(404).json({ error: { code: 'not_found' } });
                    return;
                }
                const action = CommandToActivityLog[command];
                const log = {
                    level: 'info',
                    success: false,
                    action,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    connection_id: connection.connection_id,
                    provider,
                    provider_config_key: connection.provider_config_key,
                    environment_id: environment.id,
                    operation_name: sync_name
                };
                const activityLogId = yield createActivityLog(log);
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'sync', action: syncCommandToOperation[command] },
                    message: `Trigger ${command}`
                }, {
                    account,
                    environment,
                    integration: { id: config.id, name: config.unique_key, provider: config.provider },
                    connection: { id: connection.id, name: connection.connection_id },
                    syncConfig: { id: syncConfig.id, name: syncConfig.sync_name }
                });
                if (!(yield verifyOwnership(nango_connection_id, environment.id, sync_id))) {
                    yield createActivityLogMessage({
                        level: 'error',
                        activity_log_id: activityLogId,
                        environment_id: environment.id,
                        timestamp: Date.now(),
                        content: `Unauthorized access to run the command: "${action}" for sync: ${sync_id}`
                    });
                    yield logCtx.error('Unauthorized access to run the command');
                    yield logCtx.failed();
                    res.sendStatus(401);
                    return;
                }
                const result = yield orchestrator.runSyncCommandHelper({
                    scheduleId: schedule_id,
                    syncId: sync_id,
                    command,
                    activityLogId: activityLogId,
                    environmentId: environment.id,
                    providerConfigKey: connection === null || connection === void 0 ? void 0 : connection.provider_config_key,
                    connectionId: connection === null || connection === void 0 ? void 0 : connection.connection_id,
                    syncName: sync_name,
                    nangoConnectionId: connection === null || connection === void 0 ? void 0 : connection.id,
                    logCtx,
                    recordsService,
                    initiator: 'UI'
                });
                if (result.isErr()) {
                    errorManager.handleGenericError(result.error, req, res, tracer);
                    yield logCtx.failed();
                    return;
                }
                if (command !== SyncCommand.RUN) {
                    yield updateScheduleStatus(schedule_id, command, activityLogId, environment.id, logCtx);
                }
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `Sync was updated with command: "${action}" for sync: ${sync_id}`
                });
                yield updateSuccessActivityLog(activityLogId, true);
                yield logCtx.info(`Sync command run successfully "${action}"`, { action, syncId: sync_id });
                yield logCtx.success();
                let event = AnalyticsTypes.SYNC_RUN;
                switch (command) {
                    case SyncCommand.PAUSE:
                        event = AnalyticsTypes.SYNC_PAUSE;
                        break;
                    case SyncCommand.UNPAUSE:
                        event = AnalyticsTypes.SYNC_UNPAUSE;
                        break;
                    case SyncCommand.RUN:
                        event = AnalyticsTypes.SYNC_RUN;
                        break;
                    case SyncCommand.CANCEL:
                        event = AnalyticsTypes.SYNC_CANCEL;
                        break;
                }
                void analytics.trackByEnvironmentId(event, environment.id, {
                    sync_id,
                    sync_name,
                    provider,
                    provider_config_key: connection === null || connection === void 0 ? void 0 : connection.provider_config_key,
                    connection_id: connection === null || connection === void 0 ? void 0 : connection.connection_id,
                    schedule_id
                });
                res.sendStatus(200);
            }
            catch (err) {
                if (logCtx) {
                    yield logCtx.error('Failed to sync command', { error: err });
                    yield logCtx.failed();
                }
                next(err);
            }
        });
    }
    getFlowAttributes(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sync_name, provider_config_key } = req.query;
                if (!provider_config_key) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                if (!sync_name) {
                    res.status(400).send({ message: 'Missing sync name' });
                    return;
                }
                const attributes = yield getAttributes(provider_config_key, sync_name);
                res.status(200).send(attributes);
            }
            catch (e) {
                next(e);
            }
        });
    }
    updateFrequency(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                const syncConfigId = req.params['syncId'];
                const { frequency } = req.body;
                if (!syncConfigId) {
                    res.status(400).send({ message: 'Missing sync config id' });
                    return;
                }
                if (!frequency) {
                    res.status(400).send({ message: 'Missing frequency' });
                    return;
                }
                const syncs = yield getSyncsBySyncConfigId(environment.id, Number(syncConfigId));
                const setFrequency = `every ${frequency}`;
                for (const sync of syncs) {
                    const updated = yield orchestrator.updateSyncFrequency({
                        syncId: sync.id,
                        interval: setFrequency,
                        syncName: sync.name,
                        environmentId: environment.id
                    });
                    if (updated.isErr()) {
                        const error = new NangoError('failed_to_update_frequency', { syncId: sync.id, frequency: setFrequency });
                        errorManager.errResFromNangoErr(res, error);
                        return;
                    }
                }
                yield updateFrequency(Number(syncConfigId), setFrequency);
                res.sendStatus(200);
            }
            catch (e) {
                next(e);
            }
        });
    }
    deleteSync(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const syncId = req.params['syncId'];
                const { connection_id, provider_config_key } = req.query;
                if (!provider_config_key) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                if (!syncId) {
                    res.status(400).send({ message: 'Missing sync id' });
                    return;
                }
                if (!connection_id) {
                    res.status(400).send({ message: 'Missing connection id' });
                    return;
                }
                const environmentId = res.locals['environment'].id;
                const isValid = yield isSyncValid(connection_id, provider_config_key, environmentId, syncId);
                if (!isValid) {
                    res.status(400).send({ message: 'Invalid sync id' });
                    return;
                }
                yield syncManager.softDeleteSync(syncId, environmentId, orchestrator);
                res.sendStatus(204);
            }
            catch (e) {
                next(e);
            }
        });
    }
    /**
     * PUT /sync/update-connection-frequency
     *
     * Allow users to change the default frequency value of a sync without losing the value.
     * The system will store the value inside `_nango_syncs.frequency` and update the relevant schedules.
     */
    updateFrequencyForConnection(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sync_name, provider_config_key, connection_id, frequency } = req.body;
                if (!provider_config_key || typeof provider_config_key !== 'string') {
                    res.status(400).send({ message: 'provider_config_key must be a string' });
                    return;
                }
                if (!sync_name || typeof sync_name !== 'string') {
                    res.status(400).send({ message: 'sync_name must be a string' });
                    return;
                }
                if (!connection_id || typeof connection_id !== 'string') {
                    res.status(400).send({ message: 'connection_id must be a string' });
                    return;
                }
                if (typeof frequency !== 'string' && frequency !== null) {
                    res.status(400).send({ message: 'frequency must be a string or null' });
                    return;
                }
                let newFrequency;
                if (frequency) {
                    const { error, response } = getInterval(frequency, new Date());
                    if (error || !response) {
                        res.status(400).send({ message: 'frequency must have a valid format (https://github.com/vercel/ms)' });
                        return;
                    }
                    newFrequency = response.interval;
                }
                const envId = res.locals['environment'].id;
                const getConnection = yield connectionService.getConnection(connection_id, provider_config_key, envId);
                if (!getConnection.response || getConnection.error) {
                    res.status(400).send({ message: 'Invalid connection_id' });
                    return;
                }
                const connection = getConnection.response;
                const syncs = yield findSyncByConnections([Number(connection.id)], sync_name);
                if (syncs.length <= 0) {
                    res.status(400).send({ message: 'Invalid sync_name' });
                    return;
                }
                const syncId = syncs[0].id;
                // When "frequency === null" we revert the value stored in the sync config
                if (!newFrequency) {
                    const providerId = yield configService.getIdByProviderConfigKey(envId, provider_config_key);
                    const syncConfigs = yield getSyncAndActionConfigsBySyncNameAndConfigId(envId, providerId, sync_name);
                    if (syncConfigs.length <= 0) {
                        res.status(400).send({ message: 'Invalid sync_name' });
                        return;
                    }
                    newFrequency = syncConfigs[0].runs;
                }
                yield setFrequency(syncId, frequency);
                const updated = yield orchestrator.updateSyncFrequency({
                    syncId,
                    interval: newFrequency,
                    syncName: sync_name,
                    environmentId: connection.environment_id
                });
                if (updated.isErr()) {
                    const error = new NangoError('failed_to_update_frequency', { syncId, frequency: newFrequency });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                res.status(200).send({ frequency: newFrequency });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
export default new SyncController();
//# sourceMappingURL=sync.controller.js.map