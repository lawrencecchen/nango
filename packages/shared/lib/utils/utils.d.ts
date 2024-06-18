import { cloudHost, stagingHost } from '@nangohq/utils';

import type { Connection } from '../models/Connection.js';
export { cloudHost, stagingHost };
export declare enum UserType {
    Local = 'localhost',
    SelfHosted = 'self-hosted',
    Cloud = 'cloud'
}
export declare enum NodeEnv {
    Dev = 'development',
    Staging = 'staging',
    Prod = 'production'
}
export declare const JAVASCRIPT_AND_TYPESCRIPT_TYPES: {
    primitives: string[];
    aliases: string[];
    builtInObjects: string[];
    utilityTypes: string[];
};
export declare function isJsOrTsType(type?: string): boolean;
export declare function getPort(): number;
export declare function getServerPort(): number;
export declare function getPersistAPIUrl(): string;
export declare function getJobsUrl(): string;
export declare function getServerBaseUrl(): string;
export declare function getRedisUrl(): string;
export declare function getOrchestratorUrl(): string;
export declare function isValidHttpUrl(str: string): boolean;
export declare function dirname(thisFile?: string): string;
export declare function parseTokenExpirationDate(expirationDate: any): Date;
export declare function isTokenExpired(expireDate: Date, bufferInSeconds: number): boolean;
/**
 * Get Oauth callback url base url.
 * @desc for ease of use with APIs that require a secure redirect
 * redirectmeto is automatically used. This is intentioned
 * for local development
 * @see https://github.com/kodie/redirectmeto
 */
export declare function getLocalOAuthCallbackUrlBaseUrl(): string;
export declare function getApiUrl(): string;
export declare function getGlobalOAuthCallbackUrl(): string;
export declare function getGlobalAppCallbackUrl(): string;
export declare function getGlobalWebhookReceiveUrl(): string;
export declare function getOauthCallbackUrl(environmentId?: number): Promise<string>;
export declare function getAppCallbackUrl(_environmentId?: number): Promise<string>;
/**
 * Get any custom path for the websockets server.
 * Defaults to '/' for backwards compatibility
 *
 * @returns the path for the websockets server
 */
export declare function getWebsocketsPath(): string;
/**
 * A helper function to interpolate a string.
 * interpolateString('Hello ${name} of ${age} years", {name: 'Tester', age: 234}) -> returns 'Hello Tester of age 234 years'
 *
 * @remarks
 * Copied from https://stackoverflow.com/a/1408373/250880
 */
export declare function interpolateString(str: string, replacers: Record<string, any>): string;
export declare function interpolateStringFromObject(str: string, replacers: Record<string, any>): string;
export declare function connectionCopyWithParsedConnectionConfig(connection: Connection): Connection;
export declare function mapProxyBaseUrlInterpolationFormat(baseUrl: string | undefined): string | undefined;
export declare function interpolateIfNeeded(str: string, replacers: Record<string, any>): string;
export declare function getConnectionConfig(queryParams: any): Record<string, string>;
export declare function safeStringify(obj: any): string;
