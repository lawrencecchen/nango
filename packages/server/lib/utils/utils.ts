import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Request } from 'express';
import type { User } from '@nangohq/shared';
import type { Template as ProviderTemplate } from '@nangohq/types';
import type { Result } from '@nangohq/utils';
import { getLogger, Err, Ok } from '@nangohq/utils';
import type { WSErr } from './web-socket-error.js.js';
import { NangoError, userService, interpolateString, Orchestrator, getOrchestratorUrl } from '@nangohq/shared';
import { OrchestratorClient } from '@nangohq/nango-orchestrator';

const logger = getLogger('Server.Utils');

export async function getUserFromSession(req: Request<any>): Promise<Result<User, NangoError>> {
    const sessionUser = req.user;
    if (!sessionUser) {
        const error = new NangoError('user_not_found');

        return Err(error);
    }

    const user = await userService.getUserById(sessionUser.id);

    if (!user) {
        const error = new NangoError('user_not_found');
        return Err(error);
    }

    return Ok(user);
}

export function dirname() {
    return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * A helper function to check if replacers contains all necessary params to interpolate string.
 * interpolateString('Hello ${name} of ${age} years", {name: 'Tester'}) -> returns false
 */
export function missesInterpolationParam(str: string, replacers: Record<string, any>) {
    const strWithoutConnectionConfig = str.replace(/connectionConfig\./g, '');
    const interpolatedStr = interpolateString(strWithoutConnectionConfig, replacers);
    return /\${([^{}]*)}/g.test(interpolatedStr);
}

/**
 * A helper function to extract the additional authorization parameters from the frontend Auth request.
 */
export function getAdditionalAuthorizationParams(params: any): Record<string, string | undefined> {
    if (!params || typeof params !== 'object') {
        return {};
    }

    const arr = Object.entries(params).filter(([_, v]) => typeof v === 'string'); // Filter strings
    const obj = Object.fromEntries(arr) as Record<string, string | undefined>;
    Object.keys(obj).forEach((key) => (obj[key] = obj[key] === 'undefined' ? undefined : obj[key])); // Detect undefined values to override template auth params.
    return obj;
}

/**
 * A helper function to extract the additional connection metadata returned from the Provider in the callback request.
 */
export function getConnectionMetadataFromCallbackRequest(queryParams: any, template: ProviderTemplate): Record<string, string> {
    if (!queryParams || !template.redirect_uri_metadata) {
        return {};
    }

    const whitelistedKeys = template.redirect_uri_metadata;

    // Filter out non-strings & non-whitelisted keys.
    const arr = Object.entries(queryParams).filter(([k, v]) => typeof v === 'string' && whitelistedKeys.includes(k));

    return arr != null && arr.length > 0 ? (Object.fromEntries(arr) as Record<string, string>) : {};
}

/**
 * A helper function to extract the additional connection metadata returned from the Provider in the token response.
 * It can parse booleans or strings only
 */
export function getConnectionMetadataFromTokenResponse(params: any, template: ProviderTemplate): Record<string, any> {
    if (!params || !template.token_response_metadata) {
        return {};
    }

    const whitelistedKeys = template.token_response_metadata;

    const getValueFromDotNotation = (obj: any, key: string): any => {
        return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    };

    // Filter out non-strings, non-booleans & non-whitelisted keys.
    const arr = Object.entries(params).filter(([k, v]) => {
        const isStringValueOrBoolean = typeof v === 'string' || typeof v === 'boolean';
        if (isStringValueOrBoolean && whitelistedKeys.includes(k)) {
            return true;
        }
        // Check for dot notation keys
        const dotNotationValue = getValueFromDotNotation(params, k);
        return isStringValueOrBoolean && whitelistedKeys.includes(dotNotationValue);
    });

    // Add support for dot notation keys
    const dotNotationArr = whitelistedKeys
        .map((key) => {
            const value = getValueFromDotNotation(params, key);
            const isStringValueOrBoolean = typeof value === 'string' || typeof value === 'boolean';
            return isStringValueOrBoolean ? [key, value] : null;
        })
        .filter(Boolean);

    const combinedArr: [string, any][] = [...arr, ...dotNotationArr].filter((item) => item !== null) as [string, any][];

    return combinedArr.length > 0 ? (Object.fromEntries(combinedArr) as Record<string, any>) : {};
}

export function parseConnectionConfigParamsFromTemplate(template: ProviderTemplate): string[] {
    if (template.token_url || template.authorization_url || template.proxy?.base_url || template.proxy?.headers || template.proxy?.verification) {
        const cleanParamName = (param: string) => param.replace('${connectionConfig.', '').replace('}', '');
        const tokenUrlMatches = typeof template.token_url === 'string' ? template.token_url.match(/\${connectionConfig\.([^{}]*)}/g) || [] : [];
        const authorizationUrlMatches = template.authorization_url?.match(/\${connectionConfig\.([^{}]*)}/g) || [];
        const proxyBaseUrlMatches = template.proxy?.base_url.match(/\${connectionConfig\.([^{}]*)}/g) || [];
        const proxyHeaderMatches = template.proxy?.headers
            ? Array.from(new Set(Object.values(template.proxy.headers).flatMap((header) => header.match(/\${connectionConfig\.([^{}]*)}/g) || [])))
            : [];
        const proxyMatches = [...proxyBaseUrlMatches, ...proxyHeaderMatches].filter(
            // we ignore config params in proxy attributes that are also in the
            // - token response metadata
            // - redirect url metadata
            // - connection_configuration - this is what is parsed from the post connection script
            (param) =>
                ![
                    ...(template.token_response_metadata || []),
                    ...(template.redirect_uri_metadata || []),
                    ...(template.connection_configuration || [])
                ].includes(cleanParamName(param))
        );
        const proxyVerificationMatches =
            template.proxy?.verification?.endpoint.match(/\${connectionConfig\.([^{}]*)}/g) ||
            template.proxy?.verification?.base_url_override?.match(/\${connectionConfig\.([^{}]*)}/g) ||
            [];
        return [...tokenUrlMatches, ...authorizationUrlMatches, ...proxyMatches, ...proxyVerificationMatches]
            .map(cleanParamName)
            .filter((value, index, array) => array.indexOf(value) === index); // remove duplicates
    }

    return [];
}

/**
 * This can be used to convert the keys of a Json to snake case
 * @param payload This the json we want to convert from a camelCase a snake_case
 */
export function convertJsonKeysToSnakeCase<R>(payload: Record<string, any>): R | null {
    if (payload == null) {
        return null;
    }
    return Object.entries(payload).reduce((accum: any, current) => {
        const [key, value] = current;
        const newKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        accum[newKey] = value;
        return accum;
    }, {});
}

/**
 *
 * @param payload The json we want to convert its keys to camelCase
 */
export function convertJsonKeysToCamelCase<R>(payload: Record<string, any>): R | null {
    if (payload == null) {
        return null;
    }
    return Object.entries(payload).reduce((accum: any, current) => {
        const [key, value] = current;
        const newKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
        accum[newKey] = value;
        return accum;
    }, {});
}

/**
 *
 * @remarks
 * Yes including a full HTML template here in a string goes against many best practices.
 * Yet it also felt wrong to add another dependency to simply parse 1 template.
 * If you have an idea on how to improve this feel free to submit a pull request.
 */
function html(res: any, error: boolean) {
    const resultHTML = `
<!--
Nango OAuth flow callback. Read more about how to use it at: https://github.com/NangoHQ/nango
-->
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authorization callback</title>
  </head>
  <body>
    <noscript>JavaScript is required to proceed with the authentication.</noscript>
    <script type="text/javascript">
      // Close the modal
      window.setTimeout(function() {
        window.close()
      }, 300);
    </script>
  </body>
</html>
`;

    if (error) {
        res.status(500);
    } else {
        res.status(200);
    }
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(resultHTML));
}

function oldErrorHtml(res: any, wsErr: WSErr) {
    const resultHTMLTemplate = `
<!--
Nango OAuth flow callback. Read more about how to use it at: https://github.com/NangoHQ/nango
-->
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authorization callback</title>
  </head>
  <body>
    <noscript>JavaScript is required to proceed with the authentication.</noscript>
    <script type="text/javascript">
      window.authErrorType = '\${errorType}';
      window.authErrorDesc = '\${errorDesc}';

      const message = {};
      message.eventType = 'AUTHORIZATION_FAILED';
      message.data = {
        error: {
            type: window.authErrorType,
            message: window.authErrorDesc
        }
      };

      // Tell the world what happened
      window.opener && window.opener.postMessage(message, '*');

      // Close the modal
      window.setTimeout(function() {
        window.close()
      }, 300);
    </script>
  </body>
</html>
`;
    const resultHTML = interpolateString(resultHTMLTemplate, {
        errorType: wsErr.type.replace('\n', '\\n'),
        errorDesc: wsErr.message.replace('\n', '\\n')
    });

    logger.debug(`Got an error in the OAuth flow: ${wsErr.type} - ${wsErr.message}`);
    res.status(500);
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(resultHTML));
}

/**
 *
 * Legacy method to support old frontend SDKs.
 */
export function errorHtml(res: any, wsClientId: string | undefined, wsErr: WSErr) {
    if (wsClientId != null) {
        return html(res, true);
    } else {
        return oldErrorHtml(res, wsErr);
    }
}

/**
 *
 * Legacy method to support old frontend SDKs.
 */
export function successHtml(res: any, wsClientId: string | undefined, providerConfigKey: string, connectionId: string) {
    if (wsClientId != null) {
        return html(res, false);
    } else {
        return oldSuccessHtml(res, providerConfigKey, connectionId);
    }
}

/**
 *
 * Legacy method to support old frontend SDKs.
 */
function oldSuccessHtml(res: any, providerConfigKey: string, connectionId: string) {
    const resultHTMLTemplate = `
<!--
Nango OAuth flow callback. Read more about how to use it at: https://github.com/NangoHQ/nango
-->
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authorization callback</title>
  </head>
  <body>
    <noscript>JavaScript is required to proceed with the authentication.</noscript>
    <script type="text/javascript">
      window.providerConfigKey = \`\${providerConfigKey}\`;
      window.connectionId = \`\${connectionId}\`;

      const message = {};
      message.eventType = 'AUTHORIZATION_SUCEEDED';
      message.data = { connectionId: window.connectionId, providerConfigKey: window.providerConfigKey };

      // Tell the world what happened
      window.opener && window.opener.postMessage(message, '*');

      // Close the modal
      window.setTimeout(function() {
        window.close()
      }, 300);
    </script>
  </body>
</html>
`;
    const resultHTML = interpolateString(resultHTMLTemplate, {
        providerConfigKey: providerConfigKey,
        connectionId: connectionId
    });

    res.status(200);
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(resultHTML));
}

export function resetPasswordSecret() {
    return process.env['NANGO_ADMIN_KEY'] || 'nango';
}

export function getOrchestratorClient() {
    return new OrchestratorClient({ baseUrl: getOrchestratorUrl() });
}

export function getOrchestrator() {
    return new Orchestrator(getOrchestratorClient());
}
