var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import chalk from 'chalk';
import promptly from 'promptly';
import path from 'path';
import { nangoConfigFile } from '@nangohq/shared';
import configService from './config.service.js';
import { compileAllFiles, listFilesToCompile } from './compile.service.js';
import { printDebug } from '../utils.js';
import { NANGO_INTEGRATIONS_NAME } from '../constants.js';
import { init, generate } from '../cli.js';
class VerificationService {
    necessaryFilesExist({ fullPath, autoConfirm, debug = false, checkDist = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (debug) {
                printDebug(`Current full working directory is read as: ${fullPath}`);
            }
            const currentDirectory = path.basename(fullPath);
            if (debug) {
                printDebug(`Current stripped directory is read as: ${currentDirectory}`);
            }
            if (currentDirectory !== NANGO_INTEGRATIONS_NAME) {
                console.log(chalk.red(`You must run this command in the ${NANGO_INTEGRATIONS_NAME} directory.`));
                process.exit(1);
            }
            if (!fs.existsSync(path.join(fullPath, nangoConfigFile))) {
                const install = autoConfirm
                    ? true
                    : yield promptly.confirm(`No ${nangoConfigFile} file was found. Would you like to create some default integrations and build them? (yes/no)`);
                if (install) {
                    if (debug) {
                        printDebug(`Running init, generate, and tsc to create ${nangoConfigFile} file, generate the integration files and then compile them.`);
                    }
                    init({ absolutePath: fullPath, debug });
                    yield generate({ fullPath, debug });
                    yield compileAllFiles({ fullPath, debug });
                }
                else {
                    console.log(chalk.red(`Exiting...`));
                    process.exit(1);
                }
            }
            else {
                if (debug) {
                    printDebug(`Found ${nangoConfigFile} file successfully.`);
                }
            }
            if (!checkDist) {
                return;
            }
            const distDir = path.join(fullPath, 'dist');
            if (!fs.existsSync(distDir)) {
                if (debug) {
                    printDebug("Dist directory doesn't exist.");
                }
                const createDist = autoConfirm
                    ? true
                    : yield promptly.confirm(`No dist directory was found. Would you like to create it and create default integrations? (yes/no)`);
                if (createDist) {
                    if (debug) {
                        printDebug(`Creating the dist directory and generating the default integration files.`);
                    }
                    fs.mkdirSync(distDir);
                    yield generate({ fullPath, debug });
                    yield compileAllFiles({ fullPath, debug });
                }
            }
            else {
                const files = fs.readdirSync(distDir);
                if (files.length === 0) {
                    if (debug) {
                        printDebug(`Dist directory exists but is empty.`);
                    }
                    const compile = autoConfirm
                        ? true
                        : yield promptly.confirm(`The dist directory is empty. Would you like to generate the default integrations? (yes/no)`);
                    if (compile) {
                        if (debug) {
                            printDebug(`Generating the default integration files.`);
                        }
                        yield compileAllFiles({ fullPath, debug });
                    }
                }
            }
        });
    }
    filesMatchConfig({ fullPath }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { success, error, response: config } = yield configService.load(fullPath);
            if (!success || !config) {
                console.log(chalk.red(error === null || error === void 0 ? void 0 : error.message));
                throw new Error('Failed to load config');
            }
            const syncNames = config.map((provider) => provider.syncs.map((sync) => sync.name)).flat();
            const actionNames = config.map((provider) => provider.actions.map((action) => action.name)).flat();
            const flows = [...syncNames, ...actionNames].filter((name) => name);
            const tsFiles = listFilesToCompile({ fullPath, config });
            const tsFileNames = tsFiles.filter((file) => !file.inputPath.includes('models.ts')).map((file) => file.baseName);
            const missingSyncsAndActions = flows.filter((syncOrActionName) => !tsFileNames.includes(syncOrActionName));
            if (missingSyncsAndActions.length > 0) {
                console.log(chalk.red(`The following syncs are missing a corresponding .ts file: ${missingSyncsAndActions.join(', ')}`));
                throw new Error('Syncs missing .ts files');
            }
            return true;
        });
    }
}
const verificationService = new VerificationService();
export default verificationService;
//# sourceMappingURL=verification.service.js.map