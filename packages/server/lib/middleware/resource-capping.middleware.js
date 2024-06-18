var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { errorManager } from '@nangohq/shared';
import { connectionCreationStartCapCheck as connectionCreationStartCapCheckHook } from '../hooks/hooks.js';
export const authCheck = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const environmentId = res.locals['environment'].id;
    const account = res.locals['account'].id;
    const { providerConfigKey } = req.params;
    if (account.is_capped && providerConfigKey) {
        const isCapped = yield connectionCreationStartCapCheckHook({ providerConfigKey, environmentId, creationType: 'create' });
        if (isCapped) {
            errorManager.errRes(res, 'resource_capped');
            return;
        }
    }
    next();
});
//# sourceMappingURL=resource-capping.middleware.js.map