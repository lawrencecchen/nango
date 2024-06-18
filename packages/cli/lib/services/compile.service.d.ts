import type { StandardNangoConfig } from '@nangohq/shared';
export declare function compileAllFiles({
    debug,
    fullPath,
    scriptName,
    providerConfigKey,
    type
}: {
    debug: boolean;
    fullPath: string;
    scriptName?: string;
    providerConfigKey?: string;
    type?: string;
}): Promise<boolean>;
export declare function compileSingleFile({
    fullPath,
    file,
    config,
    modelNames,
    tsconfig,
    debug
}: {
    fullPath: string;
    file: ListedFile;
    tsconfig: string;
    config: StandardNangoConfig[];
    modelNames: string[];
    debug: boolean;
}): Promise<boolean>;
export interface ListedFile {
    inputPath: string;
    outputPath: string;
    baseName: string;
}
export declare function getFileToCompile({ fullPath, filePath }: { fullPath: string; filePath: string }): ListedFile;
export declare function listFilesToCompile({
    fullPath,
    scriptDirectory,
    scriptName,
    config,
    debug
}: {
    fullPath: string;
    scriptDirectory?: string | undefined;
    scriptName?: string | undefined;
    config: StandardNangoConfig[];
    debug?: boolean;
}): ListedFile[];
