var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import semver from 'semver';
import db, { schema, dbNamespace } from '@nangohq/database';
import { getLogger } from '@nangohq/utils';
import configService from '../../config.service.js';
import remoteFileService from '../../file/remote.service.js';
import { LogActionEnum } from '../@nangohq/models/Activity.js';
import { SyncConfigType } from '../@nangohq/models/Sync.js';
import { convertV2ConfigObject } from '../../nango-config.service.js';
import errorManager, { ErrorSourceEnum } from '../../../utils/error.manager.js';
const logger = getLogger('Sync.Config');
const TABLE = dbNamespace + 'sync_configs';
const convertSyncConfigToStandardConfig = (syncConfigs) => {
    var _a, _b, _c, _d, _e;
    const nangoConfig = {
        integrations: {},
        models: {}
    };
    let isV1 = false;
    for (const syncConfig of syncConfigs) {
        if (!syncConfig) {
            continue;
        }
        const uniqueKey = syncConfig.unique_key;
        if (!uniqueKey) {
            continue;
        }
        if (!nangoConfig['integrations'][uniqueKey]) {
            nangoConfig['integrations'][uniqueKey] = {
                provider: syncConfig.provider
            };
        }
        const syncName = syncConfig.sync_name;
        const endpoint = !syncConfig.endpoints_object || ((_a = syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.endpoints_object) === null || _a === void 0 ? void 0 : _a.length) === 0
            ? null
            : syncConfig.endpoints_object.map((endpoint) => `${endpoint.method} ${endpoint.path}`);
        if (!endpoint || endpoint.length === 0) {
            isV1 = true;
        }
        const flowObject = {
            id: syncConfig.id,
            runs: syncConfig.runs,
            type: syncConfig.type,
            output: syncConfig.models,
            returns: syncConfig.models,
            description: ((_b = syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.metadata) === null || _b === void 0 ? void 0 : _b.description) || '',
            track_deletes: syncConfig.track_deletes,
            auto_start: syncConfig.auto_start,
            attributes: syncConfig.attributes || {},
            scopes: ((_c = syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.metadata) === null || _c === void 0 ? void 0 : _c.scopes) || [],
            version: syncConfig.version,
            updated_at: (_d = syncConfig.updated_at) === null || _d === void 0 ? void 0 : _d.toISOString(),
            is_public: syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.is_public,
            pre_built: syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.pre_built,
            endpoint: !syncConfig.endpoints_object || ((_e = syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.endpoints_object) === null || _e === void 0 ? void 0 : _e.length) === 0
                ? null
                : syncConfig.endpoints_object.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
            input: syncConfig.input,
            'webhook-subscriptions': syncConfig.webhook_subscriptions,
            nango_yaml_version: isV1 ? 'v1' : 'v2',
            enabled: syncConfig.enabled
        };
        if (syncConfig.type === SyncConfigType.SYNC) {
            if (!nangoConfig['integrations'][uniqueKey]['syncs']) {
                nangoConfig['integrations'][uniqueKey]['syncs'] = {};
            }
            flowObject['sync_type'] = syncConfig.sync_type;
            nangoConfig['integrations'][uniqueKey]['syncs'] = Object.assign(Object.assign({}, nangoConfig['integrations'][uniqueKey]['syncs']), { [syncName]: flowObject });
        }
        else {
            if (!nangoConfig['integrations'][uniqueKey]['actions']) {
                nangoConfig['integrations'][uniqueKey]['actions'] = {};
            }
            nangoConfig['integrations'][uniqueKey]['actions'] = Object.assign(Object.assign({}, nangoConfig['integrations'][uniqueKey]['actions']), { [syncName]: flowObject });
        }
    }
    const { success, error, response: standardConfig } = convertV2ConfigObject(nangoConfig);
    if (error) {
        logger.error(`Error in converting sync config to standard config: ${error}`);
    }
    if (!success || !standardConfig) {
        return [];
    }
    const configWithModels = standardConfig.map((config) => {
        const { providerConfigKey } = config;
        for (const sync of [...config.syncs, ...config.actions]) {
            const { name } = sync;
            const syncObject = syncConfigs.find((syncConfig) => syncConfig.sync_name === name && syncConfig.unique_key === providerConfigKey);
            const { model_schema, input } = syncObject;
            for (const model of model_schema) {
                if (Array.isArray(model.fields) && Array.isArray(model.fields[0])) {
                    model.fields = model.fields.flat();
                }
                if (model.name === input) {
                    sync.input = model;
                }
            }
            sync.models = model_schema;
        }
        return config;
    });
    return configWithModels;
};
export function getSyncConfig(nangoConnection, syncName, isAction) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let syncConfigs;
        if (!syncName) {
            syncConfigs = yield getSyncConfigsByParams(nangoConnection.environment_id, nangoConnection.provider_config_key, isAction);
            if (!syncConfigs || syncConfigs.length === 0) {
                return null;
            }
        }
        else {
            syncConfigs = yield getSyncConfigByParams(nangoConnection.environment_id, syncName, nangoConnection.provider_config_key, isAction);
            if (!syncConfigs) {
                return null;
            }
            // this is an array because sometimes we don't know the sync name, but regardless
            // we want to iterate over the sync configs
            syncConfigs = [syncConfigs];
        }
        const nangoConfig = {
            integrations: {
                [nangoConnection.provider_config_key]: {}
            },
            models: {}
        };
        for (const syncConfig of syncConfigs) {
            if (nangoConnection.provider_config_key !== undefined) {
                const key = nangoConnection.provider_config_key;
                const providerConfig = (_a = nangoConfig.integrations[key]) !== null && _a !== void 0 ? _a : {};
                const configSyncName = syncConfig.sync_name;
                const fileLocation = syncConfig.file_location;
                providerConfig[configSyncName] = {
                    sync_config_id: syncConfig.id,
                    runs: syncConfig.runs,
                    type: syncConfig.type,
                    returns: syncConfig.models,
                    input: syncConfig.input,
                    track_deletes: syncConfig.track_deletes,
                    auto_start: syncConfig.auto_start,
                    attributes: syncConfig.attributes || {},
                    fileLocation,
                    version: syncConfig.version,
                    pre_built: syncConfig.pre_built,
                    is_public: syncConfig.is_public,
                    metadata: syncConfig.metadata,
                    enabled: syncConfig.enabled
                };
                nangoConfig.integrations[key] = providerConfig;
                const models = {};
                syncConfig.model_schema.forEach((model) => {
                    if (!models[model.name]) {
                        models[model.name] = {};
                    }
                    model.fields.forEach((field) => {
                        models[model.name][field.name] = field.type;
                    });
                });
                nangoConfig.models = models;
            }
        }
        return nangoConfig;
    });
}
export function getAllSyncsAndActions(environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const syncConfigs = yield schema()
            .select(`${TABLE}.sync_name`, `${TABLE}.runs`, `${TABLE}.type`, `${TABLE}.models`, `${TABLE}.model_schema`, `${TABLE}.track_deletes`, `${TABLE}.auto_start`, `${TABLE}.attributes`, `${TABLE}.updated_at`, `${TABLE}.version`, `${TABLE}.sync_type`, `${TABLE}.metadata`, `${TABLE}.input`, `${TABLE}.enabled`, '_nango_configs.provider', '_nango_configs.unique_key', db.knex.raw(`(
                    SELECT json_agg(json_build_object('method', method, 'path', path))
                    FROM _nango_sync_endpoints
                    WHERE _nango_sync_endpoints.sync_config_id = ${TABLE}.id
                ) as endpoints_object`))
            .from(TABLE)
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            [`${TABLE}.environment_id`]: environment_id,
            [`${TABLE}.deleted`]: false,
            active: true
        });
        if (!syncConfigs) {
            return [];
        }
        const standardConfig = convertSyncConfigToStandardConfig(syncConfigs);
        return standardConfig;
    });
}
export function getSyncConfigsByParams(environment_id, providerConfigKey, isAction) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield configService.getProviderConfig(providerConfigKey, environment_id);
        if (!config) {
            throw new Error('Provider config not found');
        }
        return getSyncConfigsByConfigId(environment_id, config.id, isAction);
    });
}
export function getSyncConfigsByConfigId(environment_id, nango_config_id, isAction = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .from(TABLE)
            .where({
            environment_id,
            nango_config_id,
            active: true,
            enabled: true,
            type: isAction ? SyncConfigType.ACTION : SyncConfigType.SYNC,
            deleted: false
        });
        if (result) {
            return result;
        }
        return null;
    });
}
export function getFlowConfigsByParams(environment_id, providerConfigKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield configService.getProviderConfig(providerConfigKey, environment_id);
        if (!config) {
            throw new Error('Provider config not found');
        }
        const result = yield schema()
            .from(TABLE)
            .where({
            environment_id,
            nango_config_id: config.id,
            active: true,
            deleted: false
        });
        if (result) {
            return result;
        }
        return [];
    });
}
export function getSyncAndActionConfigsBySyncNameAndConfigId(environment_id, nango_config_id, sync_name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield schema().from(TABLE).where({
                environment_id,
                nango_config_id,
                sync_name,
                active: true,
                deleted: false
            });
            if (result) {
                return result;
            }
        }
        catch (error) {
            errorManager.report(error, {
                environmentId: environment_id,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    environment_id,
                    nango_config_id,
                    sync_name
                }
            });
        }
        return [];
    });
}
export function getActionConfigByNameAndProviderConfigKey(environment_id, name, unique_key) {
    return __awaiter(this, void 0, void 0, function* () {
        const nango_config_id = yield configService.getIdByProviderConfigKey(environment_id, unique_key);
        if (!nango_config_id) {
            return false;
        }
        const result = yield schema()
            .from(TABLE)
            .where({
            environment_id,
            nango_config_id,
            sync_name: name,
            deleted: false,
            active: true,
            type: SyncConfigType.ACTION
        })
            .first();
        if (result) {
            return true;
        }
        return false;
    });
}
export function getActionsByProviderConfigKey(environment_id, unique_key) {
    return __awaiter(this, void 0, void 0, function* () {
        const nango_config_id = yield configService.getIdByProviderConfigKey(environment_id, unique_key);
        if (!nango_config_id) {
            return [];
        }
        const result = yield schema().from(TABLE).select('sync_name as name', 'created_at', 'updated_at').where({
            environment_id,
            nango_config_id,
            deleted: false,
            active: true,
            type: SyncConfigType.ACTION
        });
        if (result) {
            return result;
        }
        return [];
    });
}
export function getUniqueSyncsByProviderConfig(environment_id, unique_key) {
    return __awaiter(this, void 0, void 0, function* () {
        const nango_config_id = yield configService.getIdByProviderConfigKey(environment_id, unique_key);
        if (!nango_config_id) {
            return [];
        }
        const result = yield schema().from(TABLE).select('sync_name as name', 'created_at', 'updated_at', 'metadata').where({
            environment_id,
            nango_config_id,
            deleted: false,
            active: true,
            type: SyncConfigType.SYNC
        });
        if (result) {
            return result;
        }
        return [];
    });
}
export function getSyncAndActionConfigByParams(environment_id, sync_name, providerConfigKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield configService.getProviderConfig(providerConfigKey, environment_id);
        if (!config) {
            throw new Error('Provider config not found');
        }
        try {
            const result = yield schema()
                .from(TABLE)
                .where({
                environment_id,
                sync_name,
                nango_config_id: config.id,
                active: true,
                deleted: false
            })
                .orderBy('created_at', 'desc')
                .first();
            if (result) {
                return result;
            }
        }
        catch (error) {
            errorManager.report(error, {
                environmentId: environment_id,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    environment_id,
                    sync_name,
                    providerConfigKey
                }
            });
            return null;
        }
        return null;
    });
}
export function getSyncConfigByParams(environment_id, sync_name, providerConfigKey, isAction) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield configService.getProviderConfig(providerConfigKey, environment_id);
        if (!config) {
            throw new Error('Provider config not found');
        }
        try {
            const result = yield schema()
                .from(TABLE)
                .where({
                environment_id,
                sync_name,
                nango_config_id: config.id,
                active: true,
                enabled: true,
                type: isAction ? SyncConfigType.ACTION : SyncConfigType.SYNC,
                deleted: false
            })
                .orderBy('created_at', 'desc')
                .first();
            if (result) {
                return result;
            }
        }
        catch (error) {
            errorManager.report(error, {
                environmentId: environment_id,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    environment_id,
                    sync_name,
                    providerConfigKey
                }
            });
            return null;
        }
        return null;
    });
}
export function deleteSyncConfig(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield schema().from(TABLE).where({ id, deleted: false }).update({
            active: false,
            deleted: true,
            deleted_at: new Date()
        });
    });
}
export function disableScriptConfig(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield schema().from(TABLE).where({ id }).update({ enabled: false });
    });
}
export function enableScriptConfig(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield schema().from(TABLE).where({ id }).update({ enabled: true });
    });
}
export function deleteByConfigId(nango_config_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield schema().from(TABLE).where({ nango_config_id, deleted: false }).update({ deleted: true, deleted_at: new Date() });
    });
}
export function deleteSyncFilesForConfig(id, environmentId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const files = yield schema().from(TABLE).where({ nango_config_id: id, deleted: false }).select('file_location').pluck('file_location');
            if (files.length > 0) {
                yield remoteFileService.deleteFiles(files);
            }
        }
        catch (error) {
            errorManager.report(error, {
                environmentId,
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.DATABASE,
                metadata: {
                    id
                }
            });
        }
    });
}
export function getActiveCustomSyncConfigsByEnvironmentId(environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .select(`${TABLE}.id`, `${TABLE}.sync_name`, `${TABLE}.runs`, `${TABLE}.models`, `${TABLE}.updated_at`, `${TABLE}.type`, '_nango_configs.provider', '_nango_configs.unique_key')
            .from(TABLE)
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            active: true,
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.deleted': false,
            pre_built: false,
            [`${TABLE}.deleted`]: false
        });
        return result;
    });
}
export function getSyncConfigsWithConnectionsByEnvironmentId(environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .select(`${TABLE}.id`, `${TABLE}.sync_name`, `${TABLE}.type`, `${TABLE}.runs`, `${TABLE}.models`, `${TABLE}.version`, `${TABLE}.updated_at`, `${TABLE}.auto_start`, `${TABLE}.pre_built`, `${TABLE}.is_public`, `${TABLE}.metadata`, '_nango_configs.provider', '_nango_configs.unique_key', db.knex.raw(`(
                    SELECT json_agg(
                        json_build_object(
                            'connection_id', _nango_connections.connection_id,
                            'metadata', _nango_connections.metadata
                        )
                    )
                    FROM _nango_connections
                    WHERE _nango_configs.environment_id = _nango_connections.environment_id
                    AND _nango_configs.unique_key = _nango_connections.provider_config_key
                    AND _nango_configs.deleted = false
                    AND _nango_connections.deleted = false
                ) as connections
                `))
            .from(TABLE)
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            '_nango_configs.environment_id': environment_id,
            active: true,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false
        });
        return result;
    });
}
export function getSyncConfigsWithConnections(providerConfigKey, environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db.knex
            .select(`${TABLE}.id`, '_nango_configs.provider', '_nango_configs.unique_key', db.knex.raw(`(
                    SELECT json_agg(
                        json_build_object(
                            'connection_id', _nango_connections.connection_id
                        )
                    )
                    FROM _nango_connections
                    WHERE _nango_configs.environment_id = _nango_connections.environment_id
                    AND _nango_configs.unique_key = _nango_connections.provider_config_key
                    AND _nango_configs.deleted = false
                    AND _nango_connections.deleted = false
                ) as connections
                `))
            .from(TABLE)
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.unique_key': providerConfigKey,
            active: true,
            enabled: true,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false
        });
        return result;
    });
}
/**
 * Get Sync Configs By Provider Key
 * @desc grab all the sync configs by a provider key
 */
export function getSyncConfigsByProviderConfigKey(environment_id, providerConfigKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .select(`${TABLE}.sync_name as name`, `${TABLE}.id`, `${TABLE}.enabled`)
            .from(TABLE)
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.unique_key': providerConfigKey,
            active: true,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false
        });
        return result;
    });
}
export function getSyncConfigByJobId(job_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .from(TABLE)
            .select(`${TABLE}.*`)
            .join('_nango_sync_jobs', `${TABLE}.id`, '_nango_sync_jobs.sync_config_id')
            .where({
            '_nango_sync_jobs.id': job_id,
            '_nango_sync_jobs.deleted': false,
            [`${TABLE}.deleted`]: false
        })
            .first()
            .orderBy(`${TABLE}.created_at`, 'desc');
        if (!result) {
            return null;
        }
        return result;
    });
}
export function getAttributes(provider_config_key, sync_name) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .from(TABLE)
            .select(`${TABLE}.attributes`)
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            '_nango_configs.unique_key': provider_config_key,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false,
            [`${TABLE}.sync_name`]: sync_name,
            [`${TABLE}.active`]: true
        })
            .first()
            .orderBy(`${TABLE}.created_at`, 'desc');
        if (!result) {
            return null;
        }
        return result.attributes;
    });
}
export function getProviderConfigBySyncAndAccount(sync_name, environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const providerConfigKey = yield schema()
            .from(TABLE)
            .select('_nango_configs.unique_key')
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            active: true,
            sync_name,
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false
        })
            .first();
        if (providerConfigKey) {
            return providerConfigKey.unique_key;
        }
        return null;
    });
}
export function increment(input) {
    if (typeof input === 'string') {
        if (input.includes('.')) {
            const valid = semver.valid(input);
            if (!valid) {
                throw new Error(`Invalid version string: ${input}`);
            }
            return semver.inc(input, 'patch');
        }
        else {
            const num = parseInt(input);
            if (isNaN(num)) {
                throw new Error(`Invalid version string segment: ${input}`);
            }
            return (num + 1).toString();
        }
    }
    else if (typeof input === 'number') {
        return input + 1;
    }
    else {
        throw new Error(`Invalid version input: ${input}`);
    }
}
export function getPublicConfig(environment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return schema()
            .from(TABLE)
            .select(`${TABLE}.*`, '_nango_configs.provider', '_nango_configs.unique_key')
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .where({
            active: true,
            pre_built: true,
            is_public: true,
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false
        });
    });
}
export function getNangoConfigIdAndLocationFromId(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .from(TABLE)
            .select(`${TABLE}.nango_config_id`, `${TABLE}.file_location`)
            .where({
            id,
            deleted: false
        })
            .first();
        if (!result) {
            return null;
        }
        return result;
    });
}
export function updateFrequency(sync_config_id, runs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield schema()
            .from(TABLE)
            .update({
            runs
        })
            .where({
            id: sync_config_id,
            deleted: false,
            active: true
        });
    });
}
export function getConfigWithEndpointsByProviderConfigKey(environment_id, provider_config_key) {
    return __awaiter(this, void 0, void 0, function* () {
        const syncConfigs = yield schema()
            .from(TABLE)
            .select(`${TABLE}.id`, `${TABLE}.metadata`, `${TABLE}.sync_name`, `${TABLE}.pre_built`, `${TABLE}.is_public`, `${TABLE}.updated_at`, `${TABLE}.version`, `${TABLE}.runs`, `${TABLE}.models`, `${TABLE}.model_schema`, `${TABLE}.input`, `${TABLE}.type`, `${TABLE}.sync_type`, `${TABLE}.track_deletes`, `${TABLE}.auto_start`, `${TABLE}.webhook_subscriptions`, `${TABLE}.enabled`, '_nango_configs.unique_key', '_nango_configs.provider', db.knex.raw(`(
                    SELECT json_agg(json_build_object('method', method, 'path', path))
                    FROM _nango_sync_endpoints
                    WHERE _nango_sync_endpoints.sync_config_id = ${TABLE}.id
                ) as endpoints_object`))
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .leftJoin('_nango_sync_endpoints', `${TABLE}.id`, '_nango_sync_endpoints.sync_config_id')
            .where({
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.unique_key': provider_config_key,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false,
            [`${TABLE}.active`]: true
        });
        if (syncConfigs.length === 0) {
            return null;
        }
        const standardConfig = convertSyncConfigToStandardConfig(syncConfigs);
        const [config] = standardConfig;
        return config;
    });
}
export function getConfigWithEndpointsByProviderConfigKeyAndName(environment_id, provider_config_key, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const syncConfigs = yield schema()
            .from(TABLE)
            .select(`${TABLE}.id`, `${TABLE}.metadata`, `${TABLE}.sync_name`, `${TABLE}.pre_built`, `${TABLE}.is_public`, `${TABLE}.updated_at`, `${TABLE}.version`, `${TABLE}.runs`, `${TABLE}.models`, `${TABLE}.model_schema`, `${TABLE}.input`, `${TABLE}.type`, `${TABLE}.sync_type`, `${TABLE}.track_deletes`, `${TABLE}.auto_start`, `${TABLE}.webhook_subscriptions`, '_nango_configs.unique_key', '_nango_configs.provider', db.knex.raw(`(
                    SELECT json_agg(json_build_object('method', method, 'path', path))
                    FROM _nango_sync_endpoints
                    WHERE _nango_sync_endpoints.sync_config_id = ${TABLE}.id
                ) as endpoints_object`))
            .join('_nango_configs', `${TABLE}.nango_config_id`, '_nango_configs.id')
            .join('_nango_sync_endpoints', `${TABLE}.id`, '_nango_sync_endpoints.sync_config_id')
            .where({
            '_nango_configs.environment_id': environment_id,
            '_nango_configs.unique_key': provider_config_key,
            '_nango_configs.deleted': false,
            [`${TABLE}.deleted`]: false,
            [`${TABLE}.sync_name`]: name,
            [`${TABLE}.active`]: true
        });
        if (syncConfigs.length === 0) {
            return null;
        }
        const standardConfig = convertSyncConfigToStandardConfig(syncConfigs);
        const [config] = standardConfig;
        return config;
    });
}
export function getAllSyncAndActionNames(environmentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema().from(TABLE).select(`${TABLE}.sync_name`).where({
            deleted: false,
            environment_id: environmentId,
            active: true
        });
        if (!result) {
            return [];
        }
        return result.map((syncConfig) => syncConfig.sync_name);
    });
}
export function getSyncConfigsByConfigIdForWebhook(environment_id, nango_config_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schema()
            .from(TABLE)
            .where({
            environment_id,
            nango_config_id,
            active: true,
            deleted: false
        })
            .whereRaw('webhook_subscriptions IS NOT NULL and array_length(webhook_subscriptions, 1) > 0');
        return result;
    });
}
export function getSyncConfigRaw(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = db.knex
            .select('*')
            .where({
            environment_id: opts.environmentId,
            sync_name: opts.name,
            nango_config_id: opts.config_id,
            active: true,
            enabled: true,
            type: opts.isAction ? SyncConfigType.ACTION : SyncConfigType.SYNC,
            deleted: false
        })
            .from(TABLE)
            .first();
        const res = yield query;
        return res || null;
    });
}
//# sourceMappingURL=config.service.js.map