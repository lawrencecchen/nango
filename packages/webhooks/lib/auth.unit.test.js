var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/unbound-method */
import { vi, expect, describe, it, beforeEach } from 'vitest';
import { axiosInstance } from '@nangohq/utils';
import * as logPackage from '@nangohq/logs';
import { sendAuth } from './auth.js';
const spy = vi.spyOn(axiosInstance, 'post');
const connection = {
    connection_id: '1',
    provider_config_key: 'providerkey'
};
const webhookSettings = {
    id: 1,
    environment_id: 1,
    primary_url: 'http://example.com/webhook',
    secondary_url: 'http://example.com/webhook-secondary',
    on_sync_completion_always: true,
    on_auth_creation: true,
    on_auth_refresh_error: true,
    on_sync_error: true
};
const getLogCtx = () => new logPackage.LogContext({ parentId: '1', operation: {} }, { dryRun: true, logToConsole: false });
describe('Webhooks: auth notification tests', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    it('Should not send an auth webhook if the webhook url is not present even if the auth webhook is checked', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '', secondary_url: '', on_auth_creation: true }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should send an auth webhook if the primary webhook url is present but the secondary is not', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_auth_creation: true }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    }));
    it('Should send an auth webhook if the webhook url is not present but the secondary is', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret',
                always_send_webhook: true
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_auth_creation: true, primary_url: '' }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    }));
    it('Should send an auth webhook twice if the webhook url is present and the secondary is as well', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_auth_creation: true }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(2);
    }));
    it('Should send an auth webhook if the webhook url is present and if the auth webhook is checked and the operation failed', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
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
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_auth_creation: true }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    }));
    it('Should not send an auth webhook if the webhook url is present and if the auth webhook is not checked', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_auth_creation: false }),
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should not send an auth webhook if on refresh error is checked but there is no webhook url', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '', secondary_url: '', on_auth_creation: true, on_auth_refresh_error: true }),
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should send an auth webhook if on refresh error is checked', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_auth_creation: true, on_auth_refresh_error: true }),
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    }));
    it('Should not send an auth webhook if on refresh error is not checked', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_auth_creation: true, on_auth_refresh_error: false }),
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should send an auth webhook twice if on refresh error is checked and there are two webhook urls with the correct body', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_auth_creation: false, on_auth_refresh_error: true }),
            provider: 'hubspot',
            activityLogId: 1,
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'refresh',
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(2);
        const body = {
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
        expect(spy).toHaveBeenNthCalledWith(1, 'http://example.com/webhook', expect.objectContaining(body), expect.objectContaining({
            headers: {
                'X-Nango-Signature': expect.toBeSha256()
            }
        }));
        expect(spy).toHaveBeenNthCalledWith(2, 'http://example.com/webhook-secondary', expect.objectContaining(body), expect.objectContaining({
            headers: {
                'X-Nango-Signature': expect.toBeSha256()
            }
        }));
    }));
});
//# sourceMappingURL=auth.unit.test.js.map