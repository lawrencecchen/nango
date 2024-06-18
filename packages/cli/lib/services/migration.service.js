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
import path from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';
import { nangoConfigFile, loadLocalNangoConfig, determineVersion } from '@nangohq/shared';
import { printDebug, getNangoRootPath } from '../utils.js';
export const v1toV2Migration = (loadLocation) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env['NANGO_CLI_UPGRADE_MODE'] === 'ignore') {
        return;
    }
    const localConfig = yield loadLocalNangoConfig(loadLocation);
    if (!localConfig) {
        return;
    }
    const version = determineVersion(localConfig);
    if (version === 'v2') {
        console.log(chalk.blue(`nango.yaml is already at v2.`));
    }
    if (version === 'v1' && localConfig.integrations) {
        exec(`node ${getNangoRootPath()}/scripts/v1-v2.js ./${nangoConfigFile}`, (error) => {
            if (error) {
                console.log(chalk.red(`There was an issue migrating your nango.yaml to v2.`));
                console.error(error);
                return;
            }
            console.log(chalk.blue(`Migrated to v2 of nango.yaml!`));
        });
    }
});
function createDirectory(dirPath, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (fs.existsSync(dirPath)) {
            if (debug) {
                printDebug(`Directory already exists at ${dirPath}.`);
            }
            return;
        }
        yield fs.promises.mkdir(dirPath, { recursive: true });
        if (debug) {
            printDebug(`Created directory at ${dirPath}.`);
        }
    });
}
function moveFile(source, destination, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (fs.existsSync(destination)) {
            if (debug) {
                printDebug(`File already exists at ${destination}.`);
            }
            return false;
        }
        yield fs.promises.rename(source, destination);
        if (debug) {
            printDebug(`Moved file from ${source} to ${destination}.`);
        }
        return true;
    });
}
function updateModelImport(filePath, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs.promises.readFile(filePath, 'utf8');
            const updatedData = data.replace(/\.\/models/g, '@nangohq/models');
            yield fs.promises.writeFile(filePath, updatedData, 'utf8');
            if (debug) {
                printDebug(`Updated imports in ${filePath}.`);
            }
        }
        catch (error) {
            console.error(chalk.red(`There was an issue updating the imports in ${filePath}.`), error);
        }
    });
}
export const directoryMigration = (loadLocation, debug) => __awaiter(void 0, void 0, void 0, function* () {
    const localConfig = yield loadLocalNangoConfig(loadLocation);
    if (!localConfig) {
        return;
    }
    const version = determineVersion(localConfig);
    if (version !== 'v2') {
        console.log(chalk.red(`nango.yaml is not at v2. Nested directories are not supported in v1.`));
        return;
    }
    for (const integration of Object.keys(localConfig.integrations)) {
        const integrationPath = `${loadLocation}/${integration}`;
        yield createDirectory(integrationPath, debug);
        const scripts = localConfig.integrations[integration];
        if (scripts === null || scripts === void 0 ? void 0 : scripts.syncs) {
            const syncsPath = path.join(integrationPath, 'syncs');
            yield createDirectory(syncsPath, debug);
            for (const sync of Object.keys(scripts.syncs)) {
                const syncPath = path.join(syncsPath, `${sync}.ts`);
                const moved = yield moveFile(path.join(loadLocation, `${sync}.ts`), syncPath, debug);
                if (moved) {
                    yield updateModelImport(syncPath, debug);
                }
            }
        }
        if (scripts === null || scripts === void 0 ? void 0 : scripts.actions) {
            const actionsPath = path.join(integrationPath, 'actions');
            yield createDirectory(actionsPath, debug);
            for (const action of Object.keys(scripts.actions)) {
                const actionPath = path.join(actionsPath, `${action}.ts`);
                const moved = yield moveFile(path.join(loadLocation, `${action}.ts`), actionPath, debug);
                if (moved) {
                    yield updateModelImport(actionPath, debug);
                }
            }
        }
    }
    console.log(chalk.green(`Migration to nested directories complete.`));
});
//# sourceMappingURL=migration.service.js.map