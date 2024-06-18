import type { Endpoint } from '../../api.js';
export interface WebhookSettings {
    alwaysSendWebhook: boolean;
    sendAuthWebhook: boolean;
    sendRefreshFailedWebhook: boolean;
    sendSyncFailedWebhook: boolean;
}
export declare type UpdateWebhookSettings = Endpoint<{
    Method: 'PATCH';
    Querystring: {
        env: string;
    };
    Path: '/api/v1/environment/webhook/settings';
    Body: WebhookSettings;
    Success: WebhookSettings;
}>;
export declare type UpdatePrimaryUrl = Endpoint<{
    Method: 'PATCH';
    Querystring: {
        env: string;
    };
    Path: '/api/v1/environment/webhook/url/primary-url';
    Body: {
        url: string;
    };
    Success: {
        data: {
            url: string;
        };
    };
}>;
export declare type UpdateSecondaryUrl = Endpoint<{
    Method: 'PATCH';
    Querystring: {
        env: string;
    };
    Path: '/api/v1/environment/webhook/secondary-url';
    Body: {
        url: string;
    };
    Success: {
        data: {
            url: string;
        };
    };
}>;
