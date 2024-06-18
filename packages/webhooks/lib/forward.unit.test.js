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
describe('Webhooks: forward notification tests', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    it('Should not send a forward webhook if the webhook url is not present', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '', secondary_url: '' }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should send a forward webhook if the webhook url is not present but the secondary is', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '' }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    }));
    it('Should send a forwarded webhook if the webhook url is present', () => __awaiter(void 0, void 0, void 0, function* () {
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
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '' }),
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(1);
    }));
    it('Should send a forwarded webhook twice if the webhook url and secondary are present', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        yield sendAuth({
            connection,
            success: true,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            },
            webhookSettings: webhookSettings,
            provider: 'hubspot',
            type: 'auth',
            auth_mode: 'OAUTH2',
            operation: 'creation',
            activityLogId: 1,
            logCtx
        });
        expect(spy).toHaveBeenCalledTimes(2);
    }));
});
//# sourceMappingURL=forward.unit.test.js.map