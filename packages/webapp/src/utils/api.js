"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGetConnectionAPI = exports.useUpdateSyncFrequency = exports.useCreateFlow = exports.useGetFlows = exports.useInviteSignupAPI = exports.useEditUserPasswordAPI = exports.useEditUserNameAPI = exports.useGetUserAPI = exports.useEditAccountNameAPI = exports.useGetAccountAPI = exports.useRunSyncAPI = exports.useGetAllSyncsAPI = exports.useGetHmacAPI = exports.useGetSyncAPI = exports.useResetPasswordAPI = exports.useRequestPasswordResetAPI = exports.useDeleteConnectionAPI = exports.useGetConnectionDetailsAPI = exports.useGetConnectionListAPI = exports.useGetProvidersAPI = exports.useDeleteIntegrationAPI = exports.useEditIntegrationNameAPI = exports.useEditIntegrationAPI = exports.useCreateEmptyIntegrationAPI = exports.useCreateIntegrationAPI = exports.useGetIntegrationDetailsAPI = exports.useGetIntegrationListAPI = exports.useEditWebhookSecondaryUrlAPI = exports.useEditWebhookUrlAPI = exports.useEditEnvVariablesAPI = exports.useEditHmacKeyAPI = exports.useEditSendAuthWebhookAPI = exports.useEditAlwaysSendWebhookAPI = exports.useEditHmacEnabledAPI = exports.useEditCallbackUrlAPI = exports.useHostedSigninAPI = exports.useSigninAPI = exports.useSignupAPI = exports.useLogoutAPI = exports.requestErrorToast = exports.swrFetcher = exports.fetcher = exports.apiFetch = void 0;
const react_toastify_1 = require("react-toastify");
const user_1 = require("./user");
function apiFetch(input, init) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetch(input, Object.assign(Object.assign({}, init), { headers: Object.assign({ 'Content-Type': 'application/json' }, ((init === null || init === void 0 ? void 0 : init.headers) || {})) }));
    });
}
exports.apiFetch = apiFetch;
function fetcher(...args) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield apiFetch(...args);
        return response.json();
    });
}
exports.fetcher = fetcher;
/**
 * Default SWR fetcher does not throw on HTTP error
 */
function swrFetcher(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield apiFetch(url);
        if (!res.ok) {
            throw { json: yield res.json(), status: res.status };
        }
        return yield res.json();
    });
}
exports.swrFetcher = swrFetcher;
function requestErrorToast() {
    react_toastify_1.toast.error('Request error...', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
}
exports.requestErrorToast = requestErrorToast;
function serverErrorToast() {
    react_toastify_1.toast.error('Server error...', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
}
function useLogoutAPI() {
    return () => __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'POST'
        };
        yield apiFetch('/api/v1/account/logout', options);
    });
}
exports.useLogoutAPI = useLogoutAPI;
function useSignupAPI() {
    return (name, email, password) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ name: name, email: email, password: password })
            };
            return apiFetch('/api/v1/account/signup', options);
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useSignupAPI = useSignupAPI;
function useSigninAPI() {
    return (email, password) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ email: email, password: password })
            };
            const res = yield apiFetch('/api/v1/account/signin', options);
            if (res.status !== 200 && res.status !== 401 && res.status !== 400) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useSigninAPI = useSigninAPI;
function useHostedSigninAPI() {
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch('/api/v1/basic');
            if (res.status !== 200 && res.status !== 401) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useHostedSigninAPI = useHostedSigninAPI;
function useEditCallbackUrlAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (callbackUrl) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ callback_url: callbackUrl })
            };
            const res = yield apiFetch(`/api/v1/environment/callback?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditCallbackUrlAPI = useEditCallbackUrlAPI;
function useEditHmacEnabledAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (hmacEnabled) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ hmac_enabled: hmacEnabled })
            };
            const res = yield apiFetch(`/api/v1/environment/hmac-enabled?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditHmacEnabledAPI = useEditHmacEnabledAPI;
function useEditAlwaysSendWebhookAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (alwaysSendWebhook) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ always_send_webhook: alwaysSendWebhook })
            };
            const res = yield apiFetch(`/api/v1/environment/webhook-send?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditAlwaysSendWebhookAPI = useEditAlwaysSendWebhookAPI;
function useEditSendAuthWebhookAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (sendAuthWebhook) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ send_auth_webhook: sendAuthWebhook })
            };
            const res = yield apiFetch(`/api/v1/environment/webhook-auth-send?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditSendAuthWebhookAPI = useEditSendAuthWebhookAPI;
function useEditHmacKeyAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (hmacKey) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ hmac_key: hmacKey })
            };
            const res = yield apiFetch(`/api/v1/environment/hmac-key?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditHmacKeyAPI = useEditHmacKeyAPI;
function useEditEnvVariablesAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (envVariables) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify(envVariables)
            };
            const res = yield apiFetch(`/api/v1/environment/environment-variables?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditEnvVariablesAPI = useEditEnvVariablesAPI;
function useEditWebhookUrlAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (webhookUrl) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'PATCH',
                body: JSON.stringify({ url: webhookUrl })
            };
            const res = yield apiFetch(`/api/v1/environment/webhook/primary-url?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditWebhookUrlAPI = useEditWebhookUrlAPI;
function useEditWebhookSecondaryUrlAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (webhookSecondaryUrl) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'PATCH',
                body: JSON.stringify({ url: webhookSecondaryUrl })
            };
            const res = yield apiFetch(`/api/v1/environment/webhook/secondary-url?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditWebhookSecondaryUrlAPI = useEditWebhookSecondaryUrlAPI;
function useGetIntegrationListAPI(env) {
    const signout = (0, user_1.useSignout)();
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/integration?env=${env}`);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetIntegrationListAPI = useGetIntegrationListAPI;
function useGetIntegrationDetailsAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (providerConfigKey) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/integration/${encodeURIComponent(providerConfigKey)}?env=${env}&include_creds=true`);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetIntegrationDetailsAPI = useGetIntegrationDetailsAPI;
function useCreateIntegrationAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (provider, authMode, providerConfigKey, clientId, clientSecret, scopes, app_link, custom) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    auth_mode: authMode,
                    provider: provider,
                    provider_config_key: providerConfigKey,
                    oauth_client_id: clientId,
                    oauth_client_secret: clientSecret,
                    oauth_scopes: scopes,
                    app_link,
                    custom
                })
            };
            const res = yield apiFetch(`/api/v1/integration?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useCreateIntegrationAPI = useCreateIntegrationAPI;
function useCreateEmptyIntegrationAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (provider) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    provider: provider
                })
            };
            const res = yield apiFetch(`/api/v1/integration/new?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useCreateEmptyIntegrationAPI = useCreateEmptyIntegrationAPI;
function useEditIntegrationAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (provider, authMode, providerConfigKey, clientId, clientSecret, scopes, app_link, custom) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'PUT',
                body: JSON.stringify({
                    auth_mode: authMode,
                    provider: provider,
                    provider_config_key: providerConfigKey,
                    client_id: clientId,
                    client_secret: clientSecret,
                    scopes: scopes,
                    app_link,
                    custom
                })
            };
            const res = yield apiFetch(`/api/v1/integration?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditIntegrationAPI = useEditIntegrationAPI;
function useEditIntegrationNameAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (providerConfigKey, name) => __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                method: 'PUT',
                body: JSON.stringify({
                    oldProviderConfigKey: providerConfigKey,
                    newProviderConfigKey: name
                })
            };
            const res = yield apiFetch(`/api/v1/integration/name?env=${env}`, options);
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditIntegrationNameAPI = useEditIntegrationNameAPI;
function useDeleteIntegrationAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (providerConfigKey) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/integration/${encodeURIComponent(providerConfigKey)}?env=${env}`, {
                method: 'DELETE'
            });
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 204) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useDeleteIntegrationAPI = useDeleteIntegrationAPI;
function useGetProvidersAPI(env) {
    const signout = (0, user_1.useSignout)();
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/provider?env=${env}`);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetProvidersAPI = useGetProvidersAPI;
function useGetConnectionListAPI(env) {
    const signout = (0, user_1.useSignout)();
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/connection?env=${env}`);
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 200) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetConnectionListAPI = useGetConnectionListAPI;
function useGetConnectionDetailsAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (connectionId, providerConfigKey, force_refresh) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/connection/${encodeURIComponent(connectionId)}?env=${env}&provider_config_key=${encodeURIComponent(providerConfigKey)}&force_refresh=${force_refresh}`);
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetConnectionDetailsAPI = useGetConnectionDetailsAPI;
function useDeleteConnectionAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (connectionId, providerConfigKey) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/connection/${encodeURIComponent(connectionId)}?env=${env}&provider_config_key=${encodeURIComponent(providerConfigKey)}`, {
                method: 'DELETE'
            });
            if (res.status === 401) {
                return signout();
            }
            if (res.status !== 204) {
                return serverErrorToast();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useDeleteConnectionAPI = useDeleteConnectionAPI;
function useRequestPasswordResetAPI() {
    return (email) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/account/forgot-password`, {
                method: 'PUT',
                body: JSON.stringify({ email: email })
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useRequestPasswordResetAPI = useRequestPasswordResetAPI;
function useResetPasswordAPI() {
    return (token, password) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/account/reset-password`, {
                method: 'PUT',
                body: JSON.stringify({ password: password, token: token })
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useResetPasswordAPI = useResetPasswordAPI;
function useGetSyncAPI(env) {
    return (connectionId, providerConfigKey) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/sync?env=${env}&connection_id=${connectionId}&provider_config_key=${providerConfigKey}`, {
                method: 'GET'
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetSyncAPI = useGetSyncAPI;
function useGetHmacAPI(env) {
    return (providerConfigKey, connectionId) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/environment/hmac?env=${env}&connection_id=${connectionId}&provider_config_key=${providerConfigKey}`, {
                method: 'GET'
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetHmacAPI = useGetHmacAPI;
function useGetAllSyncsAPI(env) {
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/syncs?env=${env}`, {
                method: 'GET'
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetAllSyncsAPI = useGetAllSyncsAPI;
function useRunSyncAPI(env) {
    return (command, schedule_id, nango_connection_id, sync_id, sync_name, provider) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/sync/command?env=${env}`, {
                method: 'POST',
                body: JSON.stringify({ command, schedule_id, nango_connection_id, sync_id, sync_name, provider })
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useRunSyncAPI = useRunSyncAPI;
function useGetAccountAPI(env) {
    const signout = (0, user_1.useSignout)();
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/account?env=${env}`);
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetAccountAPI = useGetAccountAPI;
function useEditAccountNameAPI(env) {
    const signout = (0, user_1.useSignout)();
    return (name) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/account?env=${env}`, {
                method: 'PUT',
                body: JSON.stringify({ name })
            });
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditAccountNameAPI = useEditAccountNameAPI;
function useGetUserAPI() {
    const signout = (0, user_1.useSignout)();
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch('/api/v1/user');
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetUserAPI = useGetUserAPI;
function useEditUserNameAPI() {
    const signout = (0, user_1.useSignout)();
    return (name) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch('/api/v1/user/name', {
                method: 'PUT',
                body: JSON.stringify({ name })
            });
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditUserNameAPI = useEditUserNameAPI;
function useEditUserPasswordAPI() {
    const signout = (0, user_1.useSignout)();
    return (oldPassword, newPassword) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch('/api/v1/user/password', {
                method: 'PUT',
                body: JSON.stringify({ oldPassword, newPassword })
            });
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useEditUserPasswordAPI = useEditUserPasswordAPI;
function useInviteSignupAPI() {
    const signout = (0, user_1.useSignout)();
    return (token) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/account/signup/invite?token=${token}`, {
                method: 'GET'
            });
            if (res.status === 401) {
                return signout();
            }
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useInviteSignupAPI = useInviteSignupAPI;
function useGetFlows(env) {
    return () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/flows?env=${env}`, {
                method: 'GET'
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetFlows = useGetFlows;
function useCreateFlow(env) {
    return (flow) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/flow/deploy/pre-built?env=${env}`, {
                method: 'POST',
                body: JSON.stringify(flow)
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useCreateFlow = useCreateFlow;
function useUpdateSyncFrequency(env) {
    return (syncId, frequency) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/sync/${syncId}/frequency?env=${env}`, {
                method: 'PUT',
                body: JSON.stringify({ frequency })
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useUpdateSyncFrequency = useUpdateSyncFrequency;
function useGetConnectionAPI(env) {
    return (providerConfigKey) => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield apiFetch(`/api/v1/integration/${providerConfigKey}/connections?env=${env}`, {
                method: 'GET'
            });
            return res;
        }
        catch (_a) {
            requestErrorToast();
        }
    });
}
exports.useGetConnectionAPI = useGetConnectionAPI;
//# sourceMappingURL=api.js.map