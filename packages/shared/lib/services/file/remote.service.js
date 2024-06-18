var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CopyObjectCommand, PutObjectCommand, GetObjectCommand, S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import archiver from 'archiver';
import { isCloud, isEnterprise, isLocal, isTest } from '@nangohq/utils';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { NangoError } from '../../utils/error.js';
import errorManager, { ErrorSourceEnum } from '../../utils/error.manager.js';
import { nangoConfigFile } from '../nango-config.service.js';
import localFileService from './local.service.js';
let client = null;
let useS3 = !isLocal && !isTest;
if (isEnterprise) {
    useS3 = Boolean(process.env['AWS_REGION'] && process.env['AWS_BUCKET_NAME']);
    client = new S3Client({
        region: process.env['AWS_REGION'] || 'us-west-2'
    });
}
else {
    client = new S3Client({
        region: process.env['AWS_REGION'],
        credentials: {
            accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
            secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']
        }
    });
}
class RemoteFileService {
    constructor() {
        this.bucket = process.env['AWS_BUCKET_NAME'] || 'nangodev-customer-integrations';
        this.publicRoute = 'integration-templates';
    }
    upload(fileContents, fileName, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isEnterprise && !useS3) {
                const fileNameOnly = fileName.split('/').slice(-1)[0];
                const versionStrippedFileName = fileNameOnly === null || fileNameOnly === void 0 ? void 0 : fileNameOnly.replace(/-v[\d.]+(?=\.js$)/, '');
                localFileService.putIntegrationFile(versionStrippedFileName, fileContents, fileName.endsWith('.js'));
                return '_LOCAL_FILE_';
            }
            if (!useS3) {
                return '_LOCAL_FILE_';
            }
            try {
                yield (client === null || client === void 0 ? void 0 : client.send(new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                    Body: fileContents
                })));
                return fileName;
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    environmentId,
                    operation: LogActionEnum.FILE,
                    metadata: {
                        fileName
                    }
                });
                return null;
            }
        });
    }
    getRemoteFileLocationForPublicTemplate(integrationName, fileName) {
        return `${this.publicRoute}/${integrationName}/dist/${fileName}.js`;
    }
    getPublicFlowFile(filePath, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getFile(filePath, environmentId);
        });
    }
    /**
     * Copy
     * @desc copy an existing public integration file to user's location in s3,
     * on local copy to the set local destination
     */
    copy(integrationName, fileName, destinationPath, environmentId, destinationFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const s3FilePath = `${this.publicRoute}/${integrationName}/${fileName}`;
                if (isCloud) {
                    yield (client === null || client === void 0 ? void 0 : client.send(new CopyObjectCommand({
                        Bucket: this.bucket,
                        Key: destinationPath,
                        CopySource: `${this.bucket}/${s3FilePath}`
                    })));
                    return destinationPath;
                }
                else {
                    const fileContents = yield this.getFile(s3FilePath, environmentId);
                    if (fileContents) {
                        localFileService.putIntegrationFile(destinationFileName, fileContents, integrationName.includes('dist'));
                    }
                    return '_LOCAL_FILE_';
                }
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    environmentId,
                    operation: LogActionEnum.FILE,
                    metadata: {
                        fileName
                    }
                });
                return null;
            }
        });
    }
    getFile(fileName, environmentId) {
        return new Promise((resolve, reject) => {
            const getObjectCommand = new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileName
            });
            client === null || client === void 0 ? void 0 : client.send(getObjectCommand).then((response) => {
                if (response.Body && response.Body instanceof Readable) {
                    const responseDataChunks = [];
                    response.Body.once('error', (err) => reject(err));
                    response.Body.on('data', (chunk) => responseDataChunks.push(chunk));
                    response.Body.once('end', () => resolve(Buffer.concat(responseDataChunks).toString()));
                }
                else {
                    reject(new Error('Response body is undefined or not a Readable stream'));
                }
            }).catch((err) => __awaiter(this, void 0, void 0, function* () {
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    environmentId,
                    operation: LogActionEnum.FILE,
                    metadata: {
                        fileName
                    }
                });
                reject(err);
            }));
        });
    }
    getStream(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getObjectCommand = new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName
                });
                const response = yield (client === null || client === void 0 ? void 0 : client.send(getObjectCommand));
                if ((response === null || response === void 0 ? void 0 : response.Body) && response.Body instanceof Readable) {
                    return { success: true, error: null, response: response.Body };
                }
                else {
                    return { success: false, error: null, response: null };
                }
            }
            catch (_a) {
                const error = new NangoError('integration_file_not_found');
                return { success: false, error, response: null };
            }
        });
    }
    deleteFiles(fileNames) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isCloud && !useS3) {
                return;
            }
            const deleteObjectsCommand = new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: fileNames.map((fileName) => ({ Key: fileName }))
                }
            });
            yield (client === null || client === void 0 ? void 0 : client.send(deleteObjectsCommand));
        });
    }
    zipAndSendPublicFiles(res, integrationName, accountId, environmentId, providerPath, flowType) {
        return __awaiter(this, void 0, void 0, function* () {
            const { success, error, response: nangoYaml } = yield this.getStream(`${this.publicRoute}/${providerPath}/${nangoConfigFile}`);
            if (!success || nangoYaml === null) {
                errorManager.errResFromNangoErr(res, error);
                return;
            }
            const { success: tsSuccess, error: tsError, response: tsFile } = yield this.getStream(`${this.publicRoute}/${providerPath}/${flowType}s/${integrationName}.ts`);
            if (!tsSuccess || tsFile === null) {
                errorManager.errResFromNangoErr(res, tsError);
                return;
            }
            yield this.zipAndSend(res, integrationName, nangoYaml, tsFile, environmentId, accountId);
        });
    }
    zipAndSendFiles(res, integrationName, accountId, environmentId, nangoConfigId, file_location, providerConfigKey, flowType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isCloud && !useS3) {
                return localFileService.zipAndSendFiles(res, integrationName, accountId, environmentId, nangoConfigId, providerConfigKey, flowType);
            }
            else {
                const nangoConfigLocation = file_location.split('/').slice(0, -3).join('/');
                const { success, error, response: nangoYaml } = yield this.getStream(`${nangoConfigLocation}/${nangoConfigFile}`);
                if (!success || nangoYaml === null) {
                    errorManager.errResFromNangoErr(res, error);
                    return;
                }
                const integrationFileLocation = file_location.split('/').slice(0, -1).join('/');
                const { success: tsSuccess, error: tsError, response: tsFile } = yield this.getStream(`${integrationFileLocation}/${integrationName}.ts`);
                if (!tsSuccess || tsFile === null) {
                    errorManager.errResFromNangoErr(res, tsError);
                    return;
                }
                yield this.zipAndSend(res, integrationName, nangoYaml, tsFile, environmentId, accountId, nangoConfigId);
            }
        });
    }
    zipAndSend(res, integrationName, nangoYaml, tsFile, environmentId, accountId, nangoConfigId) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = archiver('zip');
            archive.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
                const metadata = {
                    integrationName,
                    accountId
                };
                if (nangoConfigId) {
                    metadata['nangoConfigId'] = nangoConfigId;
                }
                errorManager.report(err, {
                    source: ErrorSourceEnum.PLATFORM,
                    environmentId,
                    operation: LogActionEnum.FILE,
                    metadata: {
                        integrationName,
                        accountId,
                        nangoConfigId: nangoConfigId || null
                    }
                });
                errorManager.errResFromNangoErr(res, new NangoError('error_creating_zip_file'));
                return;
            }));
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=nango-integrations.zip`);
            archive.pipe(res);
            archive.append(nangoYaml, { name: nangoConfigFile });
            archive.append(tsFile, { name: `${integrationName}.ts` });
            yield archive.finalize();
        });
    }
}
export default new RemoteFileService();
//# sourceMappingURL=remote.service.js.map