var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { errorManager, initOnboarding, getOnboardingProgress, updateOnboardingProgress, flowService, SyncConfigType, deployPreBuilt as deployPreBuiltSyncConfig, syncManager, getOnboardingProvider, createOnboardingProvider, DEMO_GITHUB_CONFIG_KEY, connectionService, DEMO_SYNC_NAME, DEMO_MODEL, getSyncByIdAndName, DEFAULT_GITHUB_CLIENT_ID, DEFAULT_GITHUB_CLIENT_SECRET, SyncCommand, SyncStatus, SyncClient, NangoError, DEMO_ACTION_NAME, createActivityLog, LogActionEnum, analytics, AnalyticsTypes, getSyncConfigRaw } from '@nangohq/shared';
import { getLogger } from '@nangohq/utils';
import { defaultOperationExpiration, logContextGetter } from '@nangohq/logs';
import { records as recordsService } from '@nangohq/records';
import { getOrchestrator } from '../utils/utils.js';
const logger = getLogger('Server.Onboarding');
const orchestrator = getOrchestrator();
class OnboardingController {
    /**
     * Start an onboarding process.
     * We create a row in the DB to store the global state and create a GitHub provider so we can launch the oauth process
     */
    create(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { user, environment, account } = res.locals;
                if (environment.name !== 'dev') {
                    res.status(400).json({ error: 'onboarding_dev_only' });
                    return;
                }
                if (!DEFAULT_GITHUB_CLIENT_ID || !DEFAULT_GITHUB_CLIENT_SECRET) {
                    throw new Error('missing_env_var');
                }
                void analytics.track(AnalyticsTypes.DEMO_1, account.id, { user_id: user.id });
                // Create an onboarding state to remember where user left
                const onboardingId = yield initOnboarding(user.id);
                if (!onboardingId) {
                    void analytics.track(AnalyticsTypes.DEMO_1_ERR, account.id, { user_id: user.id });
                    res.status(500).json({
                        error: 'Failed to create onboarding'
                    });
                }
                // We create a default provider if not already there
                // Because we need one to launch authorization straight away
                const provider = yield getOnboardingProvider({ envId: environment.id });
                if (!provider) {
                    yield createOnboardingProvider({ envId: environment.id });
                }
                res.status(201).json({
                    id: onboardingId
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * Get the interactive demo status.
     * We use the progress stored in DB to remember "unprovable step", but most of steps relies on specific data to be present.
     * So we check if each step has been correctly achieved.
     * This is particularly useful if we retry, if some parts have failed or if the user has deleted part of the state
     */
    status(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { user, environment } = res.locals;
                if (environment.name !== 'dev') {
                    res.status(400).json({ error: { code: 'onboarding_dev_only' } });
                    return;
                }
                const status = yield getOnboardingProgress(user.id);
                if (!status) {
                    res.status(404).send({ error: { code: 'no_onboarding' } });
                    return;
                }
                const payload = {
                    id: status.id,
                    progress: status.progress,
                    connection: false,
                    provider: false,
                    sync: false,
                    records: null
                };
                const { connection_id: connectionId } = req.query;
                if (!connectionId || typeof connectionId !== 'string') {
                    res.status(400).json({ error: { code: 'invalid_query_params' } });
                    return;
                }
                const provider = yield getOnboardingProvider({ envId: environment.id });
                if (!provider) {
                    payload.progress = 0;
                    res.status(200).json(payload);
                    return;
                }
                else {
                    payload.provider = true;
                }
                const connectionExists = yield connectionService.checkIfConnectionExists(connectionId, DEMO_GITHUB_CONFIG_KEY, environment.id);
                if (!connectionExists) {
                    payload.progress = 0;
                    res.status(200).json(payload);
                    return;
                }
                else {
                    payload.connection = true;
                }
                const sync = yield getSyncByIdAndName(connectionExists.id, DEMO_SYNC_NAME);
                if (!sync) {
                    payload.progress = 1;
                    res.status(200).json(payload);
                    return;
                }
                else {
                    payload.sync = true;
                    payload.progress = 3;
                }
                const getRecords = yield recordsService.getRecords({
                    connectionId: connectionExists.id,
                    model: DEMO_MODEL
                });
                if (getRecords.isErr()) {
                    res.status(400).json({ error: { code: 'failed_to_get_records' } });
                    return;
                }
                else {
                    payload.records = getRecords.value.records;
                }
                if (payload.records.length > 0) {
                    payload.progress = status.progress > 4 ? status.progress : 4;
                }
                res.status(200).json(payload);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * Create interactive demo Sync and Action
     * The code can be found in nango-integrations/github
     */
    deploy(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment, account, user } = res.locals;
                void analytics.track(AnalyticsTypes.DEMO_2, account.id, { user_id: user.id });
                const githubDemoSync = flowService.getFlow(DEMO_SYNC_NAME);
                const githubDemoAction = flowService.getFlow(DEMO_ACTION_NAME);
                if (!githubDemoSync || !githubDemoAction) {
                    void analytics.track(AnalyticsTypes.DEMO_2_ERR, account.id, { user_id: user.id });
                    throw new Error('failed_to_find_demo_sync');
                }
                const config = [
                    {
                        provider: 'github',
                        providerConfigKey: DEMO_GITHUB_CONFIG_KEY,
                        type: SyncConfigType.SYNC,
                        name: DEMO_SYNC_NAME,
                        runs: githubDemoSync.runs,
                        auto_start: githubDemoSync.auto_start === true,
                        models: githubDemoSync.returns,
                        endpoints: githubDemoSync.endpoints,
                        model_schema: JSON.stringify(githubDemoSync.models),
                        is_public: true,
                        public_route: 'github',
                        input: ''
                    },
                    {
                        provider: 'github',
                        providerConfigKey: DEMO_GITHUB_CONFIG_KEY,
                        type: SyncConfigType.ACTION,
                        name: DEMO_ACTION_NAME,
                        is_public: true,
                        runs: 'every day',
                        endpoints: githubDemoAction.endpoints,
                        models: [githubDemoAction.returns],
                        model_schema: JSON.stringify(githubDemoAction.models),
                        public_route: 'github',
                        input: githubDemoAction.input
                    }
                ];
                const deploy = yield deployPreBuiltSyncConfig(environment, config, '', logContextGetter, orchestrator);
                if (!deploy.success || deploy.response === null) {
                    void analytics.track(AnalyticsTypes.DEMO_2_ERR, account.id, { user_id: user.id });
                    errorManager.errResFromNangoErr(res, deploy.error);
                    return;
                }
                yield syncManager.triggerIfConnectionsExist(deploy.response.result, environment.id, logContextGetter, orchestrator);
                void analytics.track(AnalyticsTypes.DEMO_2_SUCCESS, account.id, { user_id: user.id });
                res.status(200).json({ success: true });
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * Check the sync completion state.
     * It could be replaced by regular API calls.
     */
    checkSyncCompletion(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!((_a = req.body) === null || _a === void 0 ? void 0 : _a.connectionId) || typeof req.body.connectionId !== 'string') {
                    res.status(400).json({ message: 'connection_id must be a string' });
                    return;
                }
                const { environment, account, user } = res.locals;
                void analytics.track(AnalyticsTypes.DEMO_4, account.id, { user_id: user.id });
                const { success, error, response: status } = yield syncManager.getSyncStatus(environment.id, DEMO_GITHUB_CONFIG_KEY, [DEMO_SYNC_NAME], orchestrator, req.body.connectionId, true);
                if (!success || !status) {
                    void analytics.track(AnalyticsTypes.DEMO_4_ERR, account.id, { user_id: user.id });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                if (status.length <= 0) {
                    // If for any reason we don't have a sync, because of a partial state
                    logger.info(`[demo] no sync were found ${environment.id}`);
                    yield syncManager.runSyncCommand({
                        recordsService,
                        orchestrator,
                        environment,
                        providerConfigKey: DEMO_GITHUB_CONFIG_KEY,
                        syncNames: [DEMO_SYNC_NAME],
                        command: SyncCommand.RUN_FULL,
                        logContextGetter,
                        connectionId: req.body.connectionId,
                        initiator: 'demo'
                    });
                    yield syncManager.runSyncCommand({
                        recordsService,
                        orchestrator,
                        environment,
                        providerConfigKey: DEMO_GITHUB_CONFIG_KEY,
                        syncNames: [DEMO_SYNC_NAME],
                        command: SyncCommand.UNPAUSE,
                        logContextGetter,
                        connectionId: req.body.connectionId,
                        initiator: 'demo'
                    });
                    res.status(200).json({ retry: true });
                    return;
                }
                const [job] = status;
                if (!job) {
                    res.status(400).json({ message: 'No sync job found' });
                    return;
                }
                if (!job.nextScheduledSyncAt && job.jobStatus === SyncStatus.PAUSED) {
                    // If the sync has never run
                    logger.info(`[demo] no job were found ${environment.id}`);
                    yield syncManager.runSyncCommand({
                        recordsService,
                        orchestrator,
                        environment,
                        providerConfigKey: DEMO_GITHUB_CONFIG_KEY,
                        syncNames: [DEMO_SYNC_NAME],
                        command: SyncCommand.RUN_FULL,
                        logContextGetter,
                        connectionId: req.body.connectionId,
                        initiator: 'demo'
                    });
                }
                if (job.jobStatus === SyncStatus.SUCCESS) {
                    void analytics.track(AnalyticsTypes.DEMO_4_SUCCESS, account.id, { user_id: user.id });
                }
                res.status(200).json(job);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * Log the progress, this is merely informative and for BI.
     */
    updateStatus(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { user, account, environment } = res.locals;
                if (environment.name !== 'dev') {
                    res.status(400).json({ message: 'onboarding_dev_only' });
                    return;
                }
                if (typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.progress) !== 'number' || req.body.progress > 6 || req.body.progress < 0) {
                    res.status(400).json({ message: 'Missing progress' });
                    return;
                }
                const progress = req.body.progress;
                const status = yield getOnboardingProgress(user.id);
                if (!status) {
                    res.status(404).send({ message: 'no_onboarding' });
                    return;
                }
                yield updateOnboardingProgress(status.id, progress);
                if (progress === 3 || progress === 6) {
                    void analytics.track(AnalyticsTypes[`DEMO_${progress}`], account.id, { user_id: user.id });
                }
                if (progress === 1) {
                    // Step 1 is actually deploy+frontend auth
                    // Frontend is in a different API so we can't instrument it on the backend so we assume if we progress then step 1 was a success
                    void analytics.track(AnalyticsTypes.DEMO_1_SUCCESS, account.id, { user_id: user.id });
                }
                res.status(200).json({
                    success: true
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * Trigger an action to write a test GitHub issue
     */
    writeGithubIssue(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let logCtx;
            try {
                const { environment, account, user } = res.locals;
                if (environment.name !== 'dev') {
                    res.status(400).json({ message: 'onboarding_dev_only' });
                    return;
                }
                if (!((_a = req.body) === null || _a === void 0 ? void 0 : _a.connectionId) || typeof req.body.connectionId !== 'string') {
                    res.status(400).json({ message: 'connection_id must be a string' });
                    return;
                }
                if (!req.body.title || typeof req.body.title !== 'string') {
                    res.status(400).json({ message: 'title must be a string' });
                    return;
                }
                void analytics.track(AnalyticsTypes.DEMO_5, account.id, { user_id: user.id });
                const syncClient = yield SyncClient.getInstance();
                if (!syncClient) {
                    void analytics.track(AnalyticsTypes.DEMO_5_ERR, account.id, { user_id: user.id });
                    throw new NangoError('failed_to_get_sync_client');
                }
                const { success, error, response: connection } = yield connectionService.getConnection(req.body.connectionId, DEMO_GITHUB_CONFIG_KEY, environment.id);
                if (!success || !connection) {
                    void analytics.track(AnalyticsTypes.DEMO_5_ERR, account.id, { user_id: user.id });
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                const activityLogId = yield createActivityLog({
                    level: 'info',
                    success: false,
                    action: LogActionEnum.ACTION,
                    start: Date.now(),
                    end: Date.now(),
                    timestamp: Date.now(),
                    connection_id: connection.connection_id,
                    provider: 'github',
                    provider_config_key: connection.provider_config_key,
                    environment_id: environment.id,
                    operation_name: DEMO_ACTION_NAME
                });
                if (!activityLogId) {
                    throw new NangoError('failed_to_create_activity_log');
                }
                const syncConfig = yield getSyncConfigRaw({
                    environmentId: environment.id,
                    config_id: connection.config_id,
                    name: DEMO_ACTION_NAME,
                    isAction: true
                });
                if (!syncConfig) {
                    res.status(500).json({ message: 'failed_to_find_action' });
                    return;
                }
                logCtx = yield logContextGetter.create({
                    id: String(activityLogId),
                    operation: { type: 'action' },
                    message: 'Start action',
                    expiresAt: defaultOperationExpiration.action()
                }, {
                    account,
                    environment,
                    user,
                    integration: { id: connection.config_id, name: connection.provider_config_key, provider: 'github' },
                    connection: { id: connection.id, name: connection.connection_id },
                    syncConfig: { id: syncConfig.id, name: syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.sync_name }
                });
                const actionResponse = yield orchestrator.triggerAction({
                    connection,
                    actionName: DEMO_ACTION_NAME,
                    input: { title: req.body.title },
                    activityLogId,
                    environment_id: environment.id,
                    logCtx
                });
                if (actionResponse.isErr()) {
                    void analytics.track(AnalyticsTypes.DEMO_5_ERR, account.id, { user_id: user.id });
                    errorManager.errResFromNangoErr(res, actionResponse.error);
                    yield logCtx.error('Failed to trigger action', { error: actionResponse.error });
                    yield logCtx.failed();
                    return;
                }
                yield logCtx.success();
                void analytics.track(AnalyticsTypes.DEMO_5_SUCCESS, account.id, { user_id: user.id });
                res.status(200).json({ action: actionResponse.value });
            }
            catch (err) {
                if (logCtx) {
                    yield logCtx.error('Failed to trigger action', { error: err });
                    yield logCtx.failed();
                }
                next(err);
            }
        });
    }
}
export default new OnboardingController();
//# sourceMappingURL=onboarding.controller.js.map