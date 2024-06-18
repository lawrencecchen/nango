/// <reference types="node" resolution-mode="require"/>
import type { Response } from 'express';
import { Readable } from 'stream';
import type { ServiceResponse } from '@nangohq/models/Generic.js';
declare class RemoteFileService {
    bucket: string;
    publicRoute: string;
    upload(fileContents: string, fileName: string, environmentId: number): Promise<string | null>;
    getRemoteFileLocationForPublicTemplate(integrationName: string, fileName: string): string;
    getPublicFlowFile(filePath: string, environmentId: number): Promise<string | null>;
    /**
     * Copy
     * @desc copy an existing public integration file to user's location in s3,
     * on local copy to the set local destination
     */
    copy(integrationName: string, fileName: string, destinationPath: string, environmentId: number, destinationFileName: string): Promise<string | null>;
    getFile(fileName: string, environmentId: number): Promise<string>;
    getStream(fileName: string): Promise<ServiceResponse<Readable | null>>;
    deleteFiles(fileNames: string[]): Promise<void>;
    zipAndSendPublicFiles(
        res: Response,
        integrationName: string,
        accountId: number,
        environmentId: number,
        providerPath: string,
        flowType: string
    ): Promise<void>;
    zipAndSendFiles(
        res: Response,
        integrationName: string,
        accountId: number,
        environmentId: number,
        nangoConfigId: number,
        file_location: string,
        providerConfigKey: string,
        flowType: string
    ): Promise<void>;
    zipAndSend(
        res: Response,
        integrationName: string,
        nangoYaml: Readable,
        tsFile: Readable,
        environmentId: number,
        accountId: number,
        nangoConfigId?: number
    ): Promise<void>;
}
declare const _default: RemoteFileService;
export default _default;
