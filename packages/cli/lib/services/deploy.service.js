var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from 'chalk';
import promptly from 'promptly';
import { AxiosError } from 'axios';
import { SyncConfigType, localFileService, getInterval, stagingHost, cloudHost } from '@nangohq/shared';
import configService from './config.service.js';
import { compileAllFiles } from './compile.service.js';
import verificationService from './verification.service.js';
import { printDebug, parseSecretKey, port, enrichHeaders, http } from '../utils.js';
class DeployService {
    admin({ fullPath, environmentName, debug = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield verificationService.necessaryFilesExist({ fullPath, autoConfirm: false });
            yield parseSecretKey(environmentName, debug);
            if (!process.env['NANGO_HOSTPORT']) {
                switch (environmentName) {
                    case 'local':
                        process.env['NANGO_HOSTPORT'] = `http://localhost:${port}`;
                        break;
                    case 'staging':
                        process.env['NANGO_HOSTPORT'] = stagingHost;
                        break;
                    default:
                        process.env['NANGO_HOSTPORT'] = cloudHost;
                        break;
                }
            }
            if (debug) {
                printDebug(`NANGO_HOSTPORT is set to ${process.env['NANGO_HOSTPORT']}.`);
                printDebug(`Environment is set to ${environmentName}`);
            }
            const successfulCompile = yield compileAllFiles({ fullPath, debug });
            if (!successfulCompile) {
                console.log(chalk.red('Compilation was not fully successful. Please make sure all files compile before deploying'));
                process.exit(1);
            }
            const { success, error, response: config } = yield configService.load(fullPath, debug);
            if (!success || !config) {
                console.log(chalk.red(error === null || error === void 0 ? void 0 : error.message));
                return;
            }
            const flowData = this.package(config, debug);
            if (!flowData) {
                return;
            }
            const targetAccountUUID = yield promptly.prompt('Input the account uuid to deploy to: ');
            if (!targetAccountUUID) {
                console.log(chalk.red('Account uuid is required. Exiting'));
                return;
            }
            const url = process.env['NANGO_HOSTPORT'] + `/admin/flow/deploy/pre-built`;
            const nangoYamlBody = localFileService.getNangoYamlFileContents('./');
            try {
                yield http
                    .post(url, { targetAccountUUID, targetEnvironment: environmentName, config: flowData, nangoYamlBody }, { headers: enrichHeaders() })
                    .then(() => {
                    console.log(chalk.green(`Successfully deployed the syncs/actions to the users account.`));
                })
                    .catch((err) => {
                    var _a;
                    const errorMessage = JSON.stringify(err instanceof AxiosError ? (_a = err.response) === null || _a === void 0 ? void 0 : _a.data : err, null, 2);
                    console.log(chalk.red(`Error deploying the syncs/actions with the following error: ${errorMessage}`));
                    process.exit(1);
                });
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    prep({ fullPath, options, environment, debug = false }) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { env, version, sync: optionalSyncName, action: optionalActionName, autoConfirm } = options;
            yield verificationService.necessaryFilesExist({ fullPath, autoConfirm });
            yield parseSecretKey(environment, debug);
            if (!process.env['NANGO_HOSTPORT']) {
                switch (env) {
                    case 'local':
                        process.env['NANGO_HOSTPORT'] = `http://localhost:${port}`;
                        break;
                    case 'staging':
                        process.env['NANGO_HOSTPORT'] = stagingHost;
                        break;
                    default:
                        process.env['NANGO_HOSTPORT'] = cloudHost;
                        break;
                }
            }
            if (debug) {
                printDebug(`NANGO_HOSTPORT is set to ${process.env['NANGO_HOSTPORT']}.`);
                printDebug(`Environment is set to ${environment}`);
            }
            const singleDeployMode = Boolean(optionalSyncName || optionalActionName);
            const successfulCompile = yield compileAllFiles({ fullPath, debug });
            if (!successfulCompile) {
                console.log(chalk.red('Compilation was not fully successful. Please make sure all files compile before deploying'));
                process.exit(1);
            }
            const { success, error, response: config } = yield configService.load(fullPath, debug);
            if (!success || !config) {
                console.log(chalk.red(error === null || error === void 0 ? void 0 : error.message));
                return;
            }
            const postData = this.package(config, debug, version, optionalSyncName, optionalActionName);
            if (!postData) {
                return;
            }
            const { flowConfigs, postConnectionScriptsByProvider } = postData;
            const url = process.env['NANGO_HOSTPORT'] + `/sync/deploy`;
            const nangoYamlBody = localFileService.getNangoYamlFileContents('./');
            if (process.env['NANGO_DEPLOY_AUTO_CONFIRM'] !== 'true' && !autoConfirm) {
                const confirmationUrl = process.env['NANGO_HOSTPORT'] + `/sync/deploy/confirmation`;
                try {
                    const response = yield http.post(confirmationUrl, { flowConfigs, postConnectionScriptsByProvider, reconcile: false, debug, singleDeployMode }, { headers: enrichHeaders() });
                    console.log(JSON.stringify(response.data, null, 2));
                    const { newSyncs, deletedSyncs } = response.data;
                    for (const sync of newSyncs) {
                        const actionMessage = sync.connections === 0 || sync.auto_start === false
                            ? 'The sync will be added to your Nango instance if you deploy.'
                            : `Nango will start syncing the corresponding data for ${sync.connections} existing connections.`;
                        console.log(chalk.yellow(`Sync "${sync.name}" is new. ${actionMessage}`));
                    }
                    for (const sync of deletedSyncs) {
                        console.log(chalk.red(`Sync "${sync.name}" has been removed. It will stop running and the corresponding data will be deleted for ${sync.connections} existing connections.`));
                    }
                    const confirmation = yield promptly.confirm('Do you want to continue y/n?');
                    if (confirmation) {
                        yield this.run(url, { flowConfigs, postConnectionScriptsByProvider, nangoYamlBody, reconcile: true, debug, singleDeployMode });
                    }
                    else {
                        console.log(chalk.red('Syncs/Actions were not deployed. Exiting'));
                        process.exit(0);
                    }
                }
                catch (err) {
                    if ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) {
                        console.log(chalk.red(err.response.data.error));
                        process.exit(1);
                    }
                    let errorMessage;
                    if (err instanceof AxiosError) {
                        const errorObject = { message: err.message, stack: err.stack, code: err.code, status: err.status, url, method: (_c = err.config) === null || _c === void 0 ? void 0 : _c.method };
                        errorMessage = JSON.stringify(errorObject, null, 2);
                    }
                    else {
                        errorMessage = JSON.stringify(err, null, 2);
                    }
                    console.log(chalk.red(`Error deploying the syncs/actions with the following error: ${errorMessage}`));
                    process.exit(1);
                }
            }
            else {
                if (debug) {
                    printDebug(`Auto confirm is set so deploy will start without confirmation`);
                }
                yield this.run(url, { flowConfigs, postConnectionScriptsByProvider, nangoYamlBody, reconcile: true, debug, singleDeployMode });
            }
        });
    }
    run(url, body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield http
                .post(url, body, { headers: enrichHeaders() })
                .then((response) => {
                const results = response.data;
                if (results.length === 0) {
                    console.log(chalk.green(`Successfully removed the syncs/actions.`));
                }
                else {
                    const nameAndVersions = results.map((result) => `${result.sync_name || result.name}@v${result.version}`);
                    console.log(chalk.green(`Successfully deployed the syncs/actions: ${nameAndVersions.join(', ')}!`));
                }
            })
                .catch((err) => {
                var _a;
                const errorMessage = err instanceof AxiosError ? JSON.stringify((_a = err.response) === null || _a === void 0 ? void 0 : _a.data, null, 2) : JSON.stringify(err, ['message', 'name', 'stack'], 2);
                console.log(chalk.red(`Error deploying the syncs/actions with the following error: ${errorMessage}`));
                process.exit(1);
            });
        });
    }
    package(config, debug, version = '', optionalSyncName = '', optionalActionName = '') {
        var _a, _b;
        const postData = [];
        const postConnectionScriptsByProvider = [];
        for (const integration of config) {
            const { providerConfigKey, postConnectionScripts } = integration;
            let { syncs, actions } = integration;
            if (postConnectionScripts && postConnectionScripts.length > 0) {
                postConnectionScriptsByProvider.push({
                    providerConfigKey,
                    scripts: postConnectionScripts.map((name) => {
                        return {
                            name,
                            fileBody: {
                                js: localFileService.getIntegrationFile(name, providerConfigKey, './'),
                                ts: localFileService.getIntegrationTsFile(name, providerConfigKey, 'post-connection-script')
                            }
                        };
                    })
                });
            }
            let flows = [...syncs, ...actions];
            if (optionalSyncName) {
                syncs = syncs.filter((sync) => sync.name === optionalSyncName);
                flows = syncs;
            }
            if (optionalActionName) {
                actions = actions.filter((action) => action.name === optionalActionName);
                flows = actions;
            }
            if (optionalSyncName && optionalActionName) {
                flows = [...syncs, ...actions];
            }
            for (const flow of flows) {
                const { name: syncName, runs = '', returns: models, models: model_schema, type = SyncConfigType.SYNC } = flow;
                const { path: integrationFilePath, result: integrationFileResult } = localFileService.checkForIntegrationDistFile(syncName, providerConfigKey, './');
                const metadata = {};
                if (flow.description) {
                    metadata['description'] = flow.description;
                }
                if (flow.scopes) {
                    metadata['scopes'] = flow.scopes;
                }
                if (!integrationFileResult) {
                    console.log(chalk.red(`No integration file found for ${syncName} at ${integrationFilePath}. Skipping...`));
                    continue;
                }
                if (type !== SyncConfigType.SYNC && type !== SyncConfigType.ACTION) {
                    console.log(chalk.red(`The sync ${syncName} has an invalid type "${type}". The type must be either ${SyncConfigType.SYNC} or${SyncConfigType.ACTION}. Skipping...`));
                }
                if (type === SyncConfigType.SYNC && !runs) {
                    console.log(chalk.red(`The sync ${syncName} is missing the "runs" property. Skipping...`));
                    continue;
                }
                if (runs && type === SyncConfigType.SYNC) {
                    const { success, error } = getInterval(runs, new Date());
                    if (!success) {
                        console.log(chalk.red(`The sync ${syncName} has an issue with the sync interval "${runs}": ${error === null || error === void 0 ? void 0 : error.message}`));
                        return null;
                    }
                }
                if (debug) {
                    printDebug(`Integration file found for ${syncName} at ${integrationFilePath}`);
                }
                if ((_a = flow.input) === null || _a === void 0 ? void 0 : _a.fields) {
                    model_schema.push(flow.input);
                }
                const body = {
                    syncName,
                    providerConfigKey,
                    models: Array.isArray(models) ? models : [models],
                    version: version,
                    runs,
                    track_deletes: flow.track_deletes || false,
                    auto_start: flow.auto_start === false ? false : true,
                    attributes: flow.attributes || {},
                    metadata: metadata || {},
                    input: ((_b = flow.input) === null || _b === void 0 ? void 0 : _b.name) || '',
                    sync_type: flow.sync_type,
                    type,
                    fileBody: {
                        js: localFileService.getIntegrationFile(syncName, providerConfigKey, './'),
                        ts: localFileService.getIntegrationTsFile(syncName, providerConfigKey, type)
                    },
                    model_schema: JSON.stringify(model_schema),
                    endpoints: flow.endpoints,
                    webhookSubscriptions: flow.webhookSubscriptions || []
                };
                postData.push(body);
            }
        }
        if (debug && postConnectionScriptsByProvider) {
            for (const postConnectionScriptByProvider of postConnectionScriptsByProvider) {
                const { providerConfigKey, scripts } = postConnectionScriptByProvider;
                for (const script of scripts) {
                    const { name } = script;
                    printDebug(`Post connection script found for ${providerConfigKey} with name ${name}`);
                }
            }
        }
        return { flowConfigs: postData, postConnectionScriptsByProvider };
    }
}
const deployService = new DeployService();
export default deployService;
//# sourceMappingURL=deploy.service.js.map