import type { AuthModes, RunSyncCommand, PreBuiltFlow } from '../types';
export declare function apiFetch(input: string | URL | Request, init?: RequestInit | undefined): Promise<Response>;
export declare function fetcher(...args: Parameters<typeof fetch>): Promise<any>;
/**
 * Default SWR fetcher does not throw on HTTP error
 */
export declare function swrFetcher<TBody>(url: string): Promise<TBody>;
export declare function requestErrorToast(): void;
export declare function useLogoutAPI(): () => Promise<void>;
export declare function useSignupAPI(): (name: string, email: string, password: string) => Promise<Response>;
export declare function useSigninAPI(): (email: string, password: string) => Promise<void | Response>;
export declare function useHostedSigninAPI(): () => Promise<void | Response>;
export declare function useEditCallbackUrlAPI(env: string): (callbackUrl: string) => Promise<void | Response>;
export declare function useEditHmacEnabledAPI(env: string): (hmacEnabled: boolean) => Promise<void | Response>;
export declare function useEditAlwaysSendWebhookAPI(env: string): (alwaysSendWebhook: boolean) => Promise<void | Response>;
export declare function useEditSendAuthWebhookAPI(env: string): (sendAuthWebhook: boolean) => Promise<void | Response>;
export declare function useEditHmacKeyAPI(env: string): (hmacKey: string) => Promise<void | Response>;
export declare function useEditEnvVariablesAPI(env: string): (envVariables: Record<string, string>[]) => Promise<void | Response>;
export declare function useEditWebhookUrlAPI(env: string): (webhookUrl: string) => Promise<void | Response>;
export declare function useEditWebhookSecondaryUrlAPI(env: string): (webhookSecondaryUrl: string) => Promise<void | Response>;
export declare function useGetIntegrationListAPI(env: string): () => Promise<void | Response>;
export declare function useGetIntegrationDetailsAPI(env: string): (providerConfigKey: string) => Promise<void | Response>;
export declare function useCreateIntegrationAPI(
    env: string
): (
    provider: string,
    authMode: AuthModes,
    providerConfigKey: string,
    clientId: string,
    clientSecret: string,
    scopes: string,
    app_link: string,
    custom?: Record<string, string>
) => Promise<void | Response>;
export declare function useCreateEmptyIntegrationAPI(env: string): (provider: string) => Promise<void | Response>;
export declare function useEditIntegrationAPI(
    env: string
): (
    provider: string,
    authMode: AuthModes,
    providerConfigKey: string,
    clientId: string,
    clientSecret: string,
    scopes: string,
    app_link: string,
    custom?: Record<string, string>
) => Promise<void | Response>;
export declare function useEditIntegrationNameAPI(env: string): (providerConfigKey: string, name: string) => Promise<void | Response>;
export declare function useDeleteIntegrationAPI(env: string): (providerConfigKey: string) => Promise<void | Response>;
export declare function useGetProvidersAPI(env: string): () => Promise<void | Response>;
export declare function useGetConnectionListAPI(env: string): () => Promise<void | Response>;
export declare function useGetConnectionDetailsAPI(
    env: string
): (connectionId: string, providerConfigKey: string, force_refresh: boolean) => Promise<void | Response>;
export declare function useDeleteConnectionAPI(env: string): (connectionId: string, providerConfigKey: string) => Promise<void | Response>;
export declare function useRequestPasswordResetAPI(): (email: string) => Promise<Response>;
export declare function useResetPasswordAPI(): (token: string, password: string) => Promise<Response>;
export declare function useGetSyncAPI(env: string): (connectionId: string, providerConfigKey: string) => Promise<Response>;
export declare function useGetHmacAPI(env: string): (providerConfigKey: string, connectionId: string) => Promise<Response>;
export declare function useGetAllSyncsAPI(env: string): () => Promise<Response>;
export declare function useRunSyncAPI(
    env: string
): (command: RunSyncCommand, schedule_id: string, nango_connection_id: number, sync_id: string, sync_name: string, provider?: string) => Promise<Response>;
export declare function useGetAccountAPI(env: string): () => Promise<void | Response>;
export declare function useEditAccountNameAPI(env: string): (name: string) => Promise<void | Response>;
export declare function useGetUserAPI(): () => Promise<void | Response>;
export declare function useEditUserNameAPI(): (name: string) => Promise<void | Response>;
export declare function useEditUserPasswordAPI(): (oldPassword: string, newPassword: string) => Promise<void | Response>;
export declare function useInviteSignupAPI(): (token: string) => Promise<void | Response>;
export declare function useGetFlows(env: string): () => Promise<Response>;
export declare function useCreateFlow(env: string): (flow: PreBuiltFlow[]) => Promise<Response>;
export declare function useUpdateSyncFrequency(env: string): (syncId: number, frequency: string) => Promise<Response>;
export declare function useGetConnectionAPI(env: string): (providerConfigKey: string) => Promise<Response>;
