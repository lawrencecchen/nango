import type { NangoModel, NangoIntegration } from '@nangohq/shared';
export declare const NANGO_INTEGRATIONS_NAME = 'nango-integrations';
export declare const NANGO_INTEGRATIONS_LOCATION: string;
export declare const port: string;
export declare const hostport: string;
export declare function setCloudHost(): void;
export declare function setStagingHost(): void;
export declare function printDebug(message: string): void;
export declare function isGlobal(packageName: string): Promise<boolean>;
export declare function isLocallyInstalled(packageName: string, debug?: boolean): boolean;
export declare function checkEnvVars(optionalHostport?: string): void;
export declare function getPkgVersion(): string;
export declare function upgradeAction(debug?: boolean): Promise<void>;
export declare function getConnection(
    providerConfigKey: string,
    connectionId: string,
    setHeaders?: Record<string, string | boolean>,
    debug?: boolean
): Promise<any>;
export declare function getConfig(providerConfigKey: string, debug?: boolean): Promise<any>;
export declare function enrichHeaders(headers?: Record<string, string | number | boolean>): Record<string, string | number | boolean>;
export declare const http: import('axios').AxiosInstance;
export declare function getUserAgent(): string;
export declare function getFieldType(rawField: string | NangoModel, debug?: boolean): string;
export declare function buildInterfaces(models: NangoModel, integrations: NangoIntegration, debug?: boolean): (string | undefined)[] | null;
export declare function getNangoRootPath(debug?: boolean): string;
export declare function parseSecretKey(environment: string, debug?: boolean): Promise<void>;
