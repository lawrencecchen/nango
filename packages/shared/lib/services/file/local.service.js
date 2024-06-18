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
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import errorManager, { ErrorSourceEnum } from '../../utils/error.manager.js';
import { NangoError } from '../../utils/error.js';
import { nangoConfigFile, SYNC_FILE_EXTENSION } from '../nango-config.service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class LocalFileService {
    getIntegrationFile(syncName, providerConfigKey, setIntegrationPath) {
        try {
            const filePath = setIntegrationPath ? `${setIntegrationPath}dist/${syncName}.${SYNC_FILE_EXTENSION}` : this.resolveIntegrationFile(syncName);
            const fileNameWithProviderConfigKey = filePath.replace(`.${SYNC_FILE_EXTENSION}`, `-${providerConfigKey}.${SYNC_FILE_EXTENSION}`);
            let realPath;
            if (fs.existsSync(fileNameWithProviderConfigKey)) {
                realPath = fs.realpathSync(fileNameWithProviderConfigKey);
            }
            else {
                realPath = fs.realpathSync(filePath);
            }
            const integrationFileContents = fs.readFileSync(realPath, 'utf8');
            return integrationFileContents;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    putIntegrationFile(syncName, fileContents, distPrefix) {
        try {
            const realPath = fs.realpathSync(process.env['NANGO_INTEGRATIONS_FULL_PATH']);
            if (!fs.existsSync(`${realPath}${distPrefix ? '/dist' : ''}/${syncName}`)) {
                if (distPrefix) {
                    fs.mkdirSync(`${realPath}/dist`, { recursive: true });
                }
                fs.writeFileSync(`${realPath}${distPrefix ? '/dist' : ''}/${syncName}`, fileContents, 'utf8');
            }
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    checkForIntegrationDistFile(syncName, providerConfigKey, optionalNangoIntegrationsDirPath) {
        let nangoIntegrationsDirPath = '';
        if (optionalNangoIntegrationsDirPath) {
            nangoIntegrationsDirPath = optionalNangoIntegrationsDirPath;
        }
        else {
            nangoIntegrationsDirPath = process.env['NANGO_INTEGRATIONS_FULL_PATH'];
        }
        const distDirPath = path.resolve(nangoIntegrationsDirPath, 'dist');
        if (!fs.existsSync(nangoIntegrationsDirPath)) {
            return {
                result: false,
                path: nangoIntegrationsDirPath
            };
        }
        if (!fs.existsSync(distDirPath)) {
            return {
                result: false,
                path: distDirPath
            };
        }
        let filePath = path.resolve(distDirPath, `${syncName}.${SYNC_FILE_EXTENSION}`);
        let realPath;
        const fileNameWithProviderConfigKey = filePath.replace(`.${SYNC_FILE_EXTENSION}`, `-${providerConfigKey}.${SYNC_FILE_EXTENSION}`);
        if (fs.existsSync(fileNameWithProviderConfigKey)) {
            filePath = fileNameWithProviderConfigKey;
        }
        try {
            realPath = fs.realpathSync(filePath);
        }
        catch (_a) {
            realPath = filePath;
        }
        return {
            result: fs.existsSync(realPath),
            path: realPath
        };
    }
    checkForIntegrationSourceFile(fileName, optionalNangoIntegrationsDirPath) {
        let nangoIntegrationsDirPath = '';
        if (optionalNangoIntegrationsDirPath) {
            nangoIntegrationsDirPath = optionalNangoIntegrationsDirPath;
        }
        else {
            nangoIntegrationsDirPath = process.env['NANGO_INTEGRATIONS_FULL_PATH'];
        }
        const filePath = path.resolve(nangoIntegrationsDirPath, fileName);
        let realPath;
        try {
            realPath = fs.realpathSync(filePath);
        }
        catch (_a) {
            realPath = filePath;
        }
        return {
            result: fs.existsSync(realPath),
            path: realPath
        };
    }
    resolveTsFileLocation({ scriptName, providerConfigKey, type }) {
        const nestedPath = path.resolve(`./${providerConfigKey}/${type}s/${scriptName}.ts`);
        if (fs.existsSync(nestedPath)) {
            return fs.realpathSync(path.resolve(nestedPath, '../'));
        }
        return fs.realpathSync('./');
    }
    getIntegrationTsFile(scriptName, providerConfigKey, type) {
        try {
            const realPath = this.resolveTsFileLocation({ scriptName, providerConfigKey, type });
            const tsIntegrationFileContents = fs.readFileSync(`${realPath}/${scriptName}.ts`, 'utf8');
            return tsIntegrationFileContents;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    /*
     * Get Layout Mode
     * @desc determine if the layout mode is nested or root
     * 1. If the file exists in the root directory already then it is 'root'
     * 2. If the file exists in the nested path then it is 'nested'
     * 3. If an existing directory is found for that provider already then it is 'nested'
     * 4. If there are no files in the root directory at all then it should be
     * 'nested' since that is the new default
     * 5. If we're initializing then we should default to nested
     * 6. Falback to nested
     */
    getLayoutMode(scriptName, providerConfigKey, type) {
        if (fs.existsSync(`./${scriptName}.ts`)) {
            return 'root';
        }
        const nestedPath = path.resolve(`./${providerConfigKey}/${type}s/${scriptName}.ts`);
        if (fs.existsSync(nestedPath)) {
            return 'nested';
        }
        const nestedProvider = path.resolve(`./${providerConfigKey}`);
        if (fs.existsSync(nestedProvider)) {
            return 'nested';
        }
        const rootPath = fs.realpathSync('./');
        const files = fs.readdirSync(rootPath);
        if (files.length === 0) {
            return 'nested';
        }
        if (files.includes('nango-integrations')) {
            const nangoIntegrationsPath = path.resolve(rootPath, 'nango-integrations');
            const nangoFiles = fs.readdirSync(nangoIntegrationsPath);
            const expected = ['.env', 'models.ts', 'nango.yaml'];
            if (nangoFiles.length === 3 && expected.every((file) => nangoFiles.includes(file))) {
                return 'nested';
            }
        }
        return 'nested';
    }
    getNangoYamlFileContents(setIntegrationPath) {
        try {
            const filePath = setIntegrationPath
                ? `${setIntegrationPath}/${nangoConfigFile}`
                : path.resolve(__dirname, `../nango-integrations/${nangoConfigFile}`);
            const realPath = fs.realpathSync(filePath);
            const nangoYamlFileContents = fs.readFileSync(realPath, 'utf8');
            return nangoYamlFileContents;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    getProviderConfigurationFromPath(filePath, config) {
        const pathSegments = filePath.split('/');
        const scriptType = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;
        const isNested = scriptType === 'syncs' || scriptType === 'actions' || scriptType === 'post-connection-scripts';
        const baseName = path.basename(filePath, '.ts');
        let providerConfiguration = null;
        if (isNested) {
            const providerConfigKey = pathSegments[pathSegments.length - 3];
            providerConfiguration = config.find((config) => config.providerConfigKey === providerConfigKey) || null;
        }
        else {
            providerConfiguration = config.find((config) => [...config.syncs, ...config.actions].find((sync) => sync.name === baseName)) || null;
        }
        return providerConfiguration;
    }
    getFullPathTsFile(integrationPath, scriptName, providerConfigKey, type) {
        const nestedFilePath = `${providerConfigKey}/${type}s/${scriptName}.ts`;
        const nestedPath = path.resolve(integrationPath, nestedFilePath);
        if (this.checkForIntegrationSourceFile(nestedFilePath, integrationPath).result) {
            return nestedPath;
        }
        const tsFilePath = path.resolve(integrationPath, `${scriptName}.ts`);
        if (!this.checkForIntegrationSourceFile(`${scriptName}.ts`, integrationPath).result) {
            return null;
        }
        return tsFilePath;
    }
    /**
     * Zip And Send Files
     * @desc grab the files locally from the integrations path, zip and send
     * the archive
     */
    zipAndSendFiles(res, integrationName, accountId, environmentId, nangoConfigId, providerConfigKey, flowType) {
        return __awaiter(this, void 0, void 0, function* () {
            const integrationPath = process.env['NANGO_INTEGRATIONS_FULL_PATH'];
            const nangoConfigFilePath = path.resolve(integrationPath, nangoConfigFile);
            const nangoConfigFileExists = this.checkForIntegrationSourceFile(nangoConfigFile, integrationPath);
            const tsFilePath = this.getFullPathTsFile(integrationPath, integrationName, providerConfigKey, flowType);
            if (!tsFilePath || !nangoConfigFileExists.result) {
                errorManager.errResFromNangoErr(res, new NangoError('integration_file_not_found'));
                return;
            }
            const archive = archiver('zip');
            archive.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    environmentId,
                    operation: LogActionEnum.FILE,
                    metadata: {
                        integrationName,
                        accountId,
                        nangoConfigId
                    }
                });
                errorManager.errResFromNangoErr(res, new NangoError('error_creating_zip_file'));
                return;
            }));
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=nango-integrations.zip`);
            archive.pipe(res);
            archive.append(fs.createReadStream(nangoConfigFilePath), { name: nangoConfigFile });
            archive.append(fs.createReadStream(tsFilePath), { name: `${integrationName}.ts` });
            yield archive.finalize();
        });
    }
    resolveIntegrationFile(syncName) {
        if (process.env['NANGO_INTEGRATIONS_FULL_PATH']) {
            return path.resolve(process.env['NANGO_INTEGRATIONS_FULL_PATH'], `dist/${syncName}.${SYNC_FILE_EXTENSION}`);
        }
        else {
            return path.resolve(__dirname, `../nango-integrations/dist/${syncName}.${SYNC_FILE_EXTENSION}`);
        }
    }
}
export default new LocalFileService();
//# sourceMappingURL=local.service.js.map