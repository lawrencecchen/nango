var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import chalk from 'chalk';
import chokidar from 'chokidar';
import ejs from 'ejs';
import * as dotenv from 'dotenv';
import { spawn } from 'child_process';
import { localFileService, nangoConfigFile, SyncConfigType } from '@nangohq/shared';
import { NANGO_INTEGRATIONS_NAME, getNangoRootPath, getPkgVersion, printDebug } from './utils.js';
import configService from './services/config.service.js';
import modelService from './services/model.service.js';
import { NangoSyncTypesFileLocation, TYPES_FILE_NAME, exampleSyncName } from './constants.js';
import { compileAllFiles, compileSingleFile, getFileToCompile } from './services/compile.service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
export const version = (debug) => {
    if (debug) {
        printDebug('Looking up the version first for a local path first then globally');
    }
    const version = getPkgVersion();
    console.log(chalk.green('Nango CLI version:'), version);
};
export function generate({ fullPath, debug = false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const syncTemplateContents = fs.readFileSync(path.resolve(__dirname, './templates/sync.ejs'), 'utf8');
        const actionTemplateContents = fs.readFileSync(path.resolve(__dirname, './templates/action.ejs'), 'utf8');
        const githubExampleTemplateContents = fs.readFileSync(path.resolve(__dirname, './templates/github.sync.ejs'), 'utf8');
        const postConnectionTemplateContents = fs.readFileSync(path.resolve(__dirname, './templates/post-connection.ejs'), 'utf8');
        const configContents = fs.readFileSync(`${fullPath}/${nangoConfigFile}`, 'utf8');
        const configData = yaml.load(configContents);
        const { models, integrations } = configData;
        const interfaceDefinitions = modelService.build(models, integrations, debug);
        if (interfaceDefinitions) {
            fs.writeFileSync(`${fullPath}/${TYPES_FILE_NAME}`, interfaceDefinitions.join('\n'));
        }
        if (debug) {
            printDebug(`Interfaces from the ${nangoConfigFile} file written to ${TYPES_FILE_NAME}`);
        }
        // insert NangoSync types to the bottom of the file
        const typesFilePath = `${getNangoRootPath()}/${NangoSyncTypesFileLocation}`;
        if (fs.existsSync(typesFilePath)) {
            const typesContent = fs.readFileSync(typesFilePath, 'utf8');
            if (typesContent) {
                fs.writeFileSync(`${fullPath}/${TYPES_FILE_NAME}`, typesContent, { flag: 'a' });
            }
            else {
                console.log(chalk.red(`Empty ${NangoSyncTypesFileLocation}`));
            }
        }
        else {
            console.log(chalk.red(`Failed to load ${NangoSyncTypesFileLocation}`));
        }
        const { success, error, response: config } = yield configService.load(fullPath, debug);
        if (!success || !config) {
            console.log(chalk.red(error === null || error === void 0 ? void 0 : error.message));
            return;
        }
        const flowConfig = `export const NangoFlows = ${JSON.stringify(config, null, 2)} as const; \n`;
        fs.writeFileSync(`${fullPath}/${TYPES_FILE_NAME}`, flowConfig, { flag: 'a' });
        if (debug) {
            printDebug(`NangoSync types written to ${TYPES_FILE_NAME}`);
        }
        const allSyncNames = {};
        for (const standardConfig of config) {
            const { syncs, actions, postConnectionScripts, providerConfigKey } = standardConfig;
            if (postConnectionScripts) {
                const type = 'post-connection-script';
                for (const name of postConnectionScripts) {
                    const rendered = ejs.render(postConnectionTemplateContents, {
                        interfaceFileName: TYPES_FILE_NAME.replace('.ts', '')
                    });
                    const stripped = rendered.replace(/^\s+/, '');
                    if (!fs.existsSync(`${fullPath}/${providerConfigKey}/${type}s/${name}.ts`)) {
                        fs.mkdirSync(`${fullPath}/${providerConfigKey}/${type}s`, { recursive: true });
                        fs.writeFileSync(`${fullPath}/${providerConfigKey}/${type}s/${name}.ts`, stripped);
                        if (debug) {
                            printDebug(`Created ${name}.ts file`);
                        }
                    }
                    else {
                        if (debug) {
                            printDebug(`${name}.ts file already exists, so will not overwrite it.`);
                        }
                    }
                }
            }
            for (const flow of [...syncs, ...actions]) {
                const { name, type, returns: models, layout_mode } = flow;
                let { input } = flow;
                const uniqueName = layout_mode === 'root' ? name : `${providerConfigKey}-${name}`;
                if (allSyncNames[uniqueName] === undefined) {
                    // a sync and an action within the same provider cannot have the same name
                    allSyncNames[uniqueName] = true;
                }
                else {
                    console.log(chalk.red(`The ${type} name ${name} is duplicated in the ${nangoConfigFile} file. All sync and action names must be unique.`));
                    process.exit(1);
                }
                if (debug) {
                    printDebug(`Generating ${name} integration`);
                }
                const flowNameCamel = name
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
                let ejsTemplateContents = '';
                if (name === exampleSyncName && type === SyncConfigType.SYNC) {
                    ejsTemplateContents = githubExampleTemplateContents;
                }
                else {
                    ejsTemplateContents = type === SyncConfigType.SYNC ? syncTemplateContents : actionTemplateContents;
                }
                let interfaceNames = [];
                let mappings = [];
                if (typeof models === 'string') {
                    const formattedName = models;
                    interfaceNames = formattedName;
                    mappings = {
                        name: models,
                        type: formattedName
                    };
                }
                else {
                    if (models && models.length !== 0) {
                        interfaceNames = models;
                        mappings = models.map((model) => ({
                            name: model,
                            type: model
                        }));
                    }
                }
                if (input && Object.keys(input).length === 0) {
                    input = undefined;
                }
                const rendered = ejs.render(ejsTemplateContents, {
                    syncName: flowNameCamel,
                    interfacePath: layout_mode === 'root' ? './' : '../../',
                    interfaceFileName: TYPES_FILE_NAME.replace('.ts', ''),
                    interfaceNames,
                    mappings,
                    inputs: (input === null || input === void 0 ? void 0 : input.name) || input || '',
                    hasWebhook: type === SyncConfigType.SYNC && flow.webhookSubscriptions && flow.webhookSubscriptions.length > 0
                });
                const stripped = rendered.replace(/^\s+/, '');
                if (!fs.existsSync(`${fullPath}/${name}.ts`) && !fs.existsSync(`${fullPath}/${providerConfigKey}/${type}s/${name}.ts`)) {
                    if (layout_mode === 'root') {
                        fs.writeFileSync(`${fullPath}/${name}.ts`, stripped);
                    }
                    else {
                        fs.mkdirSync(`${fullPath}/${providerConfigKey}/${type}s`, { recursive: true });
                        fs.writeFileSync(`${fullPath}/${providerConfigKey}/${type}s/${name}.ts`, stripped);
                    }
                    if (debug) {
                        printDebug(`Created ${name}.ts file`);
                    }
                }
                else {
                    if (debug) {
                        printDebug(`${name}.ts file already exists, so will not overwrite it.`);
                    }
                }
            }
        }
    });
}
/**
 * Init
 * If we're not currently in the nango-integrations directory create one
 * and create an example nango.yaml file
 */
export function init({ absolutePath, debug = false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const yamlData = fs.readFileSync(path.resolve(__dirname, `./templates/${nangoConfigFile}`), 'utf8');
        // if currently in the nango-integrations directory then don't create another one
        const currentDirectory = path.basename(absolutePath);
        let fullPath;
        if (currentDirectory === NANGO_INTEGRATIONS_NAME) {
            if (debug) {
                printDebug(`Currently in the ${NANGO_INTEGRATIONS_NAME} directory so the directory will not be created`);
            }
            fullPath = absolutePath;
        }
        else {
            fullPath = path.resolve(absolutePath, NANGO_INTEGRATIONS_NAME);
        }
        if (fs.existsSync(fullPath)) {
            console.log(chalk.red(`The ${NANGO_INTEGRATIONS_NAME} directory already exists. You should run commands from within this directory`));
        }
        else {
            if (debug) {
                printDebug(`Creating the nango integrations directory at ${absolutePath}`);
            }
            fs.mkdirSync(fullPath);
        }
        const configFileLocation = path.resolve(fullPath, nangoConfigFile);
        if (!fs.existsSync(configFileLocation)) {
            if (debug) {
                printDebug(`Creating the ${nangoConfigFile} file at ${configFileLocation}`);
            }
            fs.writeFileSync(configFileLocation, yamlData);
        }
        else {
            if (debug) {
                printDebug(`Nango config file already exists at ${configFileLocation} so not creating a new one`);
            }
        }
        const envFileLocation = path.resolve(fullPath, '.env');
        if (!fs.existsSync(envFileLocation)) {
            if (debug) {
                printDebug(`Creating the .env file at ${envFileLocation}`);
            }
            fs.writeFileSync(envFileLocation, `# Authenticates the CLI (get the keys in the dashboard's Environment Settings).
#NANGO_SECRET_KEY_DEV=xxxx-xxx-xxxx
#NANGO_SECRET_KEY_PROD=xxxx-xxx-xxxx

# Nango's instance URL (OSS: change to http://localhost:3003 or your instance URL).
NANGO_HOSTPORT=https://api.nango.dev # Default value

# How to handle CLI upgrades ("prompt", "auto" or "ignore").
NANGO_CLI_UPGRADE_MODE=prompt # Default value

# Whether to prompt before deployments.
NANGO_DEPLOY_AUTO_CONFIRM=false # Default value`);
        }
        else {
            if (debug) {
                printDebug(`.env file already exists at ${envFileLocation} so not creating a new one`);
            }
        }
        yield generate({ debug, fullPath });
    });
}
export function tscWatch({ fullPath, debug = false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const tsconfig = fs.readFileSync(`${getNangoRootPath()}/tsconfig.dev.json`, 'utf8');
        const { success, error, response: config } = yield configService.load(fullPath);
        if (!success || !config) {
            console.log(chalk.red(error === null || error === void 0 ? void 0 : error.message));
            return;
        }
        const modelNames = configService.getModelNames(config);
        const watchPath = ['./**/*.ts', `./${nangoConfigFile}`];
        if (debug) {
            printDebug(`Watching ${watchPath.join(', ')}`);
        }
        const watcher = chokidar.watch(watchPath, {
            ignoreInitial: false,
            ignored: (filePath) => {
                const relativePath = path.relative(__dirname, filePath);
                return relativePath.includes('node_modules') || path.basename(filePath) === TYPES_FILE_NAME;
            }
        });
        const distDir = path.join(fullPath, 'dist');
        if (!fs.existsSync(distDir)) {
            if (debug) {
                printDebug(`Creating ${distDir} directory`);
            }
            fs.mkdirSync(distDir);
        }
        if (!fs.existsSync(path.join(fullPath, TYPES_FILE_NAME))) {
            if (debug) {
                printDebug(`Creating ${TYPES_FILE_NAME} file`);
            }
            yield modelService.createModelFile({ fullPath });
        }
        watcher.on('add', (filePath) => __awaiter(this, void 0, void 0, function* () {
            if (filePath === nangoConfigFile) {
                return;
            }
            yield compileSingleFile({ fullPath, file: getFileToCompile({ fullPath, filePath }), tsconfig, config, modelNames, debug });
        }));
        watcher.on('unlink', (filePath) => {
            if (filePath === nangoConfigFile) {
                return;
            }
            const providerConfiguration = localFileService.getProviderConfigurationFromPath(filePath, config);
            const baseName = path.basename(filePath, '.ts');
            const fileName = providerConfiguration ? `${baseName}-${providerConfiguration.providerConfigKey}.js` : `${baseName}.js`;
            const jsFilePath = `./dist/${fileName}`;
            try {
                fs.unlinkSync(jsFilePath);
            }
            catch (_a) {
                console.log(chalk.red(`Error deleting ${jsFilePath}`));
            }
        });
        watcher.on('change', (filePath) => __awaiter(this, void 0, void 0, function* () {
            if (filePath === nangoConfigFile) {
                yield compileAllFiles({ fullPath, debug });
                return;
            }
            yield compileSingleFile({ fullPath, file: getFileToCompile({ fullPath, filePath }), tsconfig, config, modelNames, debug });
        }));
    });
}
export function configWatch({ fullPath, debug = false }) {
    const watchPath = path.join(fullPath, nangoConfigFile);
    if (debug) {
        printDebug(`Watching ${watchPath}`);
    }
    const watcher = chokidar.watch(watchPath, { ignoreInitial: true });
    watcher.on('change', () => {
        void modelService.createModelFile({ fullPath });
    });
}
let child;
process.on('SIGINT', () => {
    if (child) {
        const dockerDown = spawn('docker', ['compose', '-f', `${getNangoRootPath()}/docker/docker-compose.yaml`, '--project-directory', '.', 'down'], {
            stdio: 'inherit'
        });
        dockerDown.on('exit', () => {
            process.exit();
        });
    }
    else {
        process.exit();
    }
});
/**
 * Docker Run
 * @desc spawn a child process to run the docker compose located in the cli
 * Look into https://www.npmjs.com/package/docker-compose to avoid dependency maybe?
 */
export const dockerRun = (debug = false) => __awaiter(void 0, void 0, void 0, function* () {
    const cwd = process.cwd();
    const args = ['compose', '-f', `${getNangoRootPath()}/docker/docker-compose.yaml`, '--project-directory', '.', 'up', '--build'];
    if (debug) {
        printDebug(`Running docker with args: ${args.join(' ')}`);
    }
    child = spawn('docker', args, {
        cwd,
        detached: false,
        stdio: 'inherit'
    });
    yield new Promise((resolve, reject) => {
        child === null || child === void 0 ? void 0 : child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Error with the nango docker containers, please check your containers using 'docker ps''`));
                return;
            }
            resolve(true);
        });
        child === null || child === void 0 ? void 0 : child.on('error', reject);
    });
});
//# sourceMappingURL=cli.js.map