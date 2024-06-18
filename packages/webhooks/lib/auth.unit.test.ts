/* eslint-disable @typescript-eslint/unbound-method */
import { vi, expect, describe, it, beforeEach } from 'vitest';
import { axiosInstance } from '@nangohq/utils';
import type { NangoAuthWebhookBodySuccess, Connection, Environment, ExternalWebhook } from '@nangohq/types';
import * as logPackage from '@nangohq/logs';

import { sendAuth } from './auth.js';

const spy = vi.spyOn(axiosInstance, 'post');

const connection: Pick<Connection, 'connection_id' | 'provider_config_key'> = {
    connection_id: '1',
    provider_config_key: 'providerkey'
};

const webhookSettings: ExternalWebhook = {
    id: 1,
    environment_id: 1,
    primary_url: 'http://example.com/webhook',
    secondary_url: 'http://example.com/webhook-secondary',
    on_sync_completion_always: true,
    on_auth_creation: true,
    on_auth_refresh_error: true,
    on_sync_error: true
};

const getLogCtx = () => new logPackage.LogContext({ parentId: '1', operation: {} as any }, { dryRun: true, logToConsole: false });

describe('Webhooks: auth notification tests', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('Should not send an auth webhook if the webhook url is not present even if the auth webhook is checked', async () => {
        const logCtx = getLogCtx();

        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                primary_url: '',
                secondary_url: '',
                on_auth_creation: true
            },
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    });

    it('Should send an auth webhook if the primary webhook url is present but the secondary is not', async () => {
        const logCtx = getLogCtx();

        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                secondary_url: '',
                on_auth_creation: true
            },
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should send an auth webhook if the webhook url is not present but the secondary is', async () => {
        const logCtx = getLogCtx();

        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret',
                always_send_webhook: true
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                on_auth_creation: true,
                primary_url: ''
            },
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should send an auth webhook twice if the webhook url is present and the secondary is as well', async () => {
        const logCtx = getLogCtx();

        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                on_auth_creation: true
            },
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('Should send an auth webhook if the webhook url is present and if the auth webhook is checked and the operation failed', async () => {
        const logCtx = getLogCtx();

        await sendAuth({
            connection,
            success: false,
            error: {
                type: 'error',
                description: 'error description'
            },
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                secondary_url: '',
                on_auth_creation: true
            },
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should not send an auth webhook if the webhook url is present and if the auth webhook is not checked', async () => {
        const logCtx = getLogCtx();
        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                on_auth_creation: false
            },
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    });

    it('Should not send an auth webhook if on refresh error is checked but there is no webhook url', async () => {
        const logCtx = getLogCtx();
        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                primary_url: '',
                secondary_url: '',
                on_auth_creation: true,
                on_auth_refresh_error: true
            },
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    });

    it('Should send an auth webhook if on refresh error is checked', async () => {
        const logCtx = getLogCtx();
        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                secondary_url: '',
                on_auth_creation: true,
                on_auth_refresh_error: true
            },
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should not send an auth webhook if on refresh error is not checked', async () => {
        const logCtx = getLogCtx();
        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                on_auth_creation: true,
                on_auth_refresh_error: false
            },
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });

        expect(spy).not.toHaveBeenCalled();
    });

    it('Should send an auth webhook twice if on refresh error is checked and there are two webhook urls with the correct body', async () => {
        const logCtx = getLogCtx();
        await sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            } as Environment,
            webhookSettings: {
                ...webhookSettings,
                on_auth_creation: false,
                on_auth_refresh_error: true
            },
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });

        expect(spy).toHaveBeenCalledTimes(2);

        const body: NangoAuthWebhookBodySuccess = {
            from: 'nango',
            type: 'auth',
            connectionId: connection.connection_id,
            providerConfigKey: connection.provider_config_key,
            authMode: 'OAUTH2',
            provider: 'hubspot',
            environment: 'dev',
            success: true,
            operation: 'refresh'
        };

        expect(spy).toHaveBeenNthCalledWith(
            1,
            'http://example.com/webhook',
            expect.objectContaining(body),
            expect.objectContaining({
                headers: {
                    'X-Nango-Signature': expect.toBeSha256()
                }
            })
        );

        expect(spy).toHaveBeenNthCalledWith(
            2,
            'http://example.com/webhook-secondary',
            expect.objectContaining(body),
            expect.objectContaining({
                headers: {
                    'X-Nango-Signature': expect.toBeSha256()
                }
            })
        );
    });
});
