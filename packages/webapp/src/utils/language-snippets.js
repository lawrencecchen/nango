"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMetadaSnippet = exports.autoStartSnippet = exports.curlSnippet = exports.nodeActionSnippet = exports.nodeSnippet = void 0;
const utils_1 = require("./utils");
const maskedKey = '<secret-key-from-environment-settings>';
const nodeSnippet = (models, secretKey, connectionId, providerConfigKey) => {
    var _a;
    const model = Array.isArray(models) ? (_a = models[0]) === null || _a === void 0 ? void 0 : _a.name : models;
    const secretKeyDisplay = (0, utils_1.isProd)() ? maskedKey : secretKey;
    return `import { Nango } from '@nangohq/node';
const nango = new Nango({ secretKey: '${secretKeyDisplay}' });

const records = await nango.listRecords({
    providerConfigKey: '${providerConfigKey}',
    connectionId: '${connectionId}',
    model: '${model}'
});
`;
};
exports.nodeSnippet = nodeSnippet;
const nodeActionSnippet = (actionName, secretKey, connectionId, providerConfigKey, input, safeInput) => {
    let formattedInput = '';
    if (!safeInput) {
        if (typeof input === 'string') {
            formattedInput = `'<${input}>'`;
        }
        else if (input && typeof input === 'object') {
            formattedInput = `{
${JSON.stringify(input, null, 2)
                .split('\n')
                .slice(1)
                .join('\n')
                .replace(/^/gm, '    ')
                .replace(/: "([^"]*)"/g, ': "<$1>"')}`;
        }
    }
    else {
        formattedInput = `{
${JSON.stringify(input, null, 2).split('\n').slice(1).join('\n').replace(/^/gm, '    ')}`;
    }
    const secretKeyDisplay = (0, utils_1.isProd)() ? maskedKey : secretKey;
    return `import Nango from '@nangohq/node';
const nango = new Nango({ secretKey: '${secretKeyDisplay}' });

const response = await nango.triggerAction(
    '${providerConfigKey}',
    '${connectionId}',
    '${actionName}',
    ${formattedInput}
);
`;
};
exports.nodeActionSnippet = nodeActionSnippet;
const curlSnippet = (baseUrl, endpoint, secretKey, connectionId, providerConfigKey, input, method = 'GET') => {
    let curlMethod = method;
    const secretKeyDisplay = (0, utils_1.isProd)() ? maskedKey : secretKey;
    if (typeof endpoint !== 'string') {
        curlMethod = Object.keys(endpoint)[0];
        endpoint = (Array.isArray(endpoint) ? endpoint[0][curlMethod] : endpoint[curlMethod]);
    }
    let formattedInput = '';
    if (typeof input === 'string' && input !== 'undefined') {
        formattedInput = input;
    }
    else if (input && typeof input === 'object') {
        formattedInput = `{
${JSON.stringify(input, null, 2)
            .split('\n')
            .slice(1)
            .join('\n')
            .replace(/^/gm, '    ')
            .replace(/: "([^"]*)"/g, ': "<$1>"')}`;
    }
    return `
    curl --request ${curlMethod} \\
    --url ${baseUrl}/v1${endpoint} \\
    --header 'Authorization: Bearer ${secretKeyDisplay}' \\
    --header 'Content-Type: application/json' \\
    --header 'Connection-Id: ${connectionId}' \\
    --header 'Provider-Config-Key: ${providerConfigKey}' ${formattedInput ? '\\' : ''}
    ${formattedInput ? `--data '${formattedInput}'` : ''}
        `;
};
exports.curlSnippet = curlSnippet;
const autoStartSnippet = (secretKey, provider, sync) => {
    const secretKeyDisplay = (0, utils_1.isProd)() ? maskedKey : secretKey;
    return `import Nango from '@nangohq/node';

const nango = new Nango({ secretKey: '${secretKeyDisplay}' });

await nango.startSync('${provider}', ['${sync}'], '<CONNECTION-ID>');
`;
};
exports.autoStartSnippet = autoStartSnippet;
const setMetadaSnippet = (secretKey, provider, input) => {
    return `import Nango from '@nangohq/node';

const nango = new Nango({ secretKey: '${secretKey}' });

await nango.setMetadata(
    '${provider}',
    '<CONNECTION-ID>',
    ${input ? `{\n${JSON.stringify(input, null, 2).split('\n').slice(1).join('\n').replace(/^/gm, '    ')}` : ''}
);
`;
};
exports.setMetadaSnippet = setMetadaSnippet;
//# sourceMappingURL=language-snippets.js.map