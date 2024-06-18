import type { Request } from 'express';
import type { User } from '@nangohq/shared';
import type { Template as ProviderTemplate } from '@nangohq/types';
import type { Result } from '@nangohq/utils';
import { NangoError, Orchestrator } from '@nangohq/shared';

import type { WSErr } from './web-socket-error.js';
export declare function getUserFromSession(req: Request<any>): Promise<Result<User, NangoError>>;
export declare function dirname(): string;
/**
 * A helper function to check if replacers contains all necessary params to interpolate string.
 * interpolateString('Hello ${name} of ${age} years", {name: 'Tester'}) -> returns false
 */
export declare function missesInterpolationParam(str: string, replacers: Record<string, any>): boolean;
/**
 * A helper function to extract the additional authorization parameters from the frontend Auth request.
 */
export declare function getAdditionalAuthorizationParams(params: any): Record<string, string | undefined>;
/**
 * A helper function to extract the additional connection metadata returned from the Provider in the callback request.
 */
export declare function getConnectionMetadataFromCallbackRequest(queryParams: any, template: ProviderTemplate): Record<string, string>;
/**
 * A helper function to extract the additional connection metadata returned from the Provider in the token response.
 * It can parse booleans or strings only
 */
export declare function getConnectionMetadataFromTokenResponse(params: any, template: ProviderTemplate): Record<string, any>;
export declare function parseConnectionConfigParamsFromTemplate(template: ProviderTemplate): string[];
/**
 * This can be used to convert the keys of a Json to snake case
 * @param payload This the json we want to convert from a camelCase a snake_case
 */
export declare function convertJsonKeysToSnakeCase<R>(payload: Record<string, any>): R | null;
/**
 *
 * @param payload The json we want to convert its keys to camelCase
 */
export declare function convertJsonKeysToCamelCase<R>(payload: Record<string, any>): R | null;
/**
 *
 * Legacy method to support old frontend SDKs.
 */
export declare function errorHtml(res: any, wsClientId: string | undefined, wsErr: WSErr): void;
/**
 *
 * Legacy method to support old frontend SDKs.
 */
export declare function successHtml(res: any, wsClientId: string | undefined, providerConfigKey: string, connectionId: string): void;
export declare function resetPasswordSecret(): string;
export declare function getOrchestratorClient(): any;
export declare function getOrchestrator(): Orchestrator;
