import { PostHog } from 'posthog-node';

import { UserType } from '../utils/utils.js';
export declare enum AnalyticsTypes {
    ACCOUNT_CREATED = 'server:account_created',
    ACCOUNT_JOINED = 'server:account_joined',
    API_CONNECTION_INSERTED = 'server:api_key_connection_inserted',
    API_CONNECTION_UPDATED = 'server:api_key_connection_updated',
    CONFIG_CREATED = 'server:config_created',
    CONNECTION_INSERTED = 'server:connection_inserted',
    CONNECTION_LIST_FETCHED = 'server:connection_list_fetched',
    CONNECTION_UPDATED = 'server:connection_updated',
    DEMO_0 = 'demo:step_0',
    DEMO_1 = 'demo:step_1',
    DEMO_1_ERR = 'demo:step_1:error',
    DEMO_1_SUCCESS = 'demo:step_1:success',
    DEMO_2 = 'demo:step_2',
    DEMO_2_ERR = 'demo:step_2:error',
    DEMO_2_SUCCESS = 'demo:step_2:success',
    DEMO_3 = 'demo:step_3',
    DEMO_4 = 'demo:step_4',
    DEMO_4_ERR = 'demo:step_4:error',
    DEMO_4_SUCCESS = 'demo:step_4:success',
    DEMO_5 = 'demo:step_5',
    DEMO_5_ERR = 'demo:step_5:error',
    DEMO_5_SUCCESS = 'demo:step_5:success',
    DEMO_6 = 'demo:step_6',
    PRE_API_KEY_AUTH = 'server:pre_api_key_auth',
    PRE_APP_AUTH = 'server:pre_appauth',
    PRE_APP_STORE_AUTH = 'server:pre_app_store_auth',
    PRE_BASIC_API_KEY_AUTH = 'server:pre_basic_api_key_auth',
    PRE_UNAUTH = 'server:pre_unauth',
    PRE_WS_OAUTH = 'server:pre_ws_oauth',
    PRE_OAUTH2_CC_AUTH = 'server:pre_oauth2_cc_auth',
    RESOURCE_CAPPED_CONNECTION_CREATED = 'server:resource_capped:connection_creation',
    RESOURCE_CAPPED_CONNECTION_IMPORTED = 'server:resource_capped:connection_imported',
    RESOURCE_CAPPED_SCRIPT_ACTIVATE = 'server:resource_capped:script_activate',
    RESOURCE_CAPPED_SCRIPT_DEPLOY_IS_DISABLED = 'server:resource_capped:script_deploy_is_disabled',
    SYNC_DEPLOY_SUCCESS = 'sync:deploy_succeeded',
    SYNC_PAUSE = 'sync:command_pause',
    SYNC_RUN = 'sync:command_run',
    SYNC_UNPAUSE = 'sync:command_unpause',
    SYNC_CANCEL = 'sync:command_cancel',
    UNAUTH_CONNECTION_INSERTED = 'server:unauth_connection_inserted',
    UNAUTH_CONNECTION_UPDATED = 'server:unauth_connection_updated',
    WEB_CONNECION_CREATED = 'web:connection_created',
    WEB_ACCOUNT_SIGNUP = 'web:account_signup'
}
declare class Analytics {
    client: PostHog | undefined;
    packageVersion: string | undefined;
    constructor();
    track(name: string, accountId: number, eventProperties?: Record<string | number, any>, userProperties?: Record<string | number, any>): Promise<void>;
    trackByEnvironmentId(
        name: string,
        environmentId: number,
        eventProperties?: Record<string | number, any>,
        userProperties?: Record<string | number, any>
    ): Promise<void>;
    getUserType(accountId: number, baseUrl: string): UserType;
    getUserIdWithType(userType: string, accountId: number, baseUrl: string): string;
}
declare const _default: Analytics;
export default _default;
