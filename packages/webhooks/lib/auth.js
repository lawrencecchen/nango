var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { deliver, shouldSend } from './utils.js';
export const sendAuth = ({ connection, environment, webhookSettings, auth_mode, success, error, operation, provider, type, activityLogId, logCtx }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!webhookSettings) {
        return;
    }
    if (!shouldSend({ success, type: 'auth', webhookSettings, operation })) {
        return;
    }
    let successBody = {};
    let errorBody = {};
    const body = {
        from: 'nango',
        type: 'auth',
        connectionId: connection.connection_id,
        providerConfigKey: connection.provider_config_key,
        authMode: auth_mode,
        provider,
        environment: environment.name,
        operation
    };
    if (success) {
        successBody = Object.assign(Object.assign({}, body), { success: true });
    }
    else {
        errorBody = Object.assign(Object.assign({}, body), { success: false, error });
    }
    const webhooks = [
        { url: webhookSettings.primary_url, type: 'webhook url' },
        { url: webhookSettings.secondary_url, type: 'secondary webhook url' }
    ].filter((webhook) => webhook.url);
    yield deliver({
        webhooks,
        body: success ? successBody : errorBody,
        webhookType: type,
        activityLogId,
        environment,
        logCtx
    });
});
//# sourceMappingURL=auth.js.map