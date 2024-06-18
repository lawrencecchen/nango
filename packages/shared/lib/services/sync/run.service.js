var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SyncStatus } from '@nangohq/models/Sync.js';
import { integrationFilesAreRemote, isCloud, getLogger, metrics, stringifyError } from '@nangohq/utils';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { loadLocalNangoConfig, nangoConfigFile } from '../nango-config.service.js';
import { createActivityLogMessage, createActivityLogMessageAndEnd, updateSuccess as updateSuccessActivityLog } from '../activity/activity.service.js';
import { addSyncConfigToJob, updateSyncJobResult, updateSyncJobStatus } from '../sync/job.service.js';
import { errorNotificationService } from '../notification/error.service.js';
import { getSyncConfig } from './config/config.service.js';
import localFileService from '../file/local.service.js';
import * as externalWebhookService from '../external-webhook.service.js';
import { getLastSyncDate, setLastSyncDate } from './sync.service.js';
import environmentService from '../environment.service.js';
import { getApiUrl, isJsOrTsType } from '../../utils/utils.js';
import errorManager, { ErrorSourceEnum } from '../../utils/error.manager.js';
import { NangoError } from '../../utils/error.js';
import telemetry, { LogTypes } from '../../utils/telemetry.js';
const logger = getLogger('run.service');
export default class SyncRun {
    constructor(config) {
        this.logMessages = {
            counts: { updated: 0, added: 0, deleted: 0 },
            messages: []
        };
        this.stubbedMetadata = undefined;
        this.integrationService = config.integrationService;
        this.recordsService = config.recordsService;
        if (config.bigQueryClient) {
            this.bigQueryClient = config.bigQueryClient;
        }
        if (config.dryRunService) {
            this.dryRunService = config.dryRunService;
        }
        this.isAction = config.isAction || false;
        this.isWebhook = config.isWebhook || false;
        this.isPostConnectionScript = config.isPostConnectionScript || false;
        this.nangoConnection = config.nangoConnection;
        this.syncName = config.syncName;
        this.syncType = config.syncType;
        this.isInvokedImmediately = Boolean(config.isAction || config.isWebhook || config.isPostConnectionScript);
        if (config.syncId) {
            this.syncId = config.syncId;
        }
        if (config.syncJobId) {
            this.syncJobId = config.syncJobId;
        }
        this.writeToDb = config.writeToDb;
        if (config.writeToDb) {
            this.slackNotificationService = config.slackService;
            this.activityLogId = config.activityLogId;
            this.logCtx = config.logCtx;
            this.sendSyncWebhook = config.sendSyncWebhook;
        }
        if (config.loadLocation) {
            this.loadLocation = config.loadLocation;
        }
        if (config.debug) {
            this.debug = config.debug;
        }
        if (config.input) {
            this.input = config.input;
        }
        if (config.provider) {
            this.provider = config.provider;
        }
        if (config.logMessages) {
            this.logMessages = config.logMessages;
        }
        if (config.stubbedMetadata) {
            this.stubbedMetadata = config.stubbedMetadata;
        }
        if (config.temporalContext) {
            this.temporalContext = config.temporalContext;
        }
        if (config.fileLocation) {
            this.fileLocation = config.fileLocation;
        }
    }
    run(optionalLastSyncDate, bypassEnvironment, optionalSecretKey, optionalHost) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.debug) {
                const content = this.loadLocation ? `Looking for a local nango config at ${this.loadLocation}` : `Looking for a sync config for ${this.syncName}`;
                if (this.writeToDb) {
                    yield createActivityLogMessage({
                        level: 'debug',
                        environment_id: this.nangoConnection.environment_id,
                        activity_log_id: this.activityLogId,
                        timestamp: Date.now(),
                        content
                    });
                    yield ((_a = this.logCtx) === null || _a === void 0 ? void 0 : _a.debug(content));
                }
                else {
                    logger.info(content);
                }
            }
            let nangoConfig = this.loadLocation
                ? yield loadLocalNangoConfig(this.loadLocation)
                : yield getSyncConfig(this.nangoConnection, this.syncName, this.isAction);
            if (!nangoConfig && this.isPostConnectionScript) {
                nangoConfig = {
                    integrations: {
                        [this.nangoConnection.provider_config_key]: {
                            'post-connection-scripts': [this.syncName]
                        }
                    },
                    models: {}
                };
            }
            if (!nangoConfig) {
                const message = `No ${this.isAction ? 'action' : 'sync'} configuration was found for ${this.syncName}.`;
                if (this.activityLogId) {
                    yield this.reportFailureForResults({
                        content: message,
                        runTime: 0,
                        models: ['n/a'],
                        syncStartDate: new Date(),
                        error: {
                            type: 'no_sync_config',
                            description: message
                        }
                    });
                }
                else {
                    logger.error(message);
                }
                const errorType = this.determineErrorType();
                return { success: false, error: new NangoError(errorType, message, 404), response: false };
            }
            const { integrations, models: configModels } = nangoConfig;
            let result = true;
            if (!integrations[this.nangoConnection.provider_config_key] && !this.writeToDb) {
                const message = `The connection you provided which applies to integration "${this.nangoConnection.provider_config_key}" does not match any integration in the ${nangoConfigFile}`;
                const errorType = this.determineErrorType();
                return { success: false, error: new NangoError(errorType, message, 404), response: false };
            }
            // if there is a matching customer integration code for the provider config key then run it
            if (integrations[this.nangoConnection.provider_config_key] || this.isPostConnectionScript) {
                let environment = null;
                let account = null;
                if (!bypassEnvironment) {
                    const environmentAndAccountLookup = yield environmentService.getAccountAndEnvironment({ environmentId: this.nangoConnection.environment_id });
                    if (!environmentAndAccountLookup) {
                        const message = `No environment was found for ${this.nangoConnection.environment_id}. The sync cannot continue without a valid environment`;
                        yield this.reportFailureForResults({
                            content: message,
                            runTime: 0,
                            models: ['n/a'],
                            syncStartDate: new Date(),
                            error: {
                                type: 'no_environment',
                                description: message
                            }
                        });
                        const errorType = this.determineErrorType();
                        return { success: false, error: new NangoError(errorType, message, 404), response: false };
                    }
                    ({ environment, account } = environmentAndAccountLookup);
                    this.account = account;
                    this.environment = environment;
                }
                if (!this.nangoConnection.account_id && (environment === null || environment === void 0 ? void 0 : environment.account_id) !== null && (environment === null || environment === void 0 ? void 0 : environment.account_id) !== undefined) {
                    this.nangoConnection.account_id = environment.account_id;
                }
                let secretKey = optionalSecretKey || (environment ? environment.secret_key : '');
                if (!isCloud) {
                    if (process.env['NANGO_SECRET_KEY_DEV'] && (environment === null || environment === void 0 ? void 0 : environment.name) === 'dev') {
                        secretKey = process.env['NANGO_SECRET_KEY_DEV'];
                    }
                    if (process.env['NANGO_SECRET_KEY_PROD'] && (environment === null || environment === void 0 ? void 0 : environment.name) === 'prod') {
                        secretKey = process.env['NANGO_SECRET_KEY_PROD'];
                    }
                }
                const providerConfigKey = this.nangoConnection.provider_config_key;
                const syncObject = integrations[providerConfigKey];
                let syncData;
                if (this.isAction) {
                    syncData = (syncObject['actions'] ? syncObject['actions'][this.syncName] : syncObject[this.syncName]);
                }
                else if (this.isPostConnectionScript) {
                    syncData = {
                        runs: 'every 5 minutes',
                        returns: [],
                        track_deletes: false,
                        is_public: false,
                        fileLocation: this.fileLocation
                    };
                }
                else {
                    syncData = (syncObject['syncs'] ? syncObject['syncs'][this.syncName] : syncObject[this.syncName]);
                }
                const { returns: models, track_deletes: trackDeletes, is_public: isPublic } = syncData;
                if (syncData.sync_config_id) {
                    if (this.debug) {
                        const content = `Sync config id is ${syncData.sync_config_id}`;
                        if (this.writeToDb) {
                            yield createActivityLogMessage({
                                level: 'debug',
                                environment_id: this.nangoConnection.environment_id,
                                activity_log_id: this.activityLogId,
                                timestamp: Date.now(),
                                content
                            });
                            yield ((_b = this.logCtx) === null || _b === void 0 ? void 0 : _b.debug(content));
                        }
                        else {
                            logger.info(content);
                        }
                    }
                    if (this.syncJobId) {
                        yield addSyncConfigToJob(this.syncJobId, syncData.sync_config_id);
                    }
                }
                if (!isCloud && !integrationFilesAreRemote && !isPublic) {
                    const { path: integrationFilePath, result: integrationFileResult } = localFileService.checkForIntegrationDistFile(this.syncName, providerConfigKey, this.loadLocation);
                    if (!integrationFileResult) {
                        const message = `Integration was attempted to run for ${this.syncName} but no integration file was found at ${integrationFilePath}.`;
                        yield this.reportFailureForResults({
                            content: message,
                            runTime: 0,
                            models,
                            syncStartDate: new Date(),
                            error: {
                                type: 'no_integration_file',
                                description: message
                            }
                        });
                        const errorType = this.determineErrorType();
                        return { success: false, error: new NangoError(errorType, message, 404), response: false };
                    }
                }
                let lastSyncDate = null;
                if (!this.isInvokedImmediately) {
                    if (!this.writeToDb) {
                        lastSyncDate = optionalLastSyncDate;
                    }
                    else {
                        lastSyncDate = yield getLastSyncDate(this.syncId);
                    }
                }
                // TODO this only works for dryrun at the moment
                if (this.isAction && syncData.input) {
                    const { input: configInput } = syncData;
                    if (isJsOrTsType(configInput)) {
                        if (typeof this.input !== configInput) {
                            const message = `The input provided of ${this.input} for ${this.syncName} is not of type ${configInput}`;
                            yield this.reportFailureForResults({
                                content: message,
                                runTime: 0,
                                models,
                                syncStartDate: new Date(),
                                error: {
                                    type: 'input_type_mismatch',
                                    description: message
                                }
                            });
                            return { success: false, error: new NangoError('action_script_failure', message, 500), response: false };
                        }
                    }
                    else {
                        if (configModels[configInput]) {
                            // TODO use joi or zod to validate the input dynamically
                        }
                    }
                }
                const nangoProps = {
                    host: optionalHost || getApiUrl(),
                    accountId: (_c = this.account) === null || _c === void 0 ? void 0 : _c.id,
                    connectionId: String(this.nangoConnection.connection_id),
                    environmentId: this.nangoConnection.environment_id,
                    environmentName: (_d = this.environment) === null || _d === void 0 ? void 0 : _d.name,
                    providerConfigKey: String(this.nangoConnection.provider_config_key),
                    provider: this.provider,
                    activityLogId: this.activityLogId,
                    secretKey,
                    nangoConnectionId: this.nangoConnection.id,
                    syncId: this.syncId,
                    syncJobId: this.syncJobId,
                    lastSyncDate: lastSyncDate,
                    dryRun: !this.writeToDb,
                    attributes: syncData.attributes,
                    track_deletes: trackDeletes,
                    logMessages: this.logMessages,
                    stubbedMetadata: this.stubbedMetadata
                };
                if (this.dryRunService) {
                    nangoProps.dryRunService = this.dryRunService;
                }
                if (this.debug) {
                    const content = `Last sync date is ${lastSyncDate}`;
                    if (this.writeToDb) {
                        yield createActivityLogMessage({
                            level: 'debug',
                            environment_id: this.nangoConnection.environment_id,
                            activity_log_id: this.activityLogId,
                            timestamp: Date.now(),
                            content
                        });
                        yield ((_e = this.logCtx) === null || _e === void 0 ? void 0 : _e.debug(content));
                    }
                    else {
                        logger.info(content);
                    }
                }
                const startTime = Date.now();
                const syncStartDate = new Date();
                try {
                    result = true;
                    if (typeof nangoProps.accountId === 'number') {
                        metrics.increment(getMetricType(this.determineExecutionType()), 1, { accountId: nangoProps.accountId });
                    }
                    const { success, error, response: userDefinedResults } = yield this.integrationService.runScript({
                        syncName: this.syncName,
                        syncId: this.syncId ||
                            `${this.syncName}-${this.nangoConnection.environment_id}-${this.nangoConnection.provider_config_key}-${this.nangoConnection.connection_id}`,
                        activityLogId: this.activityLogId,
                        nangoProps,
                        integrationData: syncData,
                        environmentId: this.nangoConnection.environment_id,
                        writeToDb: this.writeToDb,
                        isInvokedImmediately: this.isInvokedImmediately,
                        isWebhook: this.isWebhook,
                        optionalLoadLocation: this.loadLocation,
                        input: this.input,
                        temporalContext: this.temporalContext
                    });
                    if (!success || (error && userDefinedResults === null)) {
                        const message = `The integration was run but there was a problem in retrieving the results from the script "${this.syncName}"${syncData.version ? ` version: ${syncData.version}` : ''}`;
                        const runTime = (Date.now() - startTime) / 1000;
                        if (error.type === 'script_cancelled') {
                            yield this.reportFailureForResults({
                                content: error.message,
                                runTime,
                                isCancel: true,
                                models,
                                syncStartDate,
                                error: {
                                    type: 'script_cancelled',
                                    description: error.message
                                }
                            });
                        }
                        else {
                            yield this.reportFailureForResults({
                                content: message,
                                runTime,
                                models,
                                syncStartDate,
                                error: {
                                    type: 'script_error',
                                    description: message
                                }
                            });
                        }
                        return { success: false, error, response: false };
                    }
                    if (!this.writeToDb) {
                        return userDefinedResults;
                    }
                    const totalRunTime = (Date.now() - startTime) / 1000;
                    if (this.isAction) {
                        const content = `${this.syncName} action was run successfully and results are being sent synchronously.`;
                        yield updateSuccessActivityLog(this.activityLogId, true);
                        yield createActivityLogMessageAndEnd({
                            level: 'info',
                            environment_id: this.nangoConnection.environment_id,
                            activity_log_id: this.activityLogId,
                            timestamp: Date.now(),
                            content
                        });
                        yield ((_f = this.logCtx) === null || _f === void 0 ? void 0 : _f.info(content));
                        yield ((_g = this.slackNotificationService) === null || _g === void 0 ? void 0 : _g.removeFailingConnection(this.nangoConnection, this.syncName, this.syncType, this.activityLogId, this.nangoConnection.environment_id, this.provider));
                        yield this.finishFlow(models, syncStartDate, syncData.version, totalRunTime, trackDeletes);
                        return { success: true, error: null, response: userDefinedResults };
                    }
                    if (this.isPostConnectionScript) {
                        const content = `The post connection script "${this.syncName}" has been run successfully.`;
                        yield updateSuccessActivityLog(this.activityLogId, true);
                        yield createActivityLogMessageAndEnd({
                            level: 'info',
                            environment_id: this.nangoConnection.environment_id,
                            activity_log_id: this.activityLogId,
                            timestamp: Date.now(),
                            content
                        });
                        yield ((_h = this.logCtx) === null || _h === void 0 ? void 0 : _h.info(content));
                        yield ((_j = this.logCtx) === null || _j === void 0 ? void 0 : _j.success());
                        return { success: true, error: null, response: userDefinedResults };
                    }
                    yield this.finishFlow(models, syncStartDate, syncData.version, totalRunTime, trackDeletes);
                    return { success: true, error: null, response: true };
                }
                catch (e) {
                    result = false;
                    const errorMessage = stringifyError(e, { pretty: true });
                    yield this.reportFailureForResults({
                        content: `The ${this.syncType} "${this.syncName}"${syncData.version ? ` version: ${syncData.version}` : ''} sync did not complete successfully and has the following error: ${errorMessage}`,
                        runTime: (Date.now() - startTime) / 1000,
                        models,
                        syncStartDate,
                        error: {
                            type: 'script_error',
                            description: errorMessage
                        }
                    });
                    const errorType = this.determineErrorType();
                    return { success: false, error: new NangoError(errorType, errorMessage), response: result };
                }
                finally {
                    if (!this.isInvokedImmediately) {
                        const totalRunTime = (Date.now() - startTime) / 1000;
                        metrics.duration(metrics.Types.SYNC_TRACK_RUNTIME, totalRunTime);
                    }
                }
            }
            return { success: true, error: null, response: result };
        });
    }
    finishFlow(models, syncStartDate, version, totalRunTime, trackDeletes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let i = 0;
            if (!this.isAction && !this.isWebhook && !this.isPostConnectionScript) {
                for (const model of models) {
                    let deletedKeys = [];
                    if (trackDeletes) {
                        deletedKeys = yield this.recordsService.markNonCurrentGenerationRecordsAsDeleted({
                            connectionId: this.nangoConnection.id,
                            model,
                            syncId: this.syncId,
                            generation: this.syncJobId
                        });
                    }
                    yield this.reportResults(model, { addedKeys: [], updatedKeys: [], deletedKeys, nonUniqueKeys: [] }, i, models.length, syncStartDate, version, totalRunTime);
                    i++;
                }
                yield ((_a = this.logCtx) === null || _a === void 0 ? void 0 : _a.success());
            }
            // we only want to report to bigquery once if it is a multi model sync
            if (this.bigQueryClient && this.account && this.environment) {
                void this.bigQueryClient.insert({
                    executionType: this.determineExecutionType(),
                    connectionId: this.nangoConnection.connection_id,
                    internalConnectionId: this.nangoConnection.id,
                    accountId: this.account.id,
                    accountName: this.account.name,
                    scriptName: this.syncName,
                    scriptType: this.syncType,
                    environmentId: this.nangoConnection.environment_id,
                    environmentName: this.environment.name,
                    providerConfigKey: this.nangoConnection.provider_config_key,
                    status: 'success',
                    syncId: this.syncId,
                    content: `The ${this.syncType} "${this.syncName}" ${this.determineExecutionType()} has been completed successfully.`,
                    runTimeInSeconds: totalRunTime,
                    createdAt: Date.now()
                });
            }
        });
    }
    reportResults(model, responseResults, index, numberOfModels, syncStartDate, version, totalRunTime) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.writeToDb || !this.activityLogId || !this.syncJobId) {
                return;
            }
            if (index === numberOfModels - 1) {
                yield updateSyncJobStatus(this.syncJobId, SyncStatus.SUCCESS);
                yield updateSuccessActivityLog(this.activityLogId, true);
                // set the last sync date to when the sync started in case
                // the sync is long running to make sure we wouldn't miss
                // any changes while the sync is running
                if (!this.isWebhook && !this.isPostConnectionScript) {
                    yield setLastSyncDate(this.syncId, syncStartDate);
                    yield ((_a = this.slackNotificationService) === null || _a === void 0 ? void 0 : _a.removeFailingConnection(this.nangoConnection, this.syncName, this.determineExecutionType(), this.activityLogId, this.nangoConnection.environment_id, this.provider));
                }
                if (this.syncId && this.nangoConnection.id) {
                    yield errorNotificationService.sync.clear({
                        sync_id: this.syncId,
                        connection_id: this.nangoConnection.id
                    });
                }
            }
            const updatedResults = {
                [model]: {
                    added: responseResults.addedKeys.length,
                    updated: responseResults.updatedKeys.length,
                    deleted: (_b = responseResults.deletedKeys) === null || _b === void 0 ? void 0 : _b.length
                }
            };
            const syncResult = yield updateSyncJobResult(this.syncJobId, updatedResults, model);
            if (!syncResult) {
                yield this.reportFailureForResults({
                    content: `The sync job ${this.syncJobId} could not be updated with the results for the model ${model}.`,
                    runTime: totalRunTime,
                    models: [model],
                    syncStartDate,
                    error: {
                        type: 'sync_job_update_failure',
                        description: `The sync job ${this.syncJobId} could not be updated with the results for the model ${model}.`
                    }
                });
                return;
            }
            const { result } = syncResult;
            let added = 0;
            let updated = 0;
            let deleted = 0;
            if (result && result[model]) {
                const modelResult = result[model];
                added = modelResult.added;
                updated = modelResult.updated;
                deleted = modelResult.deleted;
            }
            else {
                // legacy json structure
                added = (_c = result === null || result === void 0 ? void 0 : result['added']) !== null && _c !== void 0 ? _c : 0;
                updated = (_d = result === null || result === void 0 ? void 0 : result['updated']) !== null && _d !== void 0 ? _d : 0;
                deleted = (_e = result === null || result === void 0 ? void 0 : result['deleted']) !== null && _e !== void 0 ? _e : 0;
            }
            const successMessage = `The ${this.syncType} "${this.syncName}" sync has been completed to the ${model} model.` +
                (version ? ` The version integration script version ran was ${version}.` : '');
            const addedMessage = added > 0 ? `${added} added record${added === 1 ? '' : 's'}` : '';
            const updatedMessage = updated > 0 ? `${updated} updated record${updated === 1 ? '' : 's'}` : '';
            const deletedMessage = deleted > 0 ? `${deleted} deleted record${deleted === 1 ? '' : 's'}` : '';
            const resultMessageParts = [addedMessage, updatedMessage, deletedMessage].filter(Boolean);
            const resultMessage = resultMessageParts.length
                ? `The result was ${resultMessageParts.join(', ')}.`
                : 'The external API returned did not return any new or updated data so nothing was inserted or updated.';
            const content = `${successMessage} ${resultMessage}`;
            const results = {
                added,
                updated,
                deleted
            };
            if (this.environment && this.sendSyncWebhook) {
                const webhookSettings = yield externalWebhookService.get(this.environment.id);
                void this.sendSyncWebhook({
                    connection: this.nangoConnection,
                    environment: this.environment,
                    webhookSettings,
                    syncName: this.syncName,
                    model,
                    now: syncStartDate,
                    success: true,
                    responseResults: results,
                    operation: this.syncType === 'INITIAL' ? 'INITIAL' : 'INCREMENTAL',
                    activityLogId: this.activityLogId,
                    logCtx: this.logCtx
                });
            }
            if (index === numberOfModels - 1) {
                yield createActivityLogMessageAndEnd({
                    level: 'info',
                    environment_id: this.nangoConnection.environment_id,
                    activity_log_id: this.activityLogId,
                    timestamp: Date.now(),
                    content
                });
                yield ((_f = this.logCtx) === null || _f === void 0 ? void 0 : _f.info(content));
            }
            else {
                yield createActivityLogMessage({
                    level: 'info',
                    environment_id: this.nangoConnection.environment_id,
                    activity_log_id: this.activityLogId,
                    timestamp: Date.now(),
                    content
                });
                yield ((_g = this.logCtx) === null || _g === void 0 ? void 0 : _g.info(content));
            }
            yield telemetry.log(LogTypes.SYNC_SUCCESS, content, LogActionEnum.SYNC, {
                model,
                environmentId: String(this.nangoConnection.environment_id),
                responseResults: JSON.stringify(responseResults),
                numberOfModels: String(numberOfModels),
                version,
                syncName: this.syncName,
                connectionDetails: JSON.stringify(this.nangoConnection),
                connectionId: this.nangoConnection.connection_id,
                providerConfigKey: this.nangoConnection.provider_config_key,
                syncId: this.syncId,
                syncJobId: String(this.syncJobId),
                syncType: this.syncType,
                totalRunTime: `${totalRunTime} seconds`,
                debug: String(this.debug)
            }, `syncId:${this.syncId}`);
        });
    }
    reportFailureForResults({ content, runTime, isCancel, models, syncStartDate, error }) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.writeToDb) {
                return;
            }
            if (this.bigQueryClient && this.account && this.environment) {
                void this.bigQueryClient.insert({
                    executionType: this.determineExecutionType(),
                    connectionId: this.nangoConnection.connection_id,
                    internalConnectionId: this.nangoConnection.id,
                    accountId: this.account.id,
                    accountName: this.account.name,
                    scriptName: this.syncName,
                    scriptType: this.syncType,
                    environmentId: this.nangoConnection.environment_id,
                    environmentName: this.environment.name,
                    providerConfigKey: this.nangoConnection.provider_config_key,
                    status: 'failed',
                    syncId: this.syncId,
                    content,
                    runTimeInSeconds: runTime,
                    createdAt: Date.now()
                });
            }
            if (!this.isWebhook && !this.isPostConnectionScript) {
                try {
                    yield ((_a = this.slackNotificationService) === null || _a === void 0 ? void 0 : _a.reportFailure(this.nangoConnection, this.syncName, this.determineExecutionType(), this.activityLogId, this.nangoConnection.environment_id, this.provider));
                }
                catch (_g) {
                    errorManager.report('slack notification service reported a failure', {
                        environmentId: this.nangoConnection.environment_id,
                        source: ErrorSourceEnum.PLATFORM,
                        operation: LogActionEnum.SYNC,
                        metadata: {
                            syncName: this.syncName,
                            connectionDetails: this.nangoConnection,
                            syncId: this.syncId,
                            syncJobId: this.syncJobId,
                            syncType: this.syncType,
                            debug: this.debug
                        }
                    });
                }
            }
            if (!this.activityLogId || !this.syncJobId) {
                logger.error(content);
                return;
            }
            if (this.environment && this.sendSyncWebhook) {
                const webhookSettings = yield externalWebhookService.get(this.environment.id);
                void this.sendSyncWebhook({
                    connection: this.nangoConnection,
                    environment: this.environment,
                    webhookSettings,
                    syncName: this.syncName,
                    model: models.join(','),
                    success: false,
                    error,
                    now: syncStartDate,
                    operation: this.syncType === 'INITIAL' ? 'INITIAL' : 'INCREMENTAL',
                    activityLogId: this.activityLogId,
                    logCtx: this.logCtx
                });
            }
            yield updateSuccessActivityLog(this.activityLogId, false);
            yield updateSyncJobStatus(this.syncJobId, SyncStatus.STOPPED);
            yield createActivityLogMessageAndEnd({
                level: 'error',
                environment_id: this.nangoConnection.environment_id,
                activity_log_id: this.activityLogId,
                timestamp: Date.now(),
                content
            });
            yield ((_b = this.logCtx) === null || _b === void 0 ? void 0 : _b.error(content));
            if (isCancel) {
                yield ((_c = this.logCtx) === null || _c === void 0 ? void 0 : _c.cancel());
            }
            else {
                yield ((_d = this.logCtx) === null || _d === void 0 ? void 0 : _d.failed());
            }
            errorManager.report(content, {
                environmentId: this.nangoConnection.environment_id,
                source: ErrorSourceEnum.CUSTOMER,
                operation: LogActionEnum.SYNC,
                metadata: {
                    syncName: this.syncName,
                    connectionDetails: this.nangoConnection,
                    syncId: this.syncId,
                    syncJobId: this.syncJobId,
                    syncType: this.syncType,
                    debug: this.debug
                }
            });
            yield telemetry.log(LogTypes.SYNC_FAILURE, content, LogActionEnum.SYNC, {
                environmentId: String(this.nangoConnection.environment_id),
                syncName: this.syncName,
                connectionDetails: JSON.stringify(this.nangoConnection),
                connectionId: this.nangoConnection.connection_id,
                providerConfigKey: this.nangoConnection.provider_config_key,
                syncId: this.syncId,
                syncJobId: String(this.syncJobId),
                syncType: this.syncType,
                debug: String(this.debug),
                level: 'error'
            }, `syncId:${this.syncId}`);
            if (this.nangoConnection.id && this.activityLogId && ((_e = this.logCtx) === null || _e === void 0 ? void 0 : _e.id) && this.syncId) {
                yield errorNotificationService.sync.create({
                    action: 'run',
                    type: 'sync',
                    sync_id: this.syncId,
                    connection_id: this.nangoConnection.id,
                    activity_log_id: this.activityLogId,
                    log_id: (_f = this.logCtx) === null || _f === void 0 ? void 0 : _f.id,
                    active: true
                });
            }
        });
    }
    determineExecutionType() {
        if (this.isAction) {
            return 'action';
        }
        else if (this.isPostConnectionScript) {
            return 'post-connection-script';
        }
        else if (this.isWebhook) {
            return 'webhook';
        }
        else {
            return 'sync';
        }
    }
    determineErrorType() {
        return this.determineExecutionType() + '_script_failure';
    }
}
function getMetricType(type) {
    switch (type) {
        case 'sync':
            return metrics.Types.SYNC_EXECUTION;
        case 'action':
            return metrics.Types.ACTION_EXECUTION;
        case 'webhook':
            return metrics.Types.WEBHOOK_EXECUTION;
        default:
            return metrics.Types.SYNC_EXECUTION;
    }
}
//# sourceMappingURL=run.service.js.map