var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios, { AxiosError } from 'axios';
import fs from 'fs';
import os from 'os';
import npa from 'npm-package-arg';
import Module from 'node:module';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';
import util from 'util';
import { exec, spawn } from 'child_process';
import promptly from 'promptly';
import chalk from 'chalk';
import { SyncConfigType, cloudHost, stagingHost, NANGO_VERSION } from '@nangohq/shared';
import * as dotenv from 'dotenv';
import { state } from './state.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = Module.createRequire(import.meta.url);
dotenv.config();
const execPromise = util.promisify(exec);
export const NANGO_INTEGRATIONS_NAME = 'nango-integrations';
export const NANGO_INTEGRATIONS_LOCATION = process.env['NANGO_INTEGRATIONS_LOCATION'] || './';
const IGNORE_UPGRADE_FOR = 86400 * 1000;
export const port = process.env['NANGO_PORT'] || '3003';
let parsedHostport = process.env['NANGO_HOSTPORT'] || cloudHost;
if (parsedHostport.slice(-1) === '/') {
    parsedHostport = parsedHostport.slice(0, -1);
}
export const hostport = parsedHostport;
export function setCloudHost() {
    process.env['NANGO_HOSTPORT'] = cloudHost;
}
export function setStagingHost() {
    process.env['NANGO_HOSTPORT'] = stagingHost;
}
export function printDebug(message) {
    console.log(chalk.gray(message));
}
export function isGlobal(packageName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { stdout } = yield execPromise(`npm list -g --depth=0 ${packageName}`);
            return stdout.includes(packageName);
        }
        catch (err) {
            console.error(`Error checking if package is global: ${err}`);
            return false;
        }
    });
}
export function isLocallyInstalled(packageName, debug = false) {
    try {
        let dir = __dirname;
        const npxCacheDir = path.join(os.homedir(), '.npm/_npx');
        while (dir !== path.resolve(dir, '..')) {
            const packageJsonPath = path.resolve(dir, 'package.json');
            if (dir.startsWith(npxCacheDir)) {
                if (debug) {
                    printDebug(`Ignoring npx cache directory: ${dir} while trying to find if nango is locally installed.`);
                }
            }
            else if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const dependencies = packageJson.dependencies || {};
                const devDependencies = packageJson.devDependencies || {};
                if (packageName in dependencies || packageName in devDependencies) {
                    return true;
                }
            }
            dir = path.resolve(dir, '..');
        }
        return false;
    }
    catch (err) {
        console.error(`Error checking if package is installed: ${err}`);
        return false;
    }
}
export function checkEnvVars(optionalHostport) {
    const hostport = optionalHostport || process.env['NANGO_HOSTPORT'] || `http://localhost:${port}`;
    if (hostport === `http://localhost:${port}`) {
        console.log(`Assuming you are running Nango on localhost:${port} because you did not set the NANGO_HOSTPORT env var.\n\n`);
    }
    else if (hostport === cloudHost || hostport === stagingHost) {
        if (!process.env['NANGO_SECRET_KEY']) {
            console.log(`Assuming you are using Nango Cloud but you are missing the NANGO_SECRET_KEY env var.`);
        }
        else if (hostport === cloudHost) {
            console.log(`Assuming you are using Nango Cloud (because you set the NANGO_HOSTPORT env var to https://api.nango.dev).`);
        }
        else if (hostport === stagingHost) {
            console.log(`Assuming you are using Nango Cloud (because you set the NANGO_HOSTPORT env var to https://api.staging.nango.dev).`);
        }
    }
    else {
        console.log(`Assuming you are self-hosting Nango (because you set the NANGO_HOSTPORT env var to ${hostport}).`);
    }
}
export function getPkgVersion() {
    return NANGO_VERSION;
}
export function upgradeAction(debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const isRunViaNpx = process.argv.some((arg) => arg.includes('npx'));
        const locallyInstalled = isLocallyInstalled('nango', debug);
        if (debug) {
            printDebug(`Is run via npx: ${isRunViaNpx}. Is locally installed: ${locallyInstalled}`);
        }
        if (!locallyInstalled && isRunViaNpx) {
            console.log(chalk.red(`It appears you are running nango via npx. We recommend installing nango globally ("npm install nango -g") and running it directly.`));
            process.exit(1);
        }
        if (process.env['NANGO_CLI_UPGRADE_MODE'] === 'ignore') {
            return;
        }
        const ignoreState = state.get('lastIgnoreUpgrade');
        if (typeof ignoreState === 'number' && ignoreState > Date.now() - IGNORE_UPGRADE_FOR) {
            if (debug) {
                printDebug(`Upgrade action skipped.`);
            }
            return;
        }
        try {
            const resolved = npa('nango');
            const version = getPkgVersion();
            if (debug) {
                printDebug(`Version ${version} of nango is installed.`);
            }
            const response = yield http.get(`https://registry.npmjs.org/${resolved.name}`);
            const latestVersion = response.data['dist-tags'].latest;
            if (debug) {
                printDebug(`Latest version of ${resolved.name} is ${latestVersion}.`);
            }
            if (!semver.gt(latestVersion, version)) {
                return;
            }
            console.log(chalk.red(`A new version of ${resolved.name} is available: ${latestVersion}`));
            const cwd = process.cwd();
            const upgrade = process.env['NANGO_CLI_UPGRADE_MODE'] === 'auto' || (yield promptly.confirm('Would you like to upgrade? (yes/no)'));
            if (!upgrade) {
                state.set('lastIgnoreUpgrade', Date.now());
                return;
            }
            console.log(chalk.yellow(`Upgrading ${resolved.name} to version ${latestVersion}...`));
            const packagePath = getPackagePath();
            const usePnpm = path.resolve(packagePath, '..').includes('.pnpm');
            let args = [];
            if (usePnpm) {
                if (locallyInstalled) {
                    args = ['add', `nango@${latestVersion}`];
                }
                else {
                    args = ['add', '-g', `nango@${latestVersion}`];
                }
            }
            else {
                if (locallyInstalled) {
                    args = ['install', '--no-audit', '--save', `nango@${latestVersion}`];
                }
                else {
                    args = ['install', '-g', '--no-audit', `nango@${latestVersion}`];
                }
            }
            if (debug) {
                printDebug(`Running npm ${args.join(' ')}`);
            }
            const child = spawn('npm', args, {
                cwd,
                detached: false,
                stdio: 'inherit'
            });
            yield new Promise((resolve, reject) => {
                child.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Upgrade process exited with code ${code}`));
                        return;
                    }
                    resolve(true);
                    console.log(chalk.green(`Successfully upgraded ${resolved.name} to version ${latestVersion}`));
                });
                child.on('error', reject);
            });
        }
        catch (error) {
            console.error(`An error occurred: ${error.message}`);
        }
    });
}
export function getConnection(providerConfigKey, connectionId, setHeaders, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = process.env['NANGO_HOSTPORT'] + `/connection/${connectionId}`;
        const headers = enrichHeaders(setHeaders);
        if (debug) {
            printDebug(`getConnection endpoint to the URL: ${url} with headers: ${JSON.stringify(headers, null, 2)}`);
        }
        return yield http
            .get(url, { params: { provider_config_key: providerConfigKey }, headers })
            .then((res) => {
            return res.data;
        })
            .catch((err) => {
            var _a;
            console.log(`❌ ${err instanceof AxiosError ? (_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error : JSON.stringify(err, ['message'])}`);
        });
    });
}
export function getConfig(providerConfigKey, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = process.env['NANGO_HOSTPORT'] + `/config/${providerConfigKey}`;
        const headers = enrichHeaders();
        if (debug) {
            printDebug(`getConfig endpoint to the URL: ${url} with headers: ${JSON.stringify(headers, null, 2)}`);
        }
        return yield http
            .get(url, { headers })
            .then((res) => {
            return res.data;
        })
            .catch((err) => {
            var _a;
            console.log(`❌ ${err instanceof AxiosError ? (_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error : JSON.stringify(err, ['message'])}`);
        });
    });
}
export function enrichHeaders(headers = {}) {
    headers['Authorization'] = 'Bearer ' + process.env['NANGO_SECRET_KEY'];
    headers['Accept-Encoding'] = 'application/json';
    return headers;
}
export const http = axios.create({
    headers: { 'User-Agent': getUserAgent() }
});
export function getUserAgent() {
    const clientVersion = getPkgVersion();
    const nodeVersion = process.versions.node;
    const osName = os.platform().replace(' ', '_');
    const osVersion = os.release().replace(' ', '_');
    return `nango-cli/${clientVersion} (${osName}/${osVersion}; node.js/${nodeVersion})`;
}
export function getFieldType(rawField, debug = false) {
    if (typeof rawField === 'string') {
        let field = rawField;
        let hasNull = false;
        let hasUndefined = false;
        let tsType = '';
        if (field.includes('null')) {
            field = field.replace(/\s*\|\s*null\s*/g, '');
            hasNull = true;
        }
        if (field === 'undefined') {
            if (debug) {
                printDebug(`Field is defined undefined which isn't recommended.`);
            }
            return 'undefined';
        }
        if (field.includes('undefined')) {
            field = field.replace(/\s*\|\s*undefined\s*/g, '');
            hasUndefined = true;
        }
        switch (field) {
            case 'boolean':
            case 'bool':
                tsType = 'boolean';
                break;
            case 'string':
                tsType = 'string';
                break;
            case 'char':
                tsType = 'string';
                break;
            case 'integer':
            case 'int':
            case 'number':
                tsType = 'number';
                break;
            case 'date':
                tsType = 'Date';
                break;
            default:
                tsType = field;
        }
        if (hasNull) {
            tsType = `${tsType} | null`;
        }
        if (hasUndefined) {
            tsType = `${tsType} | undefined`;
        }
        return tsType;
    }
    else {
        try {
            const nestedFields = Object.keys(rawField)
                .map((fieldName) => `  ${fieldName}: ${getFieldType(rawField[fieldName])};`)
                .join('\n');
            return `{\n${nestedFields}\n}`;
        }
        catch (_) {
            console.log(chalk.red(`Failed to parse field ${rawField} so just returning it back as a string`));
            return String(rawField);
        }
    }
}
export function buildInterfaces(models, integrations, debug = false) {
    const returnedModels = Object.keys(integrations).reduce((acc, providerConfigKey) => {
        const syncObject = integrations[providerConfigKey];
        const syncNames = Object.keys(syncObject);
        for (const syncName of syncNames) {
            const syncData = syncObject[syncName];
            if (syncData.returns) {
                const syncReturns = Array.isArray(syncData.returns) ? syncData.returns : [syncData.returns];
                syncReturns.forEach((modelName) => {
                    if (!acc.includes(modelName)) {
                        acc.push(modelName);
                    }
                });
            }
        }
        return acc;
    }, []);
    if (!models) {
        return null;
    }
    const interfaceDefinitions = Object.keys(models).map((modelName) => {
        const fields = models[modelName];
        // we only care that models that are returned have an ID field
        // if the model is not returned from a sync script then it must be a
        // helper model that is used to build the returned models
        const syncForModel = Object.keys(integrations).find((providerConfigKey) => {
            const syncObject = integrations[providerConfigKey];
            const syncNames = Object.keys(syncObject);
            for (const syncName of syncNames) {
                const syncData = syncObject[syncName];
                if (syncData.returns && syncData.type !== SyncConfigType.ACTION) {
                    return syncData.returns.includes(modelName);
                }
            }
            return false;
        });
        if (returnedModels.includes(modelName) && !fields['id'] && syncForModel) {
            throw new Error(`Model "${modelName}" doesn't have an id field. This is required to be able to uniquely identify the data record.`);
        }
        const singularModelName = modelName.charAt(modelName.length - 1) === 's' ? modelName.slice(0, -1) : modelName;
        const interfaceName = `${singularModelName.charAt(0).toUpperCase()}${singularModelName.slice(1)}`;
        let extendsClause = '';
        const fieldDefinitions = Object.keys(fields)
            .filter((fieldName) => {
            if (fieldName === '__extends') {
                const fieldModel = fields[fieldName];
                const multipleExtends = fieldModel.split(',').map((e) => e.trim());
                extendsClause = ` extends ${multipleExtends.join(', ')}`;
                return false;
            }
            return true;
        })
            .map((fieldName) => {
            const fieldModel = fields[fieldName];
            const fieldType = getFieldType(fieldModel, debug);
            return `  ${fieldName}: ${fieldType};`;
        })
            .join('\n');
        const interfaceDefinition = `export interface ${interfaceName}${extendsClause} {\n${fieldDefinitions}\n}\n`;
        return interfaceDefinition;
    });
    return interfaceDefinitions;
}
export function getNangoRootPath(debug = false) {
    const packagePath = getPackagePath(debug);
    if (!packagePath) {
        if (debug) {
            printDebug('Could not find nango cli root path locally');
        }
        return null;
    }
    const rootPath = path.resolve(packagePath, '..');
    if (debug) {
        printDebug(`Found the nango cli root path at ${rootPath}`);
    }
    return rootPath;
}
function getPackagePath(debug = false) {
    try {
        if (isLocallyInstalled('nango', debug)) {
            if (debug) {
                printDebug('Found locally installed nango');
            }
            const localPackagePath = path.resolve(__dirname, '../package.json');
            if (debug) {
                printDebug(`Local package path: ${localPackagePath}`);
            }
            return localPackagePath;
        }
        const packageMainPath = require.resolve('nango');
        const packagePath = path.dirname(packageMainPath);
        if (debug) {
            printDebug(`Found nango at ${packagePath}`);
        }
        return packagePath;
    }
    catch (_a) {
        throw new Error('Could not find nango package. Please make sure it is installed in your project or installed globally. Reach out to us in the Slack community if you continue to have issues!');
    }
}
export function parseSecretKey(environment, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env[`NANGO_SECRET_KEY_${environment.toUpperCase()}`]) {
            if (debug) {
                printDebug(`Environment is set to ${environment}, setting NANGO_SECRET_KEY to NANGO_SECRET_KEY_${environment.toUpperCase()}.`);
            }
            process.env['NANGO_SECRET_KEY'] = process.env[`NANGO_SECRET_KEY_${environment.toUpperCase()}`];
        }
        if (!process.env['NANGO_SECRET_KEY']) {
            console.log(chalk.red(`NANGO_SECRET_KEY_${environment.toUpperCase()} environment variable is not set. Please set it now`));
            try {
                const secretKey = yield promptly.prompt('Secret Key: ');
                if (secretKey) {
                    process.env['NANGO_SECRET_KEY'] = secretKey;
                }
                else {
                    return;
                }
            }
            catch (error) {
                console.log('Error occurred while trying to prompt for secret key:', error);
                process.exit(1);
            }
        }
    });
}
//# sourceMappingURL=utils.js.map