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
import db from '@nangohq/database';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { isCloud, nanoid } from '@nangohq/utils';
import { dirname } from '../utils/utils.js';
import { NangoError } from '../utils/error.js';
import encryptionManager from '../utils/encryption.manager.js';
import syncManager from './sync/manager.service.js';
import { deleteSyncFilesForConfig, deleteByConfigId as deleteSyncConfigByConfigId } from '../services/sync/config/config.service.js';
import environmentService from '../services/environment.service.js';
class ConfigService {
    constructor() {
        this.templates = this.getTemplatesFromFile();
    }
    getTemplatesFromFile() {
        const templatesPath = () => {
            // find the providers.yaml file
            // recursively searching in parent directories
            const findProvidersYaml = (dir) => {
                const providersYamlPath = path.join(dir, 'providers.yaml');
                if (fs.existsSync(providersYamlPath)) {
                    return providersYamlPath;
                }
                const parentDir = path.dirname(dir);
                if (parentDir === dir) {
                    throw new NangoError('providers_yaml_not_found');
                }
                return findProvidersYaml(parentDir);
            };
            return findProvidersYaml(dirname());
        };
        try {
            const fileEntries = yaml.load(fs.readFileSync(templatesPath()).toString());
            if (fileEntries == null) {
                throw new NangoError('provider_template_loading_failed');
            }
            for (const key in fileEntries) {
                const entry = fileEntries[key];
                if (entry === null || entry === void 0 ? void 0 : entry.alias) {
                    let hasOverrides = false;
                    let templateOverrides;
                    if (Object.keys(fileEntries[key]).length > 0) {
                        const { alias } = entry, overrides = __rest(entry, ["alias"]);
                        hasOverrides = true;
                        templateOverrides = overrides;
                    }
                    const aliasData = fileEntries[entry.alias];
                    if (hasOverrides) {
                        fileEntries[key] = Object.assign(Object.assign({}, aliasData), templateOverrides);
                    }
                }
            }
            return fileEntries;
        }
        catch (_) {
            return null;
        }
    }
    getProviderName(providerConfigKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('provider').from(`_nango_configs`).where({ unique_key: providerConfigKey, deleted: false });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].provider;
        });
    }
    getIdByProviderConfigKey(environment_id, providerConfigKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('id')
                .from(`_nango_configs`)
                .where({ unique_key: providerConfigKey, environment_id, deleted: false });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].id;
        });
    }
    getProviderConfigByUuid(providerConfigKey, environment_uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!providerConfigKey) {
                throw new NangoError('missing_provider_config');
            }
            if (!environment_uuid) {
                throw new NangoError('missing_environment_uuid');
            }
            const environment_id = yield environmentService.getIdByUuid(environment_uuid);
            if (!environment_id) {
                return null;
            }
            return this.getProviderConfig(providerConfigKey, environment_id);
        });
    }
    getProviderConfig(providerConfigKey, environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('*')
                .from(`_nango_configs`)
                .where({ unique_key: providerConfigKey, environment_id, deleted: false })
                .first();
            if (!result) {
                return null;
            }
            return encryptionManager.decryptProviderConfig(result);
        });
    }
    listProviderConfigs(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield db.knex.select('*').from(`_nango_configs`).where({ environment_id, deleted: false }))
                .map((config) => encryptionManager.decryptProviderConfig(config))
                .filter((config) => config != null);
        });
    }
    listProviderConfigsByProvider(environment_id, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield db.knex.select('*').from(`_nango_configs`).where({ environment_id, provider, deleted: false }))
                .map((config) => encryptionManager.decryptProviderConfig(config))
                .filter((config) => config != null);
        });
    }
    getAllNames(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = yield this.listProviderConfigs(environment_id);
            return configs.map((config) => config.unique_key);
        });
    }
    createProviderConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const configToInsert = config.oauth_client_secret ? encryptionManager.encryptProviderConfig(config) : config;
            return db.knex.from(`_nango_configs`).insert(configToInsert, ['id']);
        });
    }
    createEmptyProviderConfig(provider, environment_id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield db.knex
                .count('*')
                .from(`_nango_configs`)
                .where({ provider, environment_id, deleted: false })
                .first();
            const config = {
                environment_id,
                unique_key: (exists === null || exists === void 0 ? void 0 : exists.count) === '0' ? provider : `${provider}-${nanoid(4).toLocaleLowerCase()}`,
                provider
            };
            const id = yield this.createProviderConfig(config);
            if (!id || id.length === 0) {
                throw new NangoError('unknown_provider_config');
            }
            return { id: (_a = id[0]) === null || _a === void 0 ? void 0 : _a.id, unique_key: config.unique_key };
        });
    }
    deleteProviderConfig(providerConfigKey, environment_id, orchestrator) {
        return __awaiter(this, void 0, void 0, function* () {
            const idResult = (yield db.knex.select('id').from(`_nango_configs`).where({ unique_key: providerConfigKey, environment_id, deleted: false }))[0];
            if (!idResult) {
                throw new NangoError('unknown_provider_config');
            }
            const { id } = idResult;
            yield syncManager.deleteSyncsByProviderConfig(environment_id, providerConfigKey, orchestrator);
            if (isCloud) {
                const config = yield this.getProviderConfig(providerConfigKey, environment_id);
                yield deleteSyncFilesForConfig(config === null || config === void 0 ? void 0 : config.id, environment_id);
            }
            yield deleteSyncConfigByConfigId(id);
            yield db.knex.from(`_nango_configs`).where({ id, deleted: false }).update({ deleted: true, deleted_at: new Date() });
            return db.knex
                .from(`_nango_connections`)
                .where({ provider_config_key: providerConfigKey, environment_id, deleted: false })
                .update({ deleted: true, deleted_at: new Date() });
        });
    }
    editProviderConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex
                .from(`_nango_configs`)
                .where({ unique_key: config.unique_key, environment_id: config.environment_id, deleted: false })
                .update(encryptionManager.encryptProviderConfig(config));
        });
    }
    editProviderConfigName(providerConfigKey, newUniqueKey, environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex
                .from(`_nango_configs`)
                .where({ unique_key: providerConfigKey, environment_id, deleted: false })
                .update({ unique_key: newUniqueKey });
        });
    }
    checkProviderTemplateExists(provider) {
        if (this.templates == null) {
            throw new NangoError('provider_template_loading_failed');
        }
        return provider in this.templates;
    }
    getTemplate(provider) {
        if (this.templates == null) {
            throw new NangoError('unknown_provider_template_in_config');
        }
        const template = this.templates[provider];
        if (template == null) {
            throw new NangoError('unknown_provider_template_in_config');
        }
        return template;
    }
    getTemplates() {
        if (this.templates == null) {
            throw new NangoError('provider_template_loading_failed');
        }
        return this.templates;
    }
    getConfigIdByProvider(provider, environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('id', 'unique_key')
                .from(`_nango_configs`)
                .where({ provider, environment_id, deleted: false })
                .first();
            if (!result) {
                return null;
            }
            return result;
        });
    }
    getConfigIdByProviderConfigKey(providerConfigKey, environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('id')
                .from(`_nango_configs`)
                .where({ unique_key: providerConfigKey, environment_id, deleted: false })
                .first();
            if (!result) {
                return null;
            }
            return result.id;
        });
    }
}
export default new ConfigService();
//# sourceMappingURL=config.service.js.map