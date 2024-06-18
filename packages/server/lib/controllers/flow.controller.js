var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { flowService, accountService, connectionService, errorManager, configService, deployPreBuilt as deployPreBuiltSyncConfig, syncManager, remoteFileService, getAllSyncsAndActions, getNangoConfigIdAndLocationFromId, getConfigWithEndpointsByProviderConfigKeyAndName, getSyncsByConnectionIdsAndEnvironmentIdAndSyncName, enableScriptConfig as enableConfig, disableScriptConfig as disableConfig, environmentService } from '@nangohq/shared';
import { logContextGetter } from '@nangohq/logs';
import { getOrchestrator } from '../utils/utils.js';
const orchestrator = getOrchestrator();
class FlowController {
    getFlows(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const availableFlows = flowService.getAllAvailableFlows();
                const addedFlows = yield flowService.getAddedPublicFlows(res.locals['environment'].id);
                res.send({ addedFlows, availableFlows });
            }
            catch (e) {
                next(e);
            }
        });
    }
    adminDeployPrivateFlow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { targetAccountUUID, targetEnvironment, config } = req.body;
                const result = yield environmentService.getAccountAndEnvironment({ accountUuid: targetAccountUUID, envName: targetEnvironment });
                if (!result) {
                    res.status(400).send('Invalid environment');
                    return;
                }
                const { environment } = result;
                const { success: preBuiltSuccess, error: preBuiltError, response: preBuiltResponse } = yield deployPreBuiltSyncConfig(environment, config, req.body.nangoYamlBody || '', logContextGetter, orchestrator);
                if (!preBuiltSuccess || preBuiltResponse === null) {
                    errorManager.errResFromNangoErr(res, preBuiltError);
                    return;
                }
                yield syncManager.triggerIfConnectionsExist(preBuiltResponse.result, environment.id, logContextGetter, orchestrator);
                res.sendStatus(200);
            }
            catch (e) {
                next(e);
            }
        });
    }
    deployPreBuiltFlow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const config = req.body;
                if (!config) {
                    res.status(400).send('Missing config');
                    return;
                }
                if (config.some((c) => !c.provider)) {
                    res.status(400).send('Missing integration');
                    return;
                }
                const { environment } = res.locals;
                const environmentId = environment.id;
                const accountId = res.locals['account'].id;
                // config is an array for compatibility purposes, it will only ever have one item
                const [firstConfig] = config;
                let providerLookup;
                if (firstConfig === null || firstConfig === void 0 ? void 0 : firstConfig.providerConfigKey) {
                    providerLookup = yield configService.getConfigIdByProviderConfigKey(firstConfig.providerConfigKey, environmentId);
                }
                else {
                    providerLookup = yield configService.getConfigIdByProvider(firstConfig === null || firstConfig === void 0 ? void 0 : firstConfig.provider, environmentId);
                }
                if (!providerLookup) {
                    errorManager.errRes(res, 'provider_not_on_account');
                    return;
                }
                const account = yield accountService.getAccountById(accountId);
                if (!account) {
                    errorManager.errRes(res, 'unknown_account');
                    return;
                }
                if (account.is_capped && (firstConfig === null || firstConfig === void 0 ? void 0 : firstConfig.providerConfigKey)) {
                    const isCapped = yield connectionService.shouldCapUsage({ providerConfigKey: firstConfig.providerConfigKey, environmentId, type: 'activate' });
                    if (isCapped) {
                        errorManager.errRes(res, 'resource_capped');
                        return;
                    }
                }
                const { success: preBuiltSuccess, error: preBuiltError, response: preBuiltResponse } = yield deployPreBuiltSyncConfig(environment, config, '', logContextGetter, orchestrator);
                if (!preBuiltSuccess || preBuiltResponse === null) {
                    errorManager.errResFromNangoErr(res, preBuiltError);
                    return;
                }
                yield syncManager.triggerIfConnectionsExist(preBuiltResponse.result, environmentId, logContextGetter, orchestrator);
                res.status(201).send(preBuiltResponse.result);
            }
            catch (e) {
                next(e);
            }
        });
    }
    downloadFlow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const accountId = res.locals['account'].id;
                const body = req.body;
                if (!body) {
                    res.status(400).send('Missing body');
                    return;
                }
                const { id, name, provider, is_public, providerConfigKey, flowType } = body;
                if (!name || !provider || typeof is_public === 'undefined') {
                    res.status(400).send('Missing required fields');
                    return;
                }
                if (!id && is_public) {
                    yield remoteFileService.zipAndSendPublicFiles(res, name, accountId, environmentId, body.public_route, flowType);
                    return;
                }
                else {
                    // it has an id, so it's either a public template that is active, or a private template
                    // either way, we need to fetch it from the users directory in s3
                    const configLookupResult = yield getNangoConfigIdAndLocationFromId(id);
                    if (!configLookupResult) {
                        res.status(400).send('Invalid file reference');
                        return;
                    }
                    const { nango_config_id, file_location } = configLookupResult;
                    yield remoteFileService.zipAndSendFiles(res, name, accountId, environmentId, nango_config_id, file_location, providerConfigKey, flowType);
                    return;
                }
            }
            catch (e) {
                next(e);
            }
        });
    }
    getFlowConfig(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const nangoConfigs = yield getAllSyncsAndActions(environmentId);
                res.send(nangoConfigs);
            }
            catch (e) {
                next(e);
            }
        });
    }
    enableFlow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { account, environment } = res.locals;
                const id = req.params['id'];
                const flow = req.body;
                if (!id) {
                    res.status(400).send('Missing id');
                    return;
                }
                if (account.is_capped && (flow === null || flow === void 0 ? void 0 : flow.providerConfigKey)) {
                    const isCapped = yield connectionService.shouldCapUsage({
                        providerConfigKey: flow === null || flow === void 0 ? void 0 : flow.providerConfigKey,
                        environmentId: environment.id,
                        type: 'activate'
                    });
                    if (isCapped) {
                        errorManager.errRes(res, 'resource_capped');
                        return;
                    }
                }
                yield enableConfig(Number(id));
                yield syncManager.triggerIfConnectionsExist([flow], environment.id, logContextGetter, orchestrator);
                res.status(200).send([Object.assign(Object.assign({}, flow), { enabled: true })]);
            }
            catch (e) {
                next(e);
            }
        });
    }
    disableFlow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const id = req.params['id'];
                const connectionIds = req.query['connectionIds'];
                const syncName = req.query['sync_name'];
                const flow = req.body;
                if (!id) {
                    res.status(400).send('Missing id');
                    return;
                }
                if (!syncName) {
                    res.status(400).send('Missing sync_name');
                    return;
                }
                if (connectionIds) {
                    const connections = connectionIds.split(',');
                    const syncs = yield getSyncsByConnectionIdsAndEnvironmentIdAndSyncName(connections, environmentId, syncName);
                    for (const sync of syncs) {
                        yield syncManager.softDeleteSync(sync.id, environmentId, orchestrator);
                    }
                }
                yield disableConfig(Number(id));
                res.send(Object.assign(Object.assign({}, flow), { enabled: false }));
            }
            catch (e) {
                next(e);
            }
        });
    }
    getFlow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environment = res.locals['environment'];
                const providerConfigKey = req.query['provider_config_key'];
                const { flowName } = req.params;
                if (!providerConfigKey) {
                    res.status(400).send({ message: 'Missing provider config key' });
                    return;
                }
                if (!flowName) {
                    res.status(400).send({ message: 'Missing sync name' });
                    return;
                }
                const flow = flowService.getSingleFlowAsStandardConfig(flowName);
                const provider = yield configService.getProviderName(providerConfigKey);
                const flowConfig = yield getConfigWithEndpointsByProviderConfigKeyAndName(environment.id, providerConfigKey, flowName);
                res.send({ flowConfig, unEnabledFlow: flow, provider });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
export default new FlowController();
//# sourceMappingURL=flow.controller.js.map