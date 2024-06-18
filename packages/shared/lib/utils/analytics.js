var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PostHog } from 'posthog-node';
import { localhostUrl, isCloud, isStaging, baseUrl } from '@nangohq/utils';
import ip from 'ip';
import { UserType } from '../utils/utils.js';
import errorManager, { ErrorSourceEnum } from './error.manager.js';
import accountService from '../services/account.service.js';
import environmentService from '../services/environment.service.js';
import userService from '../services/user.service.js';
import { LogActionEnum } from '../models/Activity.js';
import { NANGO_VERSION } from '../version.js';
export var AnalyticsTypes;
(function (AnalyticsTypes) {
    AnalyticsTypes["ACCOUNT_CREATED"] = "server:account_created";
    AnalyticsTypes["ACCOUNT_JOINED"] = "server:account_joined";
    AnalyticsTypes["API_CONNECTION_INSERTED"] = "server:api_key_connection_inserted";
    AnalyticsTypes["API_CONNECTION_UPDATED"] = "server:api_key_connection_updated";
    AnalyticsTypes["CONFIG_CREATED"] = "server:config_created";
    AnalyticsTypes["CONNECTION_INSERTED"] = "server:connection_inserted";
    AnalyticsTypes["CONNECTION_LIST_FETCHED"] = "server:connection_list_fetched";
    AnalyticsTypes["CONNECTION_UPDATED"] = "server:connection_updated";
    AnalyticsTypes["DEMO_0"] = "demo:step_0";
    AnalyticsTypes["DEMO_1"] = "demo:step_1";
    AnalyticsTypes["DEMO_1_ERR"] = "demo:step_1:error";
    AnalyticsTypes["DEMO_1_SUCCESS"] = "demo:step_1:success";
    AnalyticsTypes["DEMO_2"] = "demo:step_2";
    AnalyticsTypes["DEMO_2_ERR"] = "demo:step_2:error";
    AnalyticsTypes["DEMO_2_SUCCESS"] = "demo:step_2:success";
    AnalyticsTypes["DEMO_3"] = "demo:step_3";
    AnalyticsTypes["DEMO_4"] = "demo:step_4";
    AnalyticsTypes["DEMO_4_ERR"] = "demo:step_4:error";
    AnalyticsTypes["DEMO_4_SUCCESS"] = "demo:step_4:success";
    AnalyticsTypes["DEMO_5"] = "demo:step_5";
    AnalyticsTypes["DEMO_5_ERR"] = "demo:step_5:error";
    AnalyticsTypes["DEMO_5_SUCCESS"] = "demo:step_5:success";
    AnalyticsTypes["DEMO_6"] = "demo:step_6";
    AnalyticsTypes["PRE_API_KEY_AUTH"] = "server:pre_api_key_auth";
    AnalyticsTypes["PRE_APP_AUTH"] = "server:pre_appauth";
    AnalyticsTypes["PRE_APP_STORE_AUTH"] = "server:pre_app_store_auth";
    AnalyticsTypes["PRE_BASIC_API_KEY_AUTH"] = "server:pre_basic_api_key_auth";
    AnalyticsTypes["PRE_UNAUTH"] = "server:pre_unauth";
    AnalyticsTypes["PRE_WS_OAUTH"] = "server:pre_ws_oauth";
    AnalyticsTypes["PRE_OAUTH2_CC_AUTH"] = "server:pre_oauth2_cc_auth";
    AnalyticsTypes["RESOURCE_CAPPED_CONNECTION_CREATED"] = "server:resource_capped:connection_creation";
    AnalyticsTypes["RESOURCE_CAPPED_CONNECTION_IMPORTED"] = "server:resource_capped:connection_imported";
    AnalyticsTypes["RESOURCE_CAPPED_SCRIPT_ACTIVATE"] = "server:resource_capped:script_activate";
    AnalyticsTypes["RESOURCE_CAPPED_SCRIPT_DEPLOY_IS_DISABLED"] = "server:resource_capped:script_deploy_is_disabled";
    AnalyticsTypes["SYNC_DEPLOY_SUCCESS"] = "sync:deploy_succeeded";
    AnalyticsTypes["SYNC_PAUSE"] = "sync:command_pause";
    AnalyticsTypes["SYNC_RUN"] = "sync:command_run";
    AnalyticsTypes["SYNC_UNPAUSE"] = "sync:command_unpause";
    AnalyticsTypes["SYNC_CANCEL"] = "sync:command_cancel";
    AnalyticsTypes["UNAUTH_CONNECTION_INSERTED"] = "server:unauth_connection_inserted";
    AnalyticsTypes["UNAUTH_CONNECTION_UPDATED"] = "server:unauth_connection_updated";
    AnalyticsTypes["WEB_CONNECION_CREATED"] = "web:connection_created";
    AnalyticsTypes["WEB_ACCOUNT_SIGNUP"] = "web:account_signup";
})(AnalyticsTypes = AnalyticsTypes || (AnalyticsTypes = {}));
class Analytics {
    constructor() {
        var _a;
        try {
            if (((_a = process.env['TELEMETRY']) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'false' && !isStaging) {
                this.client = new PostHog('phc_4S2pWFTyPYT1i7zwC8YYQqABvGgSAzNHubUkdEFvcTl');
                this.client.enable();
                this.packageVersion = NANGO_VERSION;
            }
        }
        catch (e) {
            errorManager.report(e, {
                source: ErrorSourceEnum.PLATFORM,
                operation: LogActionEnum.ANALYTICS
            });
        }
    }
    track(name, accountId, eventProperties, userProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.client == null) {
                    return;
                }
                eventProperties = eventProperties || {};
                userProperties = userProperties || {};
                const userType = this.getUserType(accountId, baseUrl);
                const userId = this.getUserIdWithType(userType, accountId, baseUrl);
                eventProperties['host'] = baseUrl;
                eventProperties['user-type'] = userType;
                eventProperties['user-account'] = userId;
                eventProperties['nango-server-version'] = this.packageVersion || 'unknown';
                if (isCloud && accountId != null) {
                    const account = yield accountService.getAccountById(accountId);
                    if (account !== null && account.id !== undefined) {
                        const users = yield userService.getUsersByAccountId(account.id);
                        if (users) {
                            userProperties['email'] = users.map((user) => user.email).join(',');
                            userProperties['name'] = users.map((user) => user.name).join(',');
                        }
                    }
                }
                userProperties['user-type'] = userType;
                userProperties['account'] = userId;
                eventProperties['$set'] = userProperties;
                this.client.capture({
                    event: name,
                    distinctId: userId,
                    properties: eventProperties
                });
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.ANALYTICS,
                    accountId: accountId
                });
            }
        });
    }
    trackByEnvironmentId(name, environmentId, eventProperties, userProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountId = yield environmentService.getAccountIdFromEnvironment(environmentId);
            if (typeof accountId !== 'undefined' && accountId !== null) {
                return this.track(name, accountId, eventProperties, userProperties);
            }
        });
    }
    getUserType(accountId, baseUrl) {
        if (baseUrl === localhostUrl) {
            return UserType.Local;
        }
        else if (accountId === 0) {
            return UserType.SelfHosted;
        }
        else {
            return UserType.Cloud;
        }
    }
    getUserIdWithType(userType, accountId, baseUrl) {
        switch (userType) {
            case UserType.Local:
                return `${userType}-${ip.address()}`;
            case UserType.SelfHosted:
                return `${userType}-${baseUrl}`;
            case UserType.Cloud:
                return `${userType}-${(accountId || 0).toString()}`;
            default:
                return 'unknown';
        }
    }
}
export default new Analytics();
//# sourceMappingURL=analytics.js.map