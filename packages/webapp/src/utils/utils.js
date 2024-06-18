"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringArrayEqual = exports.formatFrequency = exports.formatQuantity = exports.cn = exports.generateResponseModel = exports.parseInput = exports.generateExampleValueForProperty = exports.createExampleForType = exports.getRunTime = exports.parseLatestSyncResult = exports.interpretNextRun = exports.formatDateToLogFormat = exports.formatDateToUSFormat = exports.formatDateToShortUSFormat = exports.elapsedTime = exports.defaultCallback = exports.baseUrl = exports.isLocal = exports.isCloud = exports.isProd = exports.isStaging = exports.isEnterprise = exports.isHosted = exports.MANAGED_AUTH_ENABLED = exports.AUTH_ENABLED = exports.syncDocs = exports.prodUrl = exports.stagingUrl = exports.localhostUrl = void 0;
const clsx_1 = require("clsx");
const date_fns_1 = require("date-fns");
const tailwind_merge_1 = require("tailwind-merge");
exports.localhostUrl = 'http://localhost:3003';
exports.stagingUrl = 'https://api-staging.nango.dev';
exports.prodUrl = 'https://api.nango.dev';
exports.syncDocs = 'https://docs.nango.dev/integrate/guides/sync-data-from-an-api';
exports.AUTH_ENABLED = isCloud() || isEnterprise() || isLocal();
exports.MANAGED_AUTH_ENABLED = isCloud() || isLocal();
function isHosted() {
    return process.env.REACT_APP_ENV === 'hosted';
}
exports.isHosted = isHosted;
function isEnterprise() {
    return process.env.REACT_APP_ENV === 'enterprise';
}
exports.isEnterprise = isEnterprise;
function isStaging() {
    return process.env.REACT_APP_ENV === 'staging';
}
exports.isStaging = isStaging;
function isProd() {
    return process.env.REACT_APP_ENV === 'production';
}
exports.isProd = isProd;
function isCloud() {
    return isProd() || isStaging();
}
exports.isCloud = isCloud;
function isLocal() {
    return window.location.href.includes('localhost');
}
exports.isLocal = isLocal;
function baseUrl() {
    switch (process.env.REACT_APP_ENV) {
        case 'hosted':
            return exports.localhostUrl;
        case 'staging':
            return exports.stagingUrl;
        case 'production':
            return exports.prodUrl;
        default:
            return exports.localhostUrl;
    }
}
exports.baseUrl = baseUrl;
function defaultCallback() {
    return baseUrl() + '/oauth/callback';
}
exports.defaultCallback = defaultCallback;
function elapsedTime(start, end) {
    const startTime = start instanceof Date ? start.getTime() : new Date(start).getTime();
    const endTime = end instanceof Date ? end.getTime() : new Date(end).getTime();
    if (isNaN(startTime) || isNaN(endTime)) {
        return '';
    }
    const elapsedTime = endTime - startTime;
    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const elapsedMilliseconds = elapsedTime % 1000;
    return `${elapsedSeconds}.${elapsedMilliseconds} seconds`;
}
exports.elapsedTime = elapsedTime;
function formatDateToShortUSFormat(dateString) {
    const date = new Date(dateString);
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        month: 'short',
        day: '2-digit',
        hour12: false
    };
    const formattedDate = date.toLocaleString('en-US', options);
    if (formattedDate === 'Invalid Date') {
        return '-';
    }
    const parts = formattedDate.split(', ');
    return `${parts[1]}, ${parts[0]}`;
}
exports.formatDateToShortUSFormat = formatDateToShortUSFormat;
function formatDateToUSFormat(dateString) {
    const date = new Date(dateString);
    const options = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    const formattedDate = date.toLocaleString('en-US', options);
    if (formattedDate === 'Invalid Date') {
        return '-';
    }
    return formattedDate;
}
exports.formatDateToUSFormat = formatDateToUSFormat;
function formatDateToLogFormat(dateString) {
    const date = new Date(dateString);
    return (0, date_fns_1.format)(date, 'MMM dd, HH:mm:ss:SS');
}
exports.formatDateToLogFormat = formatDateToLogFormat;
function formatFutureRun(nextRun) {
    if (!nextRun) {
        return;
    }
    const milliseconds = Number(nextRun) * 1000;
    const date = new Date(milliseconds);
    return date;
}
function interpretNextRun(futureRuns, previousRun) {
    const [nextRun, nextNextRun] = futureRuns;
    if (!nextRun) {
        return '-';
    }
    const date = formatFutureRun(nextRun);
    // if the future date is less than the previous date for some reason then return '-'
    if (previousRun) {
        const previousRunTime = new Date(previousRun);
        if (date && date < previousRunTime) {
            return '-';
        }
    }
    if (!date) {
        return '-';
    }
    const nextDate = formatFutureRun(nextNextRun);
    const nextRuns = [date, nextDate].map((d) => d && formatDateToUSFormat(d.toISOString()));
    if (previousRun) {
        const previousRunTime = new Date(previousRun);
        if (nextDate && nextDate < previousRunTime) {
            nextRuns[1] = '-';
        }
    }
    return nextRuns;
}
exports.interpretNextRun = interpretNextRun;
function parseLatestSyncResult(result, models) {
    if ('added' in result || 'updated' in result || 'deleted' in result) {
        return JSON.stringify(result, null, 2);
    }
    else if (models && models.length === 1) {
        const [singleModel] = models;
        const results = result[singleModel];
        return JSON.stringify(results, null, 2);
    }
    else {
        return JSON.stringify(result, null, 2);
    }
}
exports.parseLatestSyncResult = parseLatestSyncResult;
function getRunTime(created_at, updated_at) {
    if (!created_at || !updated_at) {
        return '-';
    }
    const createdAt = new Date(created_at);
    const updatedAt = new Date(updated_at);
    const diffMilliseconds = updatedAt.getTime() - createdAt.getTime();
    const milliseconds = diffMilliseconds % 1000;
    const seconds = Math.floor((diffMilliseconds / 1000) % 60);
    const minutes = Math.floor((diffMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((diffMilliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24));
    let runtime = '';
    if (days > 0)
        runtime += `${days}d `;
    if (hours > 0)
        runtime += `${hours}h `;
    if (minutes > 0)
        runtime += `${minutes}m `;
    if (seconds > 0)
        runtime += `${seconds}s `;
    if (!days && !hours && !minutes && !seconds && milliseconds > 0) {
        runtime += `${milliseconds}ms`;
    }
    return runtime.trim() || '-';
}
exports.getRunTime = getRunTime;
function createExampleForType(type) {
    if (typeof type !== 'string') {
        return {};
    }
    return `<${type}>`;
}
exports.createExampleForType = createExampleForType;
function generateExampleValueForProperty(model) {
    if (!Array.isArray(model === null || model === void 0 ? void 0 : model.fields)) {
        return createExampleForType(model === null || model === void 0 ? void 0 : model.name);
    }
    const example = {};
    for (const field of model.fields) {
        example[field.name] = createExampleForType(field.type);
    }
    return example;
}
exports.generateExampleValueForProperty = generateExampleValueForProperty;
const parseInput = (flow) => {
    let input;
    if ((flow === null || flow === void 0 ? void 0 : flow.input) && Object.keys(flow === null || flow === void 0 ? void 0 : flow.input).length > 0 && !flow.input.fields) {
        input = flow.input.name;
    }
    else if ((flow === null || flow === void 0 ? void 0 : flow.input) && Object.keys(flow === null || flow === void 0 ? void 0 : flow.input).length > 0) {
        const rawInput = {};
        for (const field of flow.input.fields) {
            rawInput[field.name] = field.type;
        }
        input = rawInput;
    }
    else {
        input = undefined;
    }
    return input;
};
exports.parseInput = parseInput;
function generateResponseModel(models, output, isSync) {
    var _a;
    if (!output) {
        return {};
    }
    const model = models.find((model) => model.name === output);
    const jsonResponse = generateExampleValueForProperty(model);
    if (!isSync) {
        return ((_a = model === null || model === void 0 ? void 0 : model.name) === null || _a === void 0 ? void 0 : _a.includes('[]')) ? [jsonResponse] : jsonResponse;
    }
    const metadata = {
        _nango_metadata: {
            deleted_at: '<date| null>',
            last_action: 'ADDED|UPDATED|DELETED',
            first_seen_at: '<date>',
            cursor: '<string>',
            last_modified_at: '<date>'
        }
    };
    return Object.assign(Object.assign({}, jsonResponse), metadata);
}
exports.generateResponseModel = generateResponseModel;
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
exports.cn = cn;
const quantityFormatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, minimumFractionDigits: 0 });
function formatQuantity(quantity) {
    return quantityFormatter.format(quantity);
}
exports.formatQuantity = formatQuantity;
function formatFrequency(frequency) {
    const unitMap = {
        minutes: 'm',
        minute: 'm',
        hours: 'h',
        hour: 'h',
        days: 'd',
        day: 'd'
    };
    for (const [unit, abbreviation] of Object.entries(unitMap)) {
        if (frequency.includes(unit)) {
            return frequency.replace(unit, abbreviation).replace(/\s/g, '');
        }
    }
    return frequency;
}
exports.formatFrequency = formatFrequency;
// https://stackoverflow.com/a/42186143
function stringArrayEqual(prev, next) {
    // can't use toSorted yet
    const a = [...prev].sort();
    const b = [...next].sort();
    let i = a.length;
    while (i--) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
exports.stringArrayEqual = stringArrayEqual;
//# sourceMappingURL=utils.js.map