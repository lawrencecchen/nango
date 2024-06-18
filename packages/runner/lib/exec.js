var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AxiosError } from 'axios';
import { ActionError, NangoSync, NangoAction, instrumentSDK, SpanTypes } from '@nangohq/shared';
import { Buffer } from 'buffer';
import * as vm from 'vm';
import * as url from 'url';
import * as crypto from 'crypto';
import * as zod from 'zod';
import tracer from 'dd-trace';
import { stringifyError } from '@nangohq/utils';
import { syncAbortControllers } from './state.js';
export function exec(nangoProps, isInvokedImmediately, isWebhook, code, codeParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const isAction = isInvokedImmediately && !isWebhook;
        const abortController = new AbortController();
        if (!isInvokedImmediately && nangoProps.syncId) {
            syncAbortControllers.set(nangoProps.syncId, abortController);
        }
        const rawNango = isAction ? new NangoAction(nangoProps) : new NangoSync(nangoProps);
        const nango = process.env['NANGO_TELEMETRY_SDK'] ? instrumentSDK(rawNango) : rawNango;
        nango.abortSignal = abortController.signal;
        const wrappedCode = `
        (function() {
            var module = { exports: {} };
            var exports = module.exports;
            ${code}
            return module.exports;
        })();
    `;
        return yield tracer.trace(SpanTypes.RUNNER_EXEC, (span) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            span.setTag('accountId', nangoProps.accountId)
                .setTag('environmentId', nangoProps.environmentId)
                .setTag('connectionId', nangoProps.connectionId)
                .setTag('providerConfigKey', nangoProps.providerConfigKey)
                .setTag('syncId', nangoProps.syncId);
            try {
                const script = new vm.Script(wrappedCode);
                const sandbox = {
                    console,
                    require: (moduleName) => {
                        switch (moduleName) {
                            case 'url':
                                return url;
                            case 'crypto':
                                return crypto;
                            case 'zod':
                                return zod;
                            default:
                                throw new Error(`Module '${moduleName}' is not allowed`);
                        }
                    },
                    Buffer,
                    setTimeout
                };
                const context = vm.createContext(sandbox);
                const scriptExports = script.runInContext(context);
                if (isWebhook) {
                    if (!scriptExports.onWebhookPayloadReceived) {
                        const content = `There is no onWebhookPayloadReceived export for ${nangoProps.syncId}`;
                        throw new Error(content);
                    }
                    return yield scriptExports.onWebhookPayloadReceived(nango, codeParams);
                }
                else {
                    if (!scriptExports.default || typeof scriptExports.default !== 'function') {
                        throw new Error(`Default exports is not a function but a ${typeof scriptExports.default}`);
                    }
                    if (isAction) {
                        let inputParams = codeParams;
                        if (typeof codeParams === 'object' && Object.keys(codeParams).length === 0) {
                            inputParams = undefined;
                        }
                        return yield scriptExports.default(nango, inputParams);
                    }
                    else {
                        return yield scriptExports.default(nango);
                    }
                }
            }
            catch (error) {
                if (error instanceof ActionError) {
                    const { type, payload } = error;
                    return {
                        success: false,
                        error: {
                            type,
                            payload: payload || {},
                            status: 500
                        },
                        response: null
                    };
                }
                else {
                    if (error instanceof AxiosError && ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data)) {
                        const errorResponse = error.response.data.payload || error.response.data;
                        throw new Error(JSON.stringify(errorResponse));
                    }
                    throw new Error(`Error executing code '${stringifyError(error)}'`);
                }
            }
            finally {
                span.finish();
            }
        }));
    });
}
//# sourceMappingURL=exec.js.map