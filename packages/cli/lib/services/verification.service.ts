import fs from 'fs';
import chalk from 'chalk';
import promptly from 'promptly';
import path from 'path';

import { nangoConfigFile } from '@nangohq/shared';
import configService from './config.service.js.js';
import { compileAllFiles, listFilesToCompile } from './compile.service.js.js';
import { printDebug } from '../utils.js.js';
import { NANGO_INTEGRATIONS_NAME } from '../constants.js.js';
import { init, generate } from '../cli.js.js';

class VerificationService {
    public async necessaryFilesExist({
        fullPath,
        autoConfirm,
        debug = false,
        checkDist = false
    }: {
        fullPath: string;
        autoConfirm: boolean;
        debug?: boolean;
        checkDist?: boolean;
    }) {
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
                : await promptly.confirm(`No ${nangoConfigFile} file was found. Would you like to create some default integrations and build them? (yes/no)`);

            if (install) {
                if (debug) {
                    printDebug(`Running init, generate, and tsc to create ${nangoConfigFile} file, generate the integration files and then compile them.`);
                }
                init({ absolutePath: fullPath, debug });
                await generate({ fullPath, debug });
                await compileAllFiles({ fullPath, debug });
            } else {
                console.log(chalk.red(`Exiting...`));
                process.exit(1);
            }
        } else {
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
                : await promptly.confirm(`No dist directory was found. Would you like to create it and create default integrations? (yes/no)`);

            if (createDist) {
                if (debug) {
                    printDebug(`Creating the dist directory and generating the default integration files.`);
                }
                fs.mkdirSync(distDir);
                await generate({ fullPath, debug });
                await compileAllFiles({ fullPath, debug });
            }
        } else {
            const files = fs.readdirSync(distDir);
            if (files.length === 0) {
                if (debug) {
                    printDebug(`Dist directory exists but is empty.`);
                }
                const compile = autoConfirm
                    ? true
                    : await promptly.confirm(`The dist directory is empty. Would you like to generate the default integrations? (yes/no)`);

                if (compile) {
                    if (debug) {
                        printDebug(`Generating the default integration files.`);
                    }
                    await compileAllFiles({ fullPath, debug });
                }
            }
        }
    }

    public async filesMatchConfig({ fullPath }: { fullPath: string }): Promise<boolean> {
        const { success, error, response: config } = await configService.load(fullPath);

        if (!success || !config) {
            console.log(chalk.red(error?.message));
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
    }
}

const verificationService = new VerificationService();
export default verificationService;
