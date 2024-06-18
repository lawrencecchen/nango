var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ActionError, NangoError, formatScriptError, NangoSync, localFileService } from '@nangohq/shared';
import * as vm from 'vm';
import * as url from 'url';
import * as crypto from 'crypto';
import * as zod from 'zod';
import { Buffer } from 'buffer';
class IntegrationService {
    cancelScript() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    runScript({ syncName, nangoProps, isInvokedImmediately, isWebhook, optionalLoadLocation, input }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const nango = new NangoSync(nangoProps);
                const script = localFileService.getIntegrationFile(syncName, nangoProps.providerConfigKey, optionalLoadLocation);
                if (!script) {
                    const content = `Unable to find integration file for ${syncName}`;
                    return { success: false, error: new NangoError(content, 500), response: null };
                }
                try {
                    const wrappedScript = `
                    (function() {
                        var module = { exports: {} };
                        var exports = module.exports;
                        ${script}
                        return module.exports;
                    })();
                `;
                    const scriptObj = new vm.Script(wrappedScript);
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
                    const scriptExports = scriptObj.runInContext(context);
                    if (scriptExports.default && typeof scriptExports.default === 'function') {
                        const results = isInvokedImmediately ? yield scriptExports.default(nango, input) : yield scriptExports.default(nango);
                        return { success: true, error: null, response: results };
                    }
                    else {
                        const content = `There is no default export that is a function for ${syncName}`;
                        return { success: false, error: new NangoError(content, 500), response: null };
                    }
                }
                catch (err) {
                    // TODO merge this back with the main integration service
                    if (err instanceof ActionError) {
                        return {
                            success: false,
                            error: {
                                type: err.type,
                                payload: err.payload || {},
                                status: 500
                            },
                            response: null
                        };
                    }
                    let errorType = 'sync_script_failure';
                    if (isWebhook) {
                        errorType = 'webhook_script_failure';
                    }
                    else if (isInvokedImmediately) {
                        errorType = 'action_script_failure';
                    }
                    return formatScriptError(err, errorType, syncName);
                }
            }
            catch (err) {
                const errorMessage = JSON.stringify(err, ['message', 'name', 'stack'], 2);
                const content = `The script failed to load for ${syncName} with the following error: ${errorMessage}`;
                return { success: false, error: new NangoError(content, 500), response: null };
            }
        });
    }
}
export default new IntegrationService();
//# sourceMappingURL=local-integration.service.js.map