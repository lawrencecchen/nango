var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import crypto from 'crypto';
import { backOff } from 'exponential-backoff';
import { axiosInstance as axios } from '@nangohq/utils';
export const RETRY_ATTEMPTS = 7;
export const NON_FORWARDABLE_HEADERS = [
    'host',
    'authorization',
    'connection',
    'keep-alive',
    'content-length',
    'content-type',
    'content-encoding',
    'cookie',
    'set-cookie',
    'referer',
    'user-agent',
    'sec-',
    'proxy-',
    'www-authenticate',
    'server'
];
export const retry = (activityLogId, logCtx, error, attemptNumber) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if ((error === null || error === void 0 ? void 0 : error.response) && (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) < 200 || ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) >= 300)) {
        const content = `Webhook response received an ${((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.status) || (error === null || error === void 0 ? void 0 : error.code)} error, retrying with exponential backoffs for ${attemptNumber} out of ${RETRY_ATTEMPTS} times`;
        if (activityLogId) {
            yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(content));
        }
        return true;
    }
    return false;
});
export const getSignatureHeader = (secret, payload) => {
    const combinedSignature = `${secret}${JSON.stringify(payload)}`;
    const createdHash = crypto.createHash('sha256').update(combinedSignature).digest('hex');
    return {
        'X-Nango-Signature': createdHash
    };
};
export const filterHeaders = (headers) => {
    const filteredHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        if (NON_FORWARDABLE_HEADERS.some((header) => key.toLowerCase().startsWith(header))) {
            continue;
        }
        filteredHeaders[key] = value;
    }
    return filteredHeaders;
};
export const shouldSend = ({ webhookSettings, success, type, operation }) => {
    const hasAnyWebhook = Boolean(webhookSettings.primary_url || webhookSettings.secondary_url);
    if (type === 'forward') {
        return hasAnyWebhook;
    }
    if (!hasAnyWebhook) {
        return false;
    }
    if (type === 'auth') {
        if (operation === 'creation' && !webhookSettings.on_auth_creation) {
            return false;
        }
        if (operation === 'refresh' && !webhookSettings.on_auth_refresh_error) {
            return false;
        }
        return true;
    }
    if (type === 'sync') {
        if (!success && !webhookSettings.on_sync_error) {
            return false;
        }
    }
    return true;
};
export const deliver = ({ webhooks, body, webhookType, activityLogId, logCtx, environment, endingMessage = '', incomingHeaders }) => __awaiter(void 0, void 0, void 0, function* () {
    let success = true;
    for (const webhook of webhooks) {
        const { url, type } = webhook;
        try {
            const headers = Object.assign(Object.assign({}, getSignatureHeader(environment.secret_key, body)), filterHeaders(incomingHeaders || {}));
            const response = yield backOff(() => {
                return axios.post(url, body, { headers });
            }, { numOfAttempts: RETRY_ATTEMPTS, retry: retry.bind(this, activityLogId, logCtx) });
            if (logCtx) {
                if (response.status >= 200 && response.status < 300) {
                    yield logCtx.info(`${webhookType} webhook sent successfully to the ${type} ${url} and received with a ${response.status} response code${endingMessage ? ` ${endingMessage}` : ''}.`, body);
                }
                else {
                    yield logCtx.error(`${webhookType} sent webhook successfully to the ${type} ${url} but received a ${response.status} response code${endingMessage ? ` ${endingMessage}` : ''}. Please send a 2xx on successful receipt.`, body);
                    success = false;
                }
            }
        }
        catch (err) {
            if (activityLogId) {
                yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(`${webhookType} webhook failed to send to the ${type} to ${url}`, {
                    error: err
                }));
            }
            success = false;
        }
    }
    return success;
});
//# sourceMappingURL=utils.js.map