var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getLogger, Err, Ok } from '@nangohq/utils';
import { NangoError, userService, interpolateString, Orchestrator, getOrchestratorUrl } from '@nangohq/shared';
import { OrchestratorClient } from '@nangohq/nango-orchestrator';
const logger = getLogger('Server.Utils');
export function getUserFromSession(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionUser = req.user;
        if (!sessionUser) {
            const error = new NangoError('user_not_found');
            return Err(error);
        }
        const user = yield userService.getUserById(sessionUser.id);
        if (!user) {
            const error = new NangoError('user_not_found');
            return Err(error);
        }
        return Ok(user);
    });
}
export function dirname() {
    return path.dirname(fileURLToPath(import.meta.url));
}
/**
 * A helper function to check if replacers contains all necessary params to interpolate string.
 * interpolateString('Hello ${name} of ${age} years", {name: 'Tester'}) -> returns false
 */
export function missesInterpolationParam(str, replacers) {
    const strWithoutConnectionConfig = str.replace(/connectionConfig\./g, '');
    const interpolatedStr = interpolateString(strWithoutConnectionConfig, replacers);
    return /\${([^{}]*)}/g.test(interpolatedStr);
}
/**
 * A helper function to extract the additional authorization parameters from the frontend Auth request.
 */
export function getAdditionalAuthorizationParams(params) {
    if (!params || typeof params !== 'object') {
        return {};
    }
    const arr = Object.entries(params).filter(([_, v]) => typeof v === 'string'); // Filter strings
    const obj = Object.fromEntries(arr);
    Object.keys(obj).forEach((key) => (obj[key] = obj[key] === 'undefined' ? undefined : obj[key])); // Detect undefined values to override template auth params.
    return obj;
}
/**
 * A helper function to extract the additional connection metadata returned from the Provider in the callback request.
 */
export function getConnectionMetadataFromCallbackRequest(queryParams, template) {
    if (!queryParams || !template.redirect_uri_metadata) {
        return {};
    }
    const whitelistedKeys = template.redirect_uri_metadata;
    // Filter out non-strings & non-whitelisted keys.
    const arr = Object.entries(queryParams).filter(([k, v]) => typeof v === 'string' && whitelistedKeys.includes(k));
    return arr != null && arr.length > 0 ? Object.fromEntries(arr) : {};
}
/**
 * A helper function to extract the additional connection metadata returned from the Provider in the token response.
 * It can parse booleans or strings only
 */
export function getConnectionMetadataFromTokenResponse(params, template) {
    if (!params || !template.token_response_metadata) {
        return {};
    }
    const whitelistedKeys = template.token_response_metadata;
    const getValueFromDotNotation = (obj, key) => {
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
    const combinedArr = [...arr, ...dotNotationArr].filter((item) => item !== null);
    return combinedArr.length > 0 ? Object.fromEntries(combinedArr) : {};
}
export function parseConnectionConfigParamsFromTemplate(template) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (template.token_url || template.authorization_url || ((_a = template.proxy) === null || _a === void 0 ? void 0 : _a.base_url) || ((_b = template.proxy) === null || _b === void 0 ? void 0 : _b.headers) || ((_c = template.proxy) === null || _c === void 0 ? void 0 : _c.verification)) {
        const cleanParamName = (param) => param.replace('${connectionConfig.', '').replace('}', '');
        const tokenUrlMatches = typeof template.token_url === 'string' ? template.token_url.match(/\${connectionConfig\.([^{}]*)}/g) || [] : [];
        const authorizationUrlMatches = ((_d = template.authorization_url) === null || _d === void 0 ? void 0 : _d.match(/\${connectionConfig\.([^{}]*)}/g)) || [];
        const proxyBaseUrlMatches = ((_e = template.proxy) === null || _e === void 0 ? void 0 : _e.base_url.match(/\${connectionConfig\.([^{}]*)}/g)) || [];
        const proxyHeaderMatches = ((_f = template.proxy) === null || _f === void 0 ? void 0 : _f.headers)
            ? Array.from(new Set(Object.values(template.proxy.headers).flatMap((header) => header.match(/\${connectionConfig\.([^{}]*)}/g) || [])))
            : [];
        const proxyMatches = [...proxyBaseUrlMatches, ...proxyHeaderMatches].filter(
        // we ignore config params in proxy attributes that are also in the
        // - token response metadata
        // - redirect url metadata
        // - connection_configuration - this is what is parsed from the post connection script
        (param) => ![
            ...(template.token_response_metadata || []),
            ...(template.redirect_uri_metadata || []),
            ...(template.connection_configuration || [])
        ].includes(cleanParamName(param)));
        const proxyVerificationMatches = ((_h = (_g = template.proxy) === null || _g === void 0 ? void 0 : _g.verification) === null || _h === void 0 ? void 0 : _h.endpoint.match(/\${connectionConfig\.([^{}]*)}/g)) ||
            ((_l = (_k = (_j = template.proxy) === null || _j === void 0 ? void 0 : _j.verification) === null || _k === void 0 ? void 0 : _k.base_url_override) === null || _l === void 0 ? void 0 : _l.match(/\${connectionConfig\.([^{}]*)}/g)) ||
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
export function convertJsonKeysToSnakeCase(payload) {
    if (payload == null) {
        return null;
    }
    return Object.entries(payload).reduce((accum, current) => {
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
export function convertJsonKeysToCamelCase(payload) {
    if (payload == null) {
        return null;
    }
    return Object.entries(payload).reduce((accum, current) => {
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
function html(res, error) {
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
    }
    else {
        res.status(200);
    }
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(resultHTML));
}
function oldErrorHtml(res, wsErr) {
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
export function errorHtml(res, wsClientId, wsErr) {
    if (wsClientId != null) {
        return html(res, true);
    }
    else {
        return oldErrorHtml(res, wsErr);
    }
}
/**
 *
 * Legacy method to support old frontend SDKs.
 */
export function successHtml(res, wsClientId, providerConfigKey, connectionId) {
    if (wsClientId != null) {
        return html(res, false);
    }
    else {
        return oldSuccessHtml(res, providerConfigKey, connectionId);
    }
}
/**
 *
 * Legacy method to support old frontend SDKs.
 */
function oldSuccessHtml(res, providerConfigKey, connectionId) {
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
//# sourceMappingURL=utils.js.map