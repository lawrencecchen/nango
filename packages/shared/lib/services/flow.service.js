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
import yaml from 'js-yaml';
import path from 'path';
import fs from 'fs';
import { stringifyError } from '@nangohq/utils';
import { dirname } from '../utils/utils.js';
import { getPublicConfig } from './sync/config/config.service.js';
import { loadStandardConfig } from './nango-config.service.js';
import remoteFileService from './file/remote.service.js';
import { errorManager } from '../index.js';
class FlowService {
    getAllAvailableFlows() {
        try {
            const flowPath = path.join(dirname(import.meta.url), '../../flows.yaml');
            const flows = yaml.load(fs.readFileSync(flowPath).toString());
            if (flows === undefined || !('integrations' in flows) || Object.keys(flows.integrations).length <= 0) {
                throw new Error('empty_flows');
            }
            return flows;
        }
        catch (err) {
            errorManager.report(`failed_to_find_flows, ${stringifyError(err)}`);
            return {};
        }
    }
    getAllAvailableFlowsAsStandardConfig() {
        const config = this.getAllAvailableFlows();
        const { integrations: allIntegrations } = config;
        const standardConfig = [];
        for (const providerConfigKey in allIntegrations) {
            const integrations = allIntegrations[providerConfigKey];
            const { models, rawName } = integrations, flow = __rest(integrations, ["models", "rawName"]);
            const nangoConfig = {
                integrations: {
                    [providerConfigKey]: flow
                },
                models: models
            };
            const { success, response } = loadStandardConfig(nangoConfig, false, true);
            if (success && response) {
                if (rawName) {
                    const responseWithRaw = response.map((standardConfigItem) => {
                        return Object.assign(Object.assign({}, standardConfigItem), { rawName });
                    });
                    standardConfig.push(...responseWithRaw);
                }
                else {
                    standardConfig.push(...response);
                }
            }
        }
        return standardConfig;
    }
    getFlow(name) {
        const integrations = this.getAllAvailableFlowsAsStandardConfig();
        for (const integration of integrations) {
            for (const syncs of integration.syncs) {
                if (syncs.name === name) {
                    return syncs;
                }
            }
            for (const actions of integration.actions) {
                if (actions.name === name) {
                    return actions;
                }
            }
        }
        return null;
    }
    getSingleFlowAsStandardConfig(name) {
        const integrations = this.getAllAvailableFlowsAsStandardConfig();
        let standardConfig = {};
        for (const integration of integrations) {
            for (const syncs of integration.syncs) {
                if (syncs.name === name) {
                    standardConfig = integration;
                    standardConfig.syncs = [syncs];
                    standardConfig.actions = [];
                    return standardConfig;
                }
            }
            for (const actions of integration.actions) {
                if (actions.name === name) {
                    standardConfig = integration;
                    standardConfig.actions = [actions];
                    standardConfig.syncs = [];
                    return standardConfig;
                }
            }
        }
        return null;
    }
    getActionAsNangoConfig(provider, name) {
        const integrations = this.getAllAvailableFlowsAsStandardConfig();
        let foundAction = null;
        let foundProvider = '';
        for (const integration of integrations) {
            if (integration.providerConfigKey === provider) {
                foundProvider = integration.rawName || provider;
                for (const action of integration.actions) {
                    if (action.name === name) {
                        foundAction = action;
                    }
                }
            }
        }
        if (!foundAction) {
            return null;
        }
        const nangoConfig = {
            integrations: {
                [foundProvider]: {
                    [foundAction.name]: {
                        sync_config_id: foundAction.id,
                        runs: '',
                        type: foundAction.type,
                        returns: foundAction.returns,
                        input: foundAction.input,
                        track_deletes: false,
                        auto_start: false,
                        attributes: foundAction.attributes,
                        fileLocation: remoteFileService.getRemoteFileLocationForPublicTemplate(foundProvider, foundAction.name),
                        version: '1',
                        pre_built: true,
                        is_public: true,
                        metadata: {
                            description: foundAction.description,
                            scopes: foundAction.scopes
                        }
                    }
                }
            },
            models: {}
        };
        return nangoConfig;
    }
    getPublicActionByPathAndMethod(provider, path, method) {
        let foundAction = null;
        const integrations = this.getAllAvailableFlowsAsStandardConfig();
        for (const integration of integrations) {
            if (integration.providerConfigKey === provider) {
                for (const action of integration.actions) {
                    const endpoints = Array.isArray(action.endpoints) ? action.endpoints : [action.endpoints];
                    for (const endpoint of endpoints) {
                        if (endpoint[method] && endpoint[method] === path) {
                            foundAction = action.name;
                        }
                    }
                }
            }
        }
        return foundAction;
    }
    getAddedPublicFlows(environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return getPublicConfig(environmentId);
        });
    }
}
export default new FlowService();
//# sourceMappingURL=flow.service.js.map