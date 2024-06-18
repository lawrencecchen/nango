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
import { schema, dbNamespace } from '@nangohq/database';
import { env } from '@nangohq/utils';
import configService from '../../config.service.js';
import remoteFileService from '../../file/remote.service.js';
import environmentService from '../../environment.service.js';
import accountService from '../../account.service.js';
import { createActivityLog, createActivityLogMessage, updateSuccess as updateSuccessActivityLog, updateProviderConfigKey, createActivityLogMessageAndEnd, createActivityLogDatabaseErrorMessageAndEnd } from '../../activity/activity.service.js';
import { getSyncsByProviderConfigAndSyncName } from '../sync.service.js';
import connectionService from '../../connection.service.js';
import { LogActionEnum } from '../@nangohq/models/Activity.js';
import { postConnectionScriptService } from '../post-connection.service.js';
import { SyncConfigType } from '../@nangohq/models/Sync.js';
import { NangoError } from '../../../utils/error.js';
import telemetry, { LogTypes } from '../../../utils/telemetry.js';
import { nangoConfigFile } from '../../nango-config.service.js';
import { getSyncAndActionConfigByParams, increment, getSyncAndActionConfigsBySyncNameAndConfigId } from './config.service.js';
const TABLE = dbNamespace + 'sync_configs';
const ENDPOINT_TABLE = dbNamespace + 'sync_endpoints';
const nameOfType = 'sync/action';
export function deploy({ environment, account, flows, postConnectionScriptsByProvider, nangoYamlBody, logContextGetter, orchestrator, debug }) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertData = [];
        const providers = flows.map((flow) => flow.providerConfigKey);
        const providerConfigKeys = [...new Set(providers)];
        const idsToMarkAsInvactive = [];
        const log = {
            level: 'info',
            success: null,
            action: LogActionEnum.SYNC_DEPLOY,
            start: Date.now(),
            end: Date.now(),
            timestamp: Date.now(),
            connection_id: null,
            provider: null,
            provider_config_key: `${flows.length} sync${flows.length === 1 ? '' : 's'} from ${providerConfigKeys.length} integration${providerConfigKeys.length === 1 ? '' : 's'}`,
            environment_id: environment.id,
            operation_name: LogActionEnum.SYNC_DEPLOY
        };
        let flowsWithVersions = flows.map((flow) => {
            const { fileBody: _fileBody, model_schema } = flow, rest = __rest(flow, ["fileBody", "model_schema"]);
            const modelSchema = JSON.parse(model_schema);
            return Object.assign(Object.assign({}, rest), { model_schema: modelSchema });
        });
        const activityLogId = yield createActivityLog(log);
        const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'deploy', action: 'custom' }, message: 'Deploying custom syncs' }, { account, environment });
        if (nangoYamlBody) {
            yield remoteFileService.upload(nangoYamlBody, `${env}/account/${account.id}/environment/${environment.id}/${nangoConfigFile}`, environment.id);
        }
        const flowReturnData = [];
        for (const flow of flows) {
            const { success, error, response } = yield compileDeployInfo({
                flow,
                flowsWithVersions,
                idsToMarkAsInvactive,
                insertData,
                flowReturnData,
                env,
                environment_id: environment.id,
                accountId: account.id,
                activityLogId: activityLogId,
                debug: Boolean(debug),
                logCtx,
                orchestrator
            });
            if (!success || !response) {
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `Failed to deploy`
                });
                yield logCtx.error('Failed to deploy', { error });
                yield logCtx.failed();
                yield updateSuccessActivityLog(activityLogId, false);
                return { success, error, response: null };
            }
            flowsWithVersions = response;
        }
        if (insertData.length === 0) {
            if (debug) {
                yield createActivityLogMessage({
                    environment_id: environment.id,
                    level: 'debug',
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `All syncs were deleted.`
                });
                yield logCtx.debug('All syncs were deleted');
            }
            yield updateSuccessActivityLog(activityLogId, true);
            yield logCtx.success();
            return { success: true, error: null, response: { result: [], activityLogId } };
        }
        try {
            const flowIds = yield schema().from(TABLE).insert(insertData).returning('id');
            const endpoints = [];
            flowIds.forEach((row, index) => {
                const flow = flows[index];
                if (flow.endpoints && row.id) {
                    flow.endpoints.forEach((endpoint, endpointIndex) => {
                        const method = Object.keys(endpoint)[0];
                        const path = endpoint[method];
                        const res = {
                            sync_config_id: row.id,
                            method,
                            path
                        };
                        const model = flow.models[endpointIndex];
                        if (model) {
                            res.model = model;
                        }
                        endpoints.push(res);
                    });
                }
            });
            if (endpoints.length > 0) {
                yield schema().from(ENDPOINT_TABLE).insert(endpoints);
            }
            if (postConnectionScriptsByProvider.length > 0) {
                yield postConnectionScriptService.update({ environment, account, postConnectionScriptsByProvider });
            }
            if (idsToMarkAsInvactive.length > 0) {
                yield schema().from(TABLE).update({ active: false }).whereIn('id', idsToMarkAsInvactive);
            }
            yield updateSuccessActivityLog(activityLogId, true);
            yield createActivityLogMessageAndEnd({
                level: 'info',
                environment_id: environment.id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `Successfully deployed the ${nameOfType}${flowsWithVersions.length > 1 ? 's' : ''} ${JSON.stringify(flowsWithVersions, null, 2)}`
            });
            yield logCtx.info(`Successfully deployed ${flowsWithVersions.length} script${flowsWithVersions.length > 1 ? 's' : ''}`, {
                nameOfType,
                count: flowsWithVersions.length,
                syncNames: flowsWithVersions.map((flow) => flow['syncName']),
                flows: flowsWithVersions
            });
            yield logCtx.success();
            const shortContent = `Successfully deployed the ${nameOfType}${flowsWithVersions.length > 1 ? 's' : ''} (${flowsWithVersions
                .map((flow) => flow['syncName'])
                .join(', ')}).`;
            yield telemetry.log(LogTypes.SYNC_DEPLOY_SUCCESS, shortContent, LogActionEnum.SYNC_DEPLOY, {
                environmentId: String(environment.id),
                syncName: flowsWithVersions.map((flow) => flow['syncName']).join(', '),
                accountId: String(account.id),
                providers: providers.join(', ')
            }, 'deploy_type:custom');
            return { success: true, error: null, response: { result: flowReturnData, activityLogId } };
        }
        catch (e) {
            yield updateSuccessActivityLog(activityLogId, false);
            yield createActivityLogDatabaseErrorMessageAndEnd(`Failed to deploy the syncs (${JSON.stringify(flowsWithVersions, null, 2)}).`, e, activityLogId, environment.id);
            yield logCtx.error('Failed to deploy syncs', { error: e });
            yield logCtx.failed();
            const shortContent = `Failure to deploy the syncs (${flowsWithVersions.map((flow) => flow.syncName).join(', ')}).`;
            yield telemetry.log(LogTypes.SYNC_DEPLOY_FAILURE, shortContent, LogActionEnum.SYNC_DEPLOY, {
                environmentId: String(environment.id),
                syncName: flowsWithVersions.map((flow) => flow.syncName).join(', '),
                accountId: String(account.id),
                providers: providers.join(', '),
                level: 'error'
            }, 'deploy_type:custom');
            throw new NangoError('error_creating_sync_config');
        }
    });
}
export function deployPreBuilt(environment, configs, nangoYamlBody, logContextGetter, orchestrator) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const [firstConfig] = configs;
        const log = {
            level: 'info',
            success: null,
            action: LogActionEnum.SYNC_DEPLOY,
            start: Date.now(),
            end: Date.now(),
            timestamp: Date.now(),
            connection_id: null,
            provider: configs.length === 1 && (firstConfig === null || firstConfig === void 0 ? void 0 : firstConfig.provider) ? firstConfig.provider : null,
            provider_config_key: '',
            environment_id: environment.id,
            operation_name: LogActionEnum.SYNC_DEPLOY
        };
        const account = (yield environmentService.getAccountFromEnvironment(environment.id));
        const providerConfigKeys = [];
        const activityLogId = yield createActivityLog(log);
        const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'deploy', action: 'prebuilt' }, message: 'Deploying pre-built flow' }, { account, environment });
        const idsToMarkAsInvactive = [];
        const insertData = [];
        let nango_config_id;
        let provider_config_key;
        if (nangoYamlBody) {
            yield remoteFileService.upload(nangoYamlBody, `${env}/account/${account.id}/environment/${environment.id}/${nangoConfigFile}`, environment.id);
        }
        else {
            // this is a public template so copy it from the public location
            yield remoteFileService.copy(firstConfig === null || firstConfig === void 0 ? void 0 : firstConfig.public_route, nangoConfigFile, `${env}/account/${account.id}/environment/${environment.id}/${nangoConfigFile}`, environment.id, nangoConfigFile);
        }
        const flowReturnData = [];
        for (const config of configs) {
            if (!config.providerConfigKey) {
                const providerLookup = yield configService.getConfigIdByProvider(config.provider, environment.id);
                if (!providerLookup) {
                    const error = new NangoError('provider_not_on_account');
                    return { success: false, error, response: null };
                }
                ({ id: nango_config_id, unique_key: provider_config_key } = providerLookup);
            }
            else {
                const providerConfig = yield configService.getProviderConfig(config.providerConfigKey, environment.id);
                if (!providerConfig) {
                    const error = new NangoError('unknown_provider_config', { providerConfigKey: config.providerConfigKey });
                    return { success: false, error, response: null };
                }
                provider_config_key = config.providerConfigKey;
                nango_config_id = providerConfig.id;
            }
            providerConfigKeys.push(provider_config_key);
            const { type, models, auto_start, runs, model_schema: model_schema_string, is_public, attributes = {}, metadata = {} } = config;
            let { input } = config;
            const sync_name = config.name || config.syncName;
            if (type === SyncConfigType.SYNC && !runs) {
                const error = new NangoError('missing_required_fields_on_deploy');
                return { success: false, error, response: null };
            }
            if (!sync_name || !nango_config_id) {
                const error = new NangoError('missing_required_fields_on_deploy');
                return { success: false, error, response: null };
            }
            const previousSyncAndActionConfig = yield getSyncAndActionConfigByParams(environment.id, sync_name, provider_config_key);
            let bumpedVersion = '';
            if (previousSyncAndActionConfig) {
                bumpedVersion = increment(previousSyncAndActionConfig.version).toString();
                if (runs) {
                    const syncsConfig = yield getSyncsByProviderConfigAndSyncName(environment.id, provider_config_key, sync_name);
                    for (const syncConfig of syncsConfig) {
                        const interval = syncConfig.frequency || runs;
                        const res = yield orchestrator.updateSyncFrequency({
                            syncId: syncConfig.id,
                            interval,
                            syncName: sync_name,
                            environmentId: environment.id,
                            activityLogId: activityLogId,
                            logCtx
                        });
                        if (res.isErr()) {
                            const error = new NangoError('error_updating_sync_schedule_frequency', {
                                syncId: syncConfig.id,
                                environmentId: environment.id,
                                interval
                            });
                            return { success: false, error, response: null };
                        }
                    }
                }
            }
            const version = bumpedVersion || '0.0.1';
            const jsFile = typeof config.fileBody === 'string' ? config.fileBody : (_a = config.fileBody) === null || _a === void 0 ? void 0 : _a.js;
            let file_location = '';
            if (is_public) {
                file_location = (yield remoteFileService.copy(`${config.public_route}/dist`, `${sync_name}-${config.provider}.js`, `${env}/account/${account.id}/environment/${environment.id}/config/${nango_config_id}/${sync_name}-v${version}.js`, environment.id, `${sync_name}-${provider_config_key}.js`));
            }
            else {
                file_location = (yield remoteFileService.upload(jsFile, `${env}/account/${account.id}/environment/${environment.id}/config/${nango_config_id}/${sync_name}-v${version}.js`, environment.id));
            }
            if (!file_location) {
                yield createActivityLogMessageAndEnd({
                    level: 'error',
                    environment_id: environment.id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `There was an error uploading the ${is_public ? 'public template' : ''} file ${sync_name}-v${version}.js`
                });
                yield logCtx.error('There was an error uploading the template', { isPublic: is_public, syncName: sync_name, version });
                yield logCtx.failed();
                throw new NangoError('file_upload_error');
            }
            if (is_public) {
                yield remoteFileService.copy(config.public_route, `${type}s/${sync_name}.ts`, `${env}/account/${account.id}/environment/${environment.id}/config/${nango_config_id}/${sync_name}.ts`, environment.id, `${sync_name}.ts`);
            }
            else {
                if (typeof config.fileBody === 'object' && config.fileBody.ts) {
                    yield remoteFileService.upload(config.fileBody.ts, `${env}/account/${account.id}/environment/${environment.id}/config/${nango_config_id}/${sync_name}.ts`, environment.id);
                }
            }
            const oldConfigs = yield getSyncAndActionConfigsBySyncNameAndConfigId(environment.id, nango_config_id, sync_name);
            if (oldConfigs.length > 0) {
                const ids = oldConfigs.map((oldConfig) => oldConfig.id);
                idsToMarkAsInvactive.push(...ids);
            }
            const created_at = new Date();
            const model_schema = JSON.parse(model_schema_string);
            if (input && Object.keys(input).length === 0) {
                input = undefined;
            }
            if (input && typeof input !== 'string' && input.name) {
                model_schema.push(input);
            }
            const flowData = {
                created_at,
                sync_name,
                nango_config_id,
                file_location,
                version,
                models,
                active: true,
                runs,
                input: input && typeof input !== 'string' ? String(input.name) : input,
                model_schema: JSON.stringify(model_schema),
                environment_id: environment.id,
                deleted: false,
                track_deletes: false,
                type,
                auto_start: auto_start === false ? false : true,
                attributes,
                metadata,
                pre_built: true,
                is_public,
                enabled: true,
                webhook_subscriptions: null
            };
            insertData.push(flowData);
            flowReturnData.push(Object.assign(Object.assign(Object.assign(Object.assign({}, config), { providerConfigKey: provider_config_key }), flowData), { last_deployed: created_at, input: typeof input !== 'string' ? input : String(input), models: model_schema }));
        }
        const uniqueProviderConfigKeys = [...new Set(providerConfigKeys)];
        let providerConfigKeyLog = '';
        if (configs.length === 1) {
            providerConfigKeyLog = uniqueProviderConfigKeys[0];
        }
        else {
            providerConfigKeyLog = `${configs.length} ${nameOfType}${configs.length === 1 ? '' : 's'} from ${uniqueProviderConfigKeys.length} integration${providerConfigKeys.length === 1 ? '' : 's'}`;
        }
        yield updateProviderConfigKey(activityLogId, providerConfigKeyLog);
        const isPublic = configs.every((config) => config.is_public);
        try {
            const syncIds = yield schema().from(TABLE).insert(insertData).returning('id');
            flowReturnData.forEach((flow, index) => {
                const row = syncIds[index];
                if (row) {
                    flow.id = row.id;
                }
            });
            const endpoints = [];
            syncIds.forEach((row, index) => {
                const sync = configs[index];
                if (sync.endpoints && row.id) {
                    sync.endpoints.forEach((endpoint, endpointIndex) => {
                        const method = Object.keys(endpoint)[0];
                        const path = endpoint[method];
                        const res = {
                            sync_config_id: row.id,
                            method,
                            path
                        };
                        const model = sync.models[endpointIndex];
                        if (model) {
                            res.model = model;
                        }
                        endpoints.push(res);
                    });
                }
            });
            if (endpoints.length > 0) {
                yield schema().from(ENDPOINT_TABLE).insert(endpoints);
            }
            if (idsToMarkAsInvactive.length > 0) {
                yield schema().from(TABLE).update({ active: false }).whereIn('id', idsToMarkAsInvactive);
            }
            yield updateSuccessActivityLog(activityLogId, true);
            let content;
            const names = configs.map((config) => config.name || config.syncName);
            if (isPublic) {
                content = `Successfully deployed the ${nameOfType}${configs.length === 1 ? '' : 's'} template${configs.length === 1 ? '' : 's'} (${names.join(', ')}).`;
            }
            else {
                content = `There ${configs.length === 1 ? 'was' : 'were'} ${configs.length} ${nameOfType}${configs.length === 1 ? '' : 's'} private template${configs.length === 1 ? '' : 's'} (${names.join(', ')}) deployed to your account by a Nango admin.`;
            }
            yield createActivityLogMessageAndEnd({
                level: 'info',
                environment_id: environment.id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content
            });
            yield logCtx.info('Successfully deployed', { nameOfType, configs: names });
            yield logCtx.success();
            yield telemetry.log(LogTypes.SYNC_DEPLOY_SUCCESS, content, LogActionEnum.SYNC_DEPLOY, {
                environmentId: String(environment.id),
                syncName: configs.map((config) => config.name).join(', '),
                accountId: String(account.id),
                integrations: configs.map((config) => config.provider).join(', '),
                preBuilt: 'true',
                is_public: isPublic ? 'true' : 'false'
            }, `deploy_type:${isPublic ? 'public.' : 'private.'}template`);
            return { success: true, error: null, response: { result: flowReturnData, activityLogId } };
        }
        catch (e) {
            yield updateSuccessActivityLog(activityLogId, false);
            const content = `Failed to deploy the ${nameOfType}${configs.length === 1 ? '' : 's'} (${configs.map((config) => config.name).join(', ')}).`;
            yield createActivityLogDatabaseErrorMessageAndEnd(content, e, activityLogId, environment.id);
            yield logCtx.error('Failed to deploy', { nameOfType, configs: configs.map((config) => config.name), error: e });
            yield logCtx.failed();
            yield telemetry.log(LogTypes.SYNC_DEPLOY_FAILURE, content, LogActionEnum.SYNC_DEPLOY, {
                environmentId: String(environment.id),
                syncName: configs.map((config) => config.name).join(', '),
                accountId: String(account.id),
                integration: configs.map((config) => config.provider).join(', '),
                preBuilt: 'true',
                is_public: isPublic ? 'true' : 'false',
                level: 'error'
            }, `deploy_type:${isPublic ? 'public.' : 'private.'}template`);
            throw new NangoError('error_creating_sync_config');
        }
    });
}
function compileDeployInfo({ flow, flowsWithVersions, idsToMarkAsInvactive, insertData, flowReturnData, env, environment_id, accountId, activityLogId, debug, logCtx, orchestrator }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { syncName, providerConfigKey, fileBody, models, runs, version: optionalVersion, model_schema, type = SyncConfigType.SYNC, track_deletes, auto_start, attributes = {}, metadata = {} } = flow;
        if (type === SyncConfigType.SYNC && !runs) {
            const error = new NangoError('missing_required_fields_on_deploy');
            yield createActivityLogMessage({
                level: 'error',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `${error}`
            });
            yield logCtx.error(error.message);
            return { success: false, error, response: null };
        }
        if (!syncName || !providerConfigKey || !fileBody) {
            const error = new NangoError('missing_required_fields_on_deploy');
            yield createActivityLogMessage({
                level: 'error',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `${error}`
            });
            yield logCtx.error(error.message);
            return { success: false, error, response: null };
        }
        const config = yield configService.getProviderConfig(providerConfigKey, environment_id);
        if (!config) {
            const error = new NangoError('unknown_provider_config', { providerConfigKey });
            yield createActivityLogMessage({
                level: 'error',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `${error}`
            });
            yield logCtx.error(error.message);
            return { success: false, error, response: null };
        }
        const previousSyncAndActionConfig = yield getSyncAndActionConfigByParams(environment_id, syncName, providerConfigKey);
        let bumpedVersion = '';
        if (previousSyncAndActionConfig) {
            bumpedVersion = increment(previousSyncAndActionConfig.version).toString();
            if (debug) {
                yield createActivityLogMessage({
                    level: 'debug',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `A previous sync config was found for ${syncName} with version ${previousSyncAndActionConfig.version}`
                });
                yield logCtx.debug('A previous sync config was found', { syncName, prevVersion: previousSyncAndActionConfig.version });
            }
            if (runs) {
                const syncsConfig = yield getSyncsByProviderConfigAndSyncName(environment_id, providerConfigKey, syncName);
                for (const syncConfig of syncsConfig) {
                    const interval = syncConfig.frequency || runs;
                    const res = yield orchestrator.updateSyncFrequency({
                        syncId: syncConfig.id,
                        interval,
                        syncName,
                        environmentId: environment_id,
                        activityLogId: activityLogId,
                        logCtx
                    });
                    if (res.isErr()) {
                        const error = new NangoError('error_updating_sync_schedule_frequency', {
                            syncId: syncConfig.id,
                            environmentId: environment_id,
                            interval
                        });
                        return { success: false, error, response: null };
                    }
                }
            }
        }
        const version = optionalVersion || bumpedVersion || '1';
        const jsFile = typeof fileBody === 'string' ? fileBody : fileBody.js;
        const file_location = (yield remoteFileService.upload(jsFile, `${env}/account/${accountId}/environment/${environment_id}/config/${config.id}/${syncName}-v${version}.js`, environment_id));
        if (typeof fileBody === 'object' && fileBody.ts) {
            yield remoteFileService.upload(fileBody.ts, `${env}/account/${accountId}/environment/${environment_id}/config/${config.id}/${syncName}.ts`, environment_id);
        }
        flowsWithVersions = flowsWithVersions.map((flowWithVersions) => {
            if (flowWithVersions['syncName'] === syncName) {
                return Object.assign(Object.assign({}, flowWithVersions), { version });
            }
            return flowWithVersions;
        });
        if (!file_location) {
            yield updateSuccessActivityLog(activityLogId, false);
            yield createActivityLogMessage({
                level: 'error',
                environment_id,
                activity_log_id: activityLogId,
                timestamp: Date.now(),
                content: `There was an error uploading the sync file ${syncName}-v${version}.js`
            });
            yield logCtx.error('There was an error uploading the sync file', { fileName: `${syncName}-v${version}.js` });
            // this is a platform error so throw this
            throw new NangoError('file_upload_error');
        }
        const oldConfigs = yield getSyncAndActionConfigsBySyncNameAndConfigId(environment_id, config.id, syncName);
        let lastSyncWasEnabled = true;
        if (oldConfigs.length > 0) {
            const ids = oldConfigs.map((oldConfig) => oldConfig.id);
            idsToMarkAsInvactive.push(...ids);
            const lastConfig = oldConfigs[oldConfigs.length - 1];
            if (lastConfig) {
                lastSyncWasEnabled = lastConfig.enabled;
            }
            if (debug) {
                yield createActivityLogMessage({
                    level: 'debug',
                    environment_id,
                    activity_log_id: activityLogId,
                    timestamp: Date.now(),
                    content: `Marking ${ids.length} old sync configs as inactive for ${syncName} with version ${version} as the active sync config`
                });
                yield logCtx.debug('Marking old sync configs as inactive', { count: ids.length, syncName, activeVersion: version });
            }
        }
        const account = yield accountService.getAccountById(accountId);
        let shouldCap = false;
        if (account && account.is_capped) {
            // if there are too many connections for this sync then we need to also
            // mark it as disabled
            shouldCap = yield connectionService.shouldCapUsage({ providerConfigKey, environmentId: environment_id, type: 'deploy' });
        }
        insertData.push({
            environment_id,
            nango_config_id: config.id,
            sync_name: syncName,
            type,
            models,
            version,
            track_deletes: track_deletes || false,
            auto_start: auto_start === false ? false : true,
            attributes,
            metadata,
            file_location,
            runs,
            active: true,
            model_schema: model_schema,
            input: flow.input || '',
            sync_type: flow.sync_type,
            webhook_subscriptions: flow.webhookSubscriptions || [],
            enabled: lastSyncWasEnabled && !shouldCap
        });
        flowReturnData.push(Object.assign(Object.assign({}, flow), { name: syncName, version }));
        return { success: true, error: null, response: flowsWithVersions };
    });
}
//# sourceMappingURL=deploy.service.js.map