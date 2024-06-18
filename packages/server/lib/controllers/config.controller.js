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
import crypto from 'crypto';
import { isHosted } from '@nangohq/utils';
import { flowService, getConfigWithEndpointsByProviderConfigKey, errorManager, NangoError, analytics, AnalyticsTypes, configService, connectionService, getUniqueSyncsByProviderConfig, getActionsByProviderConfigKey, getFlowConfigsByParams, getGlobalWebhookReceiveUrl } from '@nangohq/shared';
import { getOrchestrator, parseConnectionConfigParamsFromTemplate } from '../utils/utils.js';
const orchestrator = getOrchestrator();
const separateFlows = (flows) => {
    return flows.reduce((acc, flow) => {
        const key = flow.enabled ? 'enabledFlows' : 'disabledFlows';
        acc[key].push(flow);
        return acc;
    }, { enabledFlows: [], disabledFlows: [] });
};
const getEnabledAndDisabledFlows = (publicFlows, allFlows) => {
    const { syncs: publicSyncs, actions: publicActions } = publicFlows;
    const { syncs, actions } = allFlows;
    const { enabledFlows: enabledSyncs, disabledFlows: disabledSyncs } = separateFlows(syncs);
    const { enabledFlows: enabledActions, disabledFlows: disabledActions } = separateFlows(actions);
    const filterFlows = (publicFlows, enabled, disabled) => {
        // We don't want to show public flows in a few different scenarios
        // 1. If a public flow is active (can be enabled or disabled) then it will show in allFlows so we filter it out
        // 2. If an active flow has the same endpoint as a public flow, we filter it out
        // 3. If an active flow has the same model name as a public flow, we filter it out
        return publicFlows.filter((publicFlow) => !enabled.concat(disabled).some((flow) => {
            const flowModelNames = flow.models.map((model) => model.name);
            const publicModelNames = publicFlow.models.map((model) => model.name);
            const flowEndpointPaths = flow.endpoints.map((endpoint) => `${Object.keys(endpoint)[0]} ${Object.values(endpoint)[0]}`);
            const publicEndpointPaths = publicFlow.endpoints.map((endpoint) => `${Object.keys(endpoint)[0]} ${Object.values(endpoint)[0]}`);
            return (flow.name === publicFlow.name ||
                flowEndpointPaths.some((endpoint) => publicEndpointPaths.includes(endpoint)) ||
                flowModelNames.some((model) => publicModelNames.includes(model)));
        }));
    };
    const filteredSyncs = filterFlows(publicSyncs, enabledSyncs, disabledSyncs);
    const filteredActions = filterFlows(publicActions, enabledActions, disabledActions);
    const disabledFlows = { syncs: filteredSyncs.concat(disabledSyncs), actions: filteredActions.concat(disabledActions) };
    const flows = { syncs: enabledSyncs, actions: enabledActions };
    return { disabledFlows, flows };
};
class ConfigController {
    /**
     * Webapp
     */
    listProviderConfigsWeb(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                const configs = yield configService.listProviderConfigs(environment.id);
                const connections = yield connectionService.listConnections(environment.id);
                const integrations = yield Promise.all(configs.map((config) => __awaiter(this, void 0, void 0, function* () {
                    const template = configService.getTemplates()[config.provider];
                    const activeFlows = yield getFlowConfigsByParams(environment.id, config.unique_key);
                    const integration = {
                        authMode: (template === null || template === void 0 ? void 0 : template.auth_mode) || 'APP',
                        uniqueKey: config.unique_key,
                        provider: config.provider,
                        scripts: activeFlows.length,
                        connection_count: connections.filter((connection) => connection.provider === config.unique_key).length,
                        creationDate: config.created_at
                    };
                    if (template && template.auth_mode !== 'APP' && template.auth_mode !== 'CUSTOM') {
                        integration['connectionConfigParams'] = parseConnectionConfigParamsFromTemplate(template);
                    }
                    return integration;
                })));
                res.status(200).send({
                    integrations: integrations.sort((a, b) => {
                        const creationDateA = a.creationDate || new Date(0);
                        const creationDateB = b.creationDate || new Date(0);
                        return creationDateB.getTime() - creationDateA.getTime();
                    })
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    listProvidersFromYaml(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const providers = Object.entries(configService.getTemplates())
                    .map((providerProperties) => {
                    const [provider, properties] = providerProperties;
                    return {
                        name: provider,
                        defaultScopes: properties.default_scopes,
                        authMode: properties.auth_mode,
                        categories: properties.categories,
                        docs: properties.docs
                    };
                })
                    .sort((a, b) => a.name.localeCompare(b.name));
                res.status(200).send(providers);
            }
            catch (err) {
                next(err);
            }
        });
    }
    editProviderConfigWeb(req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                if (req.body == null) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                if (req.body['provider_config_key'] == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                if (req.body['provider'] == null) {
                    errorManager.errRes(res, 'missing_provider_template');
                    return;
                }
                const provider = req.body['provider'];
                const template = configService.getTemplate(provider);
                const authMode = template.auth_mode;
                if (authMode === 'OAUTH1' || authMode === 'OAUTH2' || authMode === 'CUSTOM') {
                    if (req.body['client_id'] == null) {
                        errorManager.errRes(res, 'missing_client_id');
                        return;
                    }
                    if (req.body['client_secret'] == null) {
                        errorManager.errRes(res, 'missing_client_secret');
                        return;
                    }
                }
                let oauth_client_secret = (_a = req.body['client_secret']) !== null && _a !== void 0 ? _a : null;
                if (template.auth_mode === 'APP') {
                    if (!oauth_client_secret.includes('BEGIN RSA PRIVATE KEY')) {
                        errorManager.errRes(res, 'invalid_app_secret');
                        return;
                    }
                    oauth_client_secret = Buffer.from(oauth_client_secret).toString('base64');
                }
                const custom = (_b = req.body['custom']) !== null && _b !== void 0 ? _b : null;
                if (template.auth_mode === 'CUSTOM') {
                    if (!custom || !custom['private_key']) {
                        errorManager.errRes(res, 'missing_custom');
                        return;
                    }
                    const { private_key } = custom;
                    if (!private_key.includes('BEGIN RSA PRIVATE KEY')) {
                        errorManager.errRes(res, 'invalid_app_secret');
                        return;
                    }
                    custom['private_key'] = Buffer.from(private_key).toString('base64');
                }
                const newConfig = {
                    unique_key: req.body['provider_config_key'],
                    provider: req.body['provider'],
                    oauth_client_id: req.body['client_id'],
                    oauth_client_secret,
                    oauth_scopes: req.body['scopes'],
                    app_link: req.body['app_link'],
                    environment_id: environment.id
                };
                if (custom) {
                    newConfig.custom = custom;
                }
                const oldConfig = yield configService.getProviderConfig(newConfig.unique_key, environment.id);
                if (oldConfig == null) {
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                yield configService.editProviderConfig(newConfig);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    editProviderConfigName(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                if (req.body == null) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                if (req.body['oldProviderConfigKey'] == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                if (req.body['newProviderConfigKey'] == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                const oldProviderConfigKey = req.body['oldProviderConfigKey'];
                const newProviderConfigKey = req.body['newProviderConfigKey'];
                const config = yield configService.getProviderConfig(oldProviderConfigKey, environment.id);
                if (config == null) {
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                yield configService.editProviderConfigName(oldProviderConfigKey, newProviderConfigKey, environment.id);
                res.status(200).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * CLI
     */
    listProviderConfigs(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const configs = yield configService.listProviderConfigs(environmentId);
                const results = configs.map((c) => ({ unique_key: c.unique_key, provider: c.provider }));
                res.status(200).send({ configs: results });
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProviderConfig(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environment = res.locals['environment'];
                const environmentId = environment.id;
                const providerConfigKey = req.params['providerConfigKey'];
                const includeCreds = req.query['include_creds'] === 'true';
                const includeFlows = req.query['include_flows'] === 'true';
                if (providerConfigKey == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                const config = yield configService.getProviderConfig(providerConfigKey, environment.id);
                if (!config) {
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                const providerTemplate = configService.getTemplate(config.provider);
                const authMode = providerTemplate.auth_mode;
                let client_secret = config.oauth_client_secret;
                let webhook_secret = null;
                const custom = config.custom;
                if (authMode === 'APP' && client_secret) {
                    client_secret = Buffer.from(client_secret, 'base64').toString('ascii');
                    const hash = `${config.oauth_client_id}${config.oauth_client_secret}${config.app_link}`;
                    webhook_secret = crypto.createHash('sha256').update(hash).digest('hex');
                }
                if (authMode === 'CUSTOM' && custom) {
                    const { private_key } = custom;
                    custom['private_key'] = Buffer.from(custom['private_key'], 'base64').toString('ascii');
                    const hash = `${custom['app_id']}${private_key}${config.app_link}`;
                    webhook_secret = crypto.createHash('sha256').update(hash).digest('hex');
                }
                const syncConfigs = yield getUniqueSyncsByProviderConfig(environmentId, providerConfigKey);
                const syncs = syncConfigs.map((sync) => {
                    const { metadata } = sync, config = __rest(sync, ["metadata"]);
                    return Object.assign(Object.assign({}, config), { description: metadata === null || metadata === void 0 ? void 0 : metadata.description });
                });
                const actions = yield getActionsByProviderConfigKey(environmentId, providerConfigKey);
                const hasWebhook = providerTemplate.webhook_routing_script;
                const connections = yield connectionService.getConnectionsByEnvironmentAndConfig(environmentId, providerConfigKey);
                const connection_count = connections.length;
                let webhookUrl = null;
                if (hasWebhook) {
                    webhookUrl = `${getGlobalWebhookReceiveUrl()}/${environment.uuid}/${config.provider}`;
                }
                const configRes = includeCreds
                    ? {
                        unique_key: config.unique_key,
                        provider: config.provider,
                        client_id: config.oauth_client_id,
                        client_secret,
                        custom: config.custom,
                        scopes: config.oauth_scopes,
                        app_link: config.app_link,
                        auth_mode: authMode,
                        created_at: config.created_at,
                        syncs,
                        actions,
                        has_webhook: Boolean(hasWebhook),
                        webhook_secret,
                        connections,
                        docs: providerTemplate.docs,
                        connection_count,
                        has_webhook_user_defined_secret: providerTemplate.webhook_user_defined_secret,
                        webhook_url: webhookUrl
                    }
                    : { unique_key: config.unique_key, provider: config.provider, syncs, actions };
                if (includeFlows && !isHosted) {
                    const availablePublicFlows = flowService.getAllAvailableFlowsAsStandardConfig();
                    const [publicFlows] = availablePublicFlows.filter((flow) => flow.providerConfigKey === config.provider);
                    const allFlows = yield getConfigWithEndpointsByProviderConfigKey(environmentId, providerConfigKey);
                    if (availablePublicFlows.length && publicFlows && allFlows) {
                        const { disabledFlows, flows } = getEnabledAndDisabledFlows(publicFlows, allFlows);
                        res.status(200).send({ config: configRes, flows: { disabledFlows, allFlows: flows } });
                        return;
                    }
                    res.status(200).send({ config: configRes, flows: { allFlows, disabledFlows: publicFlows } });
                    return;
                }
                res.status(200).send({ config: configRes });
            }
            catch (err) {
                next(err);
            }
        });
    }
    getConnections(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const providerConfigKey = req.params['providerConfigKey'];
                const environmentId = res.locals['environment'].id;
                if (providerConfigKey == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                const connections = yield connectionService.getConnectionsByEnvironmentAndConfig(environmentId, providerConfigKey);
                res.status(200).send(connections);
            }
            catch (err) {
                next(err);
            }
        });
    }
    createEmptyProviderConfig(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const accountId = res.locals['account'].id;
                if (req.body['provider'] == null) {
                    errorManager.errRes(res, 'missing_provider_template');
                    return;
                }
                const provider = req.body['provider'];
                if (!configService.checkProviderTemplateExists(provider)) {
                    errorManager.errRes(res, 'unknown_provider_template');
                    return;
                }
                const result = yield configService.createEmptyProviderConfig(provider, environmentId);
                void analytics.track(AnalyticsTypes.CONFIG_CREATED, accountId, { provider });
                res.status(200).send({
                    config: {
                        unique_key: result.unique_key,
                        provider
                    }
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    createProviderConfig(req, res, next) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const accountId = res.locals['account'].id;
                if (req.body == null) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                if (req.body['provider_config_key'] == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                if (req.body['provider'] == null) {
                    errorManager.errRes(res, 'missing_provider_template');
                    return;
                }
                const provider = req.body['provider'];
                if (!configService.checkProviderTemplateExists(provider)) {
                    errorManager.errRes(res, 'unknown_provider_template');
                    return;
                }
                const providerTemplate = configService.getTemplate(provider);
                const authMode = providerTemplate.auth_mode;
                if ((authMode === 'OAUTH1' || authMode === 'OAUTH2' || authMode === 'CUSTOM') && req.body['oauth_client_id'] == null) {
                    errorManager.errRes(res, 'missing_client_id');
                    return;
                }
                if (authMode === 'APP' && req.body['oauth_client_id'] == null) {
                    errorManager.errRes(res, 'missing_app_id');
                    return;
                }
                if ((authMode === 'OAUTH1' || authMode === 'OAUTH2') && req.body['oauth_client_secret'] == null) {
                    errorManager.errRes(res, 'missing_client_secret');
                    return;
                }
                if (authMode === 'APP' && req.body['oauth_client_secret'] == null) {
                    errorManager.errRes(res, 'missing_app_secret');
                    return;
                }
                const uniqueConfigKey = req.body['provider_config_key'];
                if ((yield configService.getProviderConfig(uniqueConfigKey, environmentId)) != null) {
                    errorManager.errRes(res, 'duplicate_provider_config');
                    return;
                }
                let oauth_client_secret = (_a = req.body['oauth_client_secret']) !== null && _a !== void 0 ? _a : null;
                if (authMode === 'APP') {
                    if (!oauth_client_secret.includes('BEGIN RSA PRIVATE KEY')) {
                        errorManager.errRes(res, 'invalid_app_secret');
                        return;
                    }
                    oauth_client_secret = Buffer.from(oauth_client_secret).toString('base64');
                }
                const custom = req.body['custom'];
                if (authMode === 'CUSTOM') {
                    if (!custom || !custom['private_key']) {
                        errorManager.errRes(res, 'missing_custom');
                        return;
                    }
                    const { private_key } = custom;
                    if (!private_key.includes('BEGIN RSA PRIVATE KEY')) {
                        errorManager.errRes(res, 'invalid_app_secret');
                        return;
                    }
                    custom['private_key'] = Buffer.from(private_key).toString('base64');
                }
                const oauth_client_id = (_b = req.body['oauth_client_id']) !== null && _b !== void 0 ? _b : null;
                const oauth_scopes = (_c = req.body['oauth_scopes']) !== null && _c !== void 0 ? _c : '';
                const app_link = (_d = req.body['app_link']) !== null && _d !== void 0 ? _d : null;
                if (oauth_scopes && Array.isArray(oauth_scopes)) {
                    errorManager.errRes(res, 'invalid_oauth_scopes');
                    return;
                }
                const config = {
                    unique_key: uniqueConfigKey,
                    provider: provider,
                    oauth_client_id,
                    oauth_client_secret,
                    oauth_scopes: oauth_scopes
                        ? oauth_scopes
                            .replace(/ /g, ',')
                            .split(',')
                            .filter((w) => w)
                            .join(',')
                        : '',
                    app_link,
                    environment_id: environmentId
                };
                if (custom) {
                    config.custom = custom;
                }
                const result = yield configService.createProviderConfig(config);
                if (Array.isArray(result) && result.length === 1 && result[0] != null && 'id' in result[0]) {
                    void analytics.track(AnalyticsTypes.CONFIG_CREATED, accountId, { provider: config.provider });
                    res.status(200).send({
                        config: {
                            unique_key: config.unique_key,
                            provider: config.provider
                        }
                    });
                }
                else {
                    throw new NangoError('provider_config_creation_failure');
                }
            }
            catch (err) {
                next(err);
            }
        });
    }
    editProviderConfig(req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                if (req.body == null) {
                    errorManager.errRes(res, 'missing_body');
                    return;
                }
                if (req.body['provider_config_key'] == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                const provider = req.body['provider'];
                const template = configService.getTemplate(provider);
                const authMode = template.auth_mode;
                if (authMode === 'API_KEY' || authMode === 'BASIC') {
                    errorManager.errRes(res, 'provider_config_edit_not_allowed');
                    return;
                }
                if (req.body['provider'] == null) {
                    errorManager.errRes(res, 'missing_provider_template');
                    return;
                }
                if (authMode === 'OAUTH1' || authMode === 'OAUTH2' || authMode === 'CUSTOM') {
                    if (req.body['oauth_client_id'] == null) {
                        errorManager.errRes(res, 'missing_client_id');
                        return;
                    }
                    if (req.body['oauth_client_secret'] == null) {
                        errorManager.errRes(res, 'missing_client_secret');
                        return;
                    }
                }
                let oauth_client_secret = (_a = req.body['oauth_client_secret']) !== null && _a !== void 0 ? _a : null;
                if (template.auth_mode === 'APP') {
                    if (!oauth_client_secret.includes('BEGIN RSA PRIVATE KEY')) {
                        errorManager.errRes(res, 'invalid_app_secret');
                        return;
                    }
                    oauth_client_secret = Buffer.from(oauth_client_secret).toString('base64');
                }
                const custom = (_b = req.body['custom']) !== null && _b !== void 0 ? _b : null;
                if (template.auth_mode === 'CUSTOM') {
                    const { private_key } = custom;
                    if (!private_key.includes('BEGIN RSA PRIVATE KEY')) {
                        errorManager.errRes(res, 'invalid_app_secret');
                        return;
                    }
                    custom.private_key = Buffer.from(private_key).toString('base64');
                }
                const newConfig = {
                    unique_key: req.body['provider_config_key'],
                    provider: req.body['provider'],
                    oauth_client_id: req.body['oauth_client_id'],
                    oauth_client_secret,
                    oauth_scopes: req.body['oauth_scopes'],
                    app_link: req.body['app_link'],
                    environment_id: environmentId,
                    custom
                };
                const oldConfig = yield configService.getProviderConfig(newConfig.unique_key, environmentId);
                if (oldConfig == null) {
                    errorManager.errRes(res, 'unknown_provider_config');
                    return;
                }
                yield configService.editProviderConfig(newConfig);
                res.status(200).send({
                    config: {
                        unique_key: newConfig.unique_key,
                        provider: newConfig.provider
                    }
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteProviderConfig(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const environmentId = res.locals['environment'].id;
                const providerConfigKey = req.params['providerConfigKey'];
                if (providerConfigKey == null) {
                    errorManager.errRes(res, 'missing_provider_config');
                    return;
                }
                yield configService.deleteProviderConfig(providerConfigKey, environmentId, orchestrator);
                res.status(204).send();
            }
            catch (err) {
                next(err);
            }
        });
    }
}
export default new ConfigController();
//# sourceMappingURL=config.controller.js.map