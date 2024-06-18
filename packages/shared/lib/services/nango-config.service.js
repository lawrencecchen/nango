import fs from 'fs';
import chalk from 'chalk';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import ms from 'ms';
import { SyncType, SyncConfigType } from '../models/Sync.js';
import localFileService from './file/local.service.js';
import { NangoError } from '../utils/error.js';
import { isJsOrTsType } from '../utils/utils.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const nangoConfigFile = 'nango.yaml';
export const SYNC_FILE_EXTENSION = 'js';
export function loadLocalNangoConfig(loadLocation) {
    let location;
    if (loadLocation) {
        location = path.resolve(`${loadLocation}/${nangoConfigFile}`);
    }
    else if (process.env['NANGO_INTEGRATIONS_FULL_PATH']) {
        location = path.resolve(process.env['NANGO_INTEGRATIONS_FULL_PATH'], nangoConfigFile);
    }
    else {
        location = path.resolve(__dirname, `../nango-integrations/${nangoConfigFile}`);
    }
    try {
        const yamlConfig = fs.readFileSync(location, 'utf8');
        const configData = yaml.load(yamlConfig);
        return Promise.resolve(configData);
    }
    catch (_a) {
        console.log(`no nango.yaml config found at ${location}`);
    }
    return Promise.resolve(null);
}
export function determineVersion(configData) {
    if (!configData.integrations || Object.keys(configData.integrations).length === 0) {
        return 'v1';
    }
    const [firstProviderConfigKey] = Object.keys(configData.integrations);
    const firstProviderConfig = configData.integrations[firstProviderConfigKey];
    if ('syncs' in firstProviderConfig || 'actions' in firstProviderConfig) {
        return 'v2';
    }
    else {
        return 'v1';
    }
}
export function loadStandardConfig(configData, showMessages = false, isPublic) {
    try {
        if (!configData) {
            return { success: false, error: new NangoError('no_config_found'), response: null };
        }
        const version = determineVersion(configData);
        if (!configData.integrations) {
            return { success: true, error: null, response: [] };
        }
        const configServiceResponse = version === 'v1' ? convertConfigObject(configData) : convertV2ConfigObject(configData, showMessages, isPublic);
        return configServiceResponse;
    }
    catch (error) {
        return { success: false, error: new NangoError('error_loading_nango_config', error === null || error === void 0 ? void 0 : error.message), response: null };
    }
}
function getFieldsForModel(modelName, config) {
    const modelFields = [];
    if (isJsOrTsType(modelName)) {
        return null;
    }
    if (!config.models || Object.keys(config.models).length === 0) {
        return null;
    }
    // if it is an array of models, we still need to be able to recognize it
    const strippedModelName = modelName.replace(/\[\]/g, '');
    const modelData = config.models[strippedModelName];
    for (const fieldName in modelData) {
        const fieldType = modelData[fieldName];
        if (fieldName === '__extends') {
            const extendedModels = fieldType.split(',');
            for (const extendedModel of extendedModels) {
                const extendedFields = getFieldsForModel(extendedModel.trim(), config);
                if (extendedFields) {
                    modelFields.push(...extendedFields);
                }
            }
        }
        else if (typeof fieldType === 'object') {
            for (const subFieldName in fieldType) {
                const subFieldType = fieldType[subFieldName];
                modelFields.push({ name: `${fieldName}.${subFieldName}`, type: subFieldType });
            }
        }
        else {
            modelFields.push({ name: fieldName, type: fieldType === null || fieldType === void 0 ? void 0 : fieldType.trim() });
        }
    }
    return modelFields;
}
export function convertConfigObject(config) {
    var _a, _b, _c;
    const output = [];
    for (const providerConfigKey in config.integrations) {
        const syncs = [];
        const actions = [];
        const integration = config.integrations[providerConfigKey];
        let provider;
        if (integration['provider']) {
            provider = integration['provider'];
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete integration['provider'];
        }
        for (const syncName in integration) {
            const sync = integration[syncName];
            const models = [];
            if (sync.returns) {
                const syncReturns = Array.isArray(sync.returns) ? sync.returns : [sync.returns];
                syncReturns.forEach((model) => {
                    const modelFields = getFieldsForModel(model, config);
                    if (modelFields) {
                        models.push({ name: model, fields: modelFields });
                    }
                });
            }
            const scopes = (sync === null || sync === void 0 ? void 0 : sync.scopes) || ((_a = sync === null || sync === void 0 ? void 0 : sync.metadata) === null || _a === void 0 ? void 0 : _a.scopes) || [];
            const layout_mode = 'root';
            const flowObject = {
                name: syncName,
                runs: sync.runs || '',
                track_deletes: sync.track_deletes || false,
                type: sync.type || SyncConfigType.SYNC,
                auto_start: sync.auto_start === false ? false : true,
                attributes: sync.attributes || {},
                returns: sync.returns,
                models: models || [],
                description: (sync === null || sync === void 0 ? void 0 : sync.description) || ((_b = sync === null || sync === void 0 ? void 0 : sync.metadata) === null || _b === void 0 ? void 0 : _b.description) || '',
                scopes: Array.isArray(scopes) ? scopes : (_c = String(scopes)) === null || _c === void 0 ? void 0 : _c.split(','),
                endpoints: (sync === null || sync === void 0 ? void 0 : sync.endpoints) || [],
                nango_yaml_version: 'v1',
                layout_mode
            };
            if (sync.type === SyncConfigType.ACTION) {
                actions.push(flowObject);
            }
            else {
                syncs.push(flowObject);
            }
        }
        const simplifiedIntegration = {
            providerConfigKey,
            syncs,
            actions
        };
        if (provider) {
            simplifiedIntegration.provider = provider;
        }
        output.push(simplifiedIntegration);
    }
    return { success: true, error: null, response: output };
}
const assignEndpoints = (rawEndpoint, defaultMethod, singleAllowedMethod = false, showMessages = false) => {
    var _a, _b, _c;
    let endpoints = [];
    const endpoint = rawEndpoint.split(' ');
    if (endpoint.length > 1) {
        const method = singleAllowedMethod ? defaultMethod : (_a = endpoint[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        if (singleAllowedMethod && showMessages && ((_b = endpoint[0]) === null || _b === void 0 ? void 0 : _b.toUpperCase()) !== defaultMethod) {
            console.log(chalk.yellow(`A sync only allows for a ${defaultMethod} method. The provided ${(_c = endpoint[0]) === null || _c === void 0 ? void 0 : _c.toUpperCase()} method will be ignored.`));
        }
        endpoints = [
            {
                [method]: endpoint[1]
            }
        ];
    }
    else {
        if (showMessages && !singleAllowedMethod) {
            console.log(chalk.yellow(`No HTTP method provided for endpoint ${endpoint[0]}. Defaulting to ${defaultMethod}.`));
        }
        endpoints = [
            {
                [defaultMethod]: endpoint[0]
            }
        ];
    }
    return endpoints;
};
const parseModelInEndpoint = (endpoint, allModelNames, inputModel, config) => {
    var _a;
    if (Object.keys(inputModel).length > 0) {
        return { success: false, error: new NangoError('conflicting_model_and_input'), response: null };
    }
    const modelNameWithIdentifier = (_a = endpoint.match(/{([^}]+)}/)) === null || _a === void 0 ? void 0 : _a[1];
    const modelNameWithIdentifierArray = modelNameWithIdentifier === null || modelNameWithIdentifier === void 0 ? void 0 : modelNameWithIdentifier.split(':');
    if (!modelNameWithIdentifierArray || (modelNameWithIdentifierArray === null || modelNameWithIdentifierArray === void 0 ? void 0 : modelNameWithIdentifierArray.length) < 2) {
        return { success: false, error: new NangoError('invalid_model_identifier', modelNameWithIdentifier), response: null };
    }
    const [modelName, identifier] = modelNameWithIdentifierArray;
    if (!allModelNames.includes(modelName)) {
        return { success: false, error: new NangoError('missing_model_name', modelName), response: null };
    }
    const modelFields = getFieldsForModel(modelName, config);
    if (modelFields) {
        const identifierModelFields = modelFields.filter((field) => field.name === identifier);
        if (identifierModelFields.length === 0) {
            return { success: false, error: new NangoError('missing_model_identifier', identifier), response: null };
        }
        inputModel.name = modelNameWithIdentifier;
        inputModel.fields = identifierModelFields;
    }
    return { success: true, error: null, response: inputModel };
};
const isEnabled = (script, isPublic, preBuilt) => {
    if (script.enabled !== undefined) {
        return script.enabled;
    }
    if ((isPublic || preBuilt) && !script.version) {
        return false;
    }
    return true;
};
export function convertV2ConfigObject(config, showMessages = false, isPublic) {
    const output = [];
    const allModelNames = config.models ? Object.keys(config.models) : [];
    for (const providerConfigKey in config.integrations) {
        const integration = config.integrations[providerConfigKey];
        let provider;
        if (integration['provider']) {
            provider = integration['provider'];
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete integration['provider'];
        }
        // check that every endpoint is unique across syncs and actions
        const allEndpoints = [];
        const allModels = [];
        const syncs = integration['syncs'];
        const actions = integration['actions'];
        const postConnectionScripts = (integration['post-connection-scripts'] || []);
        const { success: builtSyncSuccess, error: builtSyncError, response: builtSyncs } = buildSyncs({ syncs, allModelNames, config, providerConfigKey, showMessages, isPublic, allModels, allEndpoints });
        if (!builtSyncSuccess || !builtSyncs) {
            return { success: builtSyncSuccess, error: builtSyncError, response: null };
        }
        const { success: builtActionSuccess, error: builtActionError, response: builtActions } = buildActions({ actions, allModelNames, config, providerConfigKey, showMessages, isPublic, allModels, allEndpoints });
        if (!builtActionSuccess || !builtActions) {
            return { success: builtActionSuccess, error: builtActionError, response: null };
        }
        const simplifiedIntegration = {
            providerConfigKey,
            syncs: builtSyncs ? builtSyncs : [],
            actions: builtActions ? builtActions : [],
            postConnectionScripts
        };
        output.push(simplifiedIntegration);
        if (provider) {
            simplifiedIntegration.provider = provider;
        }
    }
    return { success: true, error: null, response: output };
}
function formModelOutput({ integrationData, allModels, allModelNames, config, name, type }) {
    const models = [];
    if (integrationData.output) {
        const integrationDataReturns = Array.isArray(integrationData.output) ? integrationData.output : [integrationData.output];
        for (const model of integrationDataReturns) {
            if (allModels.includes(model) && type === 'sync') {
                const error = new NangoError('duplicate_model', { model, name, type: 'sync' });
                return { success: false, error, response: null };
            }
            if (!allModels.includes(model) && !isJsOrTsType(model)) {
                allModels.push(model);
            }
            const modelFields = getFieldsForModel(model, config);
            if (modelFields) {
                models.push({ name: model, fields: modelFields });
                const subModels = modelFields.filter((field) => {
                    if (typeof (field === null || field === void 0 ? void 0 : field.type) === 'string') {
                        const cleanType = field.type.replace(/\[\]/g, '');
                        return allModelNames.some((m) => m.includes(cleanType));
                    }
                    else {
                        return false;
                    }
                });
                for (const subModel of subModels) {
                    const subModelFields = getFieldsForModel(subModel.type, config);
                    if (subModelFields) {
                        const subModelName = subModel.type.replace(/\[\]/g, '');
                        models.push({ name: subModelName, fields: subModelFields });
                    }
                }
            }
        }
    }
    return { success: true, error: null, response: models };
}
function buildSyncs({ syncs, allModelNames, config, providerConfigKey, showMessages, isPublic, allModels, allEndpoints }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const builtSyncs = [];
    for (const syncName in syncs) {
        const sync = syncs[syncName];
        const { success: modelSuccess, error: modelError, response: models } = formModelOutput({ integrationData: sync, allModels, allModelNames, config, name: syncName, type: 'sync' });
        if (!modelSuccess || !models) {
            return { success: false, error: modelError, response: null };
        }
        const inputModel = {};
        if (sync.input) {
            const modelFields = getFieldsForModel(sync.input, config);
            if (modelFields) {
                inputModel.name = sync.input;
                inputModel.fields = modelFields;
            }
        }
        let endpoints = [];
        if (sync === null || sync === void 0 ? void 0 : sync.endpoint) {
            if (Array.isArray(sync.endpoint)) {
                if (((_a = sync.endpoint) === null || _a === void 0 ? void 0 : _a.length) !== ((_b = sync.output) === null || _b === void 0 ? void 0 : _b.length)) {
                    const error = new NangoError('endpoint_output_mismatch', syncName);
                    return { success: false, error, response: null };
                }
                for (const endpoint of sync.endpoint) {
                    endpoints.push(...assignEndpoints(endpoint, 'GET', true, showMessages));
                    if (!allEndpoints.includes(endpoint)) {
                        allEndpoints.push(endpoint);
                    }
                    else {
                        const error = new NangoError('duplicate_endpoint', endpoint);
                        return { success: false, error, response: null };
                    }
                }
            }
            else {
                endpoints = assignEndpoints(sync.endpoint, 'GET', true, showMessages);
                if (sync.output && Array.isArray(sync.output) && ((_c = sync.output) === null || _c === void 0 ? void 0 : _c.length) > 1) {
                    const error = new NangoError('endpoint_output_mismatch', syncName);
                    return { success: false, error, response: null };
                }
                if (!allEndpoints.includes(sync.endpoint)) {
                    allEndpoints.push(sync.endpoint);
                }
                else {
                    const error = new NangoError('duplicate_endpoint', sync.endpoint);
                    return { success: false, error, response: null };
                }
            }
        }
        const scopes = (sync === null || sync === void 0 ? void 0 : sync.scopes) || ((_d = sync === null || sync === void 0 ? void 0 : sync.metadata) === null || _d === void 0 ? void 0 : _d.scopes) || [];
        if (!(sync === null || sync === void 0 ? void 0 : sync.runs) && showMessages) {
            console.log(chalk.yellow(`No runs property found for sync "${syncName}". Defaulting to every day.`));
        }
        const runs = (sync === null || sync === void 0 ? void 0 : sync.runs) || 'every day';
        const { success, error } = getInterval(runs, new Date());
        if (!success) {
            return { success: false, error, response: null };
        }
        let webhookSubscriptions = [];
        if (sync['webhook-subscriptions']) {
            if (Array.isArray(sync['webhook-subscriptions'])) {
                webhookSubscriptions = sync['webhook-subscriptions'];
            }
            else {
                webhookSubscriptions = [sync['webhook-subscriptions']];
            }
        }
        const is_public = isPublic !== undefined ? isPublic : sync.is_public === true;
        const pre_built = isPublic !== undefined ? isPublic : sync.pre_built === true;
        const enabled = isEnabled(sync, is_public, pre_built);
        const syncObject = {
            name: syncName,
            type: SyncConfigType.SYNC,
            models: models || [],
            sync_type: ((_e = sync.sync_type) === null || _e === void 0 ? void 0 : _e.toUpperCase()) === SyncType.INCREMENTAL ? SyncType.INCREMENTAL : SyncType.FULL,
            runs,
            track_deletes: sync.track_deletes || false,
            auto_start: sync.auto_start === false ? false : true,
            last_deployed: sync.updated_at || null,
            is_public,
            pre_built,
            version: sync.version || null,
            attributes: sync.attributes || {},
            input: inputModel,
            // a sync always returns an array
            returns: Array.isArray(sync.output) ? sync === null || sync === void 0 ? void 0 : sync.output : [sync.output],
            description: (sync === null || sync === void 0 ? void 0 : sync.description) || ((_f = sync === null || sync === void 0 ? void 0 : sync.metadata) === null || _f === void 0 ? void 0 : _f.description) || '',
            scopes: Array.isArray(scopes) ? scopes : (_g = String(scopes)) === null || _g === void 0 ? void 0 : _g.split(','),
            endpoints,
            nango_yaml_version: sync.nango_yaml_version || 'v2',
            webhookSubscriptions,
            enabled,
            layout_mode: localFileService.getLayoutMode(syncName, providerConfigKey, 'sync')
        };
        if (sync.id) {
            syncObject.id = sync.id;
        }
        builtSyncs.push(syncObject);
    }
    return { success: true, error: null, response: builtSyncs };
}
function buildActions({ actions, allModelNames, config, providerConfigKey, showMessages, isPublic, allModels, allEndpoints }) {
    var _a, _b, _c, _d, _e;
    const builtActions = [];
    for (const actionName in actions) {
        const action = actions[actionName];
        const { success: modelSuccess, error: modelError, response: models } = formModelOutput({ integrationData: action, allModels, allModelNames, config, name: actionName, type: 'action' });
        if (!modelSuccess || !models) {
            return { success: false, error: modelError, response: null };
        }
        let inputModel = {};
        if (action.input) {
            if (action.input.includes('{') && action.input.includes('}')) {
                // find which model is in between the braces
                const modelName = (_a = action.input.match(/{([^}]+)}/)) === null || _a === void 0 ? void 0 : _a[1];
                if (!allModelNames.includes(modelName)) {
                    throw new Error(`Model ${modelName} not found included in models definition`);
                }
            }
            const modelFields = getFieldsForModel(action.input, config);
            if (modelFields) {
                inputModel.name = action.input;
                inputModel.fields = modelFields;
            }
        }
        let endpoints = [];
        let actionEndpoint;
        if (action === null || action === void 0 ? void 0 : action.endpoint) {
            if (Array.isArray(action === null || action === void 0 ? void 0 : action.endpoint)) {
                if (((_b = action === null || action === void 0 ? void 0 : action.endpoint) === null || _b === void 0 ? void 0 : _b.length) > 1) {
                    const error = new NangoError('action_single_endpoint', actionName);
                    return { success: false, error, response: null };
                }
                actionEndpoint = action === null || action === void 0 ? void 0 : action.endpoint[0];
            }
            else {
                actionEndpoint = action === null || action === void 0 ? void 0 : action.endpoint;
            }
            endpoints = assignEndpoints(actionEndpoint, 'POST', false, showMessages);
            if ((actionEndpoint === null || actionEndpoint === void 0 ? void 0 : actionEndpoint.includes('{')) && actionEndpoint.includes('}')) {
                const { success, error, response } = parseModelInEndpoint(actionEndpoint, allModelNames, inputModel, config);
                if (!success || !response) {
                    return { success, error, response: null };
                }
                inputModel = response;
            }
            if (!allEndpoints.includes(actionEndpoint)) {
                allEndpoints.push(actionEndpoint);
            }
            else {
                const error = new NangoError('duplicate_endpoint', actionEndpoint);
                return { success: false, error, response: null };
            }
        }
        const scopes = (action === null || action === void 0 ? void 0 : action.scopes) || ((_c = action === null || action === void 0 ? void 0 : action.metadata) === null || _c === void 0 ? void 0 : _c.scopes) || [];
        const is_public = isPublic !== undefined ? isPublic : action.is_public === true;
        const pre_built = isPublic !== undefined ? isPublic : action.pre_built === true;
        const enabled = isEnabled(action, is_public, pre_built);
        const actionObject = {
            name: actionName,
            type: SyncConfigType.ACTION,
            models: models || [],
            runs: '',
            is_public,
            pre_built,
            version: action.version || null,
            last_deployed: action.updated_at || null,
            attributes: action.attributes || {},
            returns: action.output,
            description: (action === null || action === void 0 ? void 0 : action.description) || ((_d = action === null || action === void 0 ? void 0 : action.metadata) === null || _d === void 0 ? void 0 : _d.description) || '',
            scopes: Array.isArray(scopes) ? scopes : (_e = String(scopes)) === null || _e === void 0 ? void 0 : _e.split(','),
            input: inputModel,
            endpoints,
            nango_yaml_version: action.nango_yaml_version || 'v2',
            enabled,
            layout_mode: localFileService.getLayoutMode(actionName, providerConfigKey, 'action')
        };
        if (action.id) {
            actionObject.id = action.id;
        }
        builtActions.push(actionObject);
    }
    return { success: true, error: null, response: builtActions };
}
export function getOffset(interval, date) {
    const intervalMilliseconds = ms(interval);
    const nowMilliseconds = date.getMinutes() * 60 * 1000 + date.getSeconds() * 1000 + date.getMilliseconds();
    const offset = nowMilliseconds % intervalMilliseconds;
    if (isNaN(offset)) {
        return 0;
    }
    return offset;
}
/**
 * Get Interval
 * @desc get the interval based on the runs property in the yaml. The offset
 * should be the amount of time that the interval should be offset by.
 * If the time is 1536 and the interval is 30m then the next time the sync should run is 1606
 * and then 1636 etc. The offset should be based on the interval and should never be
 * greater than the interval
 */
export function getInterval(runs, date) {
    if (runs === 'every half day') {
        const response = { interval: '12h', offset: getOffset('12h', date) };
        return { success: true, error: null, response };
    }
    if (runs === 'every half hour') {
        const response = { interval: '30m', offset: getOffset('30m', date) };
        return { success: true, error: null, response };
    }
    if (runs === 'every quarter hour') {
        const response = { interval: '15m', offset: getOffset('15m', date) };
        return { success: true, error: null, response };
    }
    if (runs === 'every hour') {
        const response = { interval: '1h', offset: getOffset('1h', date) };
        return { success: true, error: null, response };
    }
    if (runs === 'every day') {
        const response = { interval: '1d', offset: getOffset('1d', date) };
        return { success: true, error: null, response };
    }
    if (runs === 'every month') {
        const response = { interval: '30d', offset: getOffset('30d', date) };
        return { success: true, error: null, response };
    }
    if (runs === 'every week') {
        const response = { interval: '1w', offset: getOffset('1w', date) };
        return { success: true, error: null, response };
    }
    const interval = runs.replace('every ', '');
    if (!ms(interval)) {
        const error = new NangoError('sync_interval_invalid');
        return { success: false, error, response: null };
    }
    if (ms(interval) < ms('5m')) {
        const error = new NangoError('sync_interval_too_short');
        return { success: false, error, response: null };
    }
    const offset = getOffset(interval, date);
    const response = { interval, offset };
    return { success: true, error: null, response };
}
//# sourceMappingURL=nango-config.service.js.map