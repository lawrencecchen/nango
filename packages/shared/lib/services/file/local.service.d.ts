import type { Response } from 'express';
import type { StandardNangoConfig, LayoutMode } from '@nangohq/models/NangoConfig.js';
declare class LocalFileService {
    getIntegrationFile(syncName: string, providerConfigKey: string, setIntegrationPath?: string | null): string;
    putIntegrationFile(syncName: string, fileContents: string, distPrefix: boolean): boolean;
    checkForIntegrationDistFile(
        syncName: string,
        providerConfigKey: string,
        optionalNangoIntegrationsDirPath?: string
    ): {
        result: boolean;
        path: any;
    };
    checkForIntegrationSourceFile(
        fileName: string,
        optionalNangoIntegrationsDirPath?: string
    ): {
        result: boolean;
        path: any;
    };
    resolveTsFileLocation({ scriptName, providerConfigKey, type }: { scriptName: string; providerConfigKey: string; type: string }): string;
    getIntegrationTsFile(scriptName: string, providerConfigKey: string, type: string): string;
    getLayoutMode(scriptName: string, providerConfigKey: string, type: string): LayoutMode;
    getNangoYamlFileContents(setIntegrationPath?: string | null): string;
    getProviderConfigurationFromPath(filePath: string, config: StandardNangoConfig[]): StandardNangoConfig | null;
    private getFullPathTsFile;
    /**
     * Zip And Send Files
     * @desc grab the files locally from the integrations path, zip and send
     * the archive
     */
    zipAndSendFiles(
        res: Response,
        integrationName: string,
        accountId: number,
        environmentId: number,
        nangoConfigId: number,
        providerConfigKey: string,
        flowType: string
    ): Promise<void>;
    private resolveIntegrationFile;
}
declare const _default: LocalFileService;
export default _default;
