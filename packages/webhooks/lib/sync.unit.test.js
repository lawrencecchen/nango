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
import { sendSync } from './sync.js';
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
describe('Webhooks: sync notification tests', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    it('Should not send a sync webhook if the webhook url is not present', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 10, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            environment: { name: 'dev', id: 1, secret_key: 'secret' },
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '', secondary_url: '', on_sync_completion_always: false }),
            syncName: 'syncName',
            model: 'model',
            responseResults,
            success: true,
            operation: 'INCREMENTAL',
            now: new Date(),
            activityLogId: 1,
            logCtx
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should not send a sync webhook if the webhook url is not present even if always send is checked', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 10, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            success: true,
            operation: 'INCREMENTAL',
            now: new Date(),
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { primary_url: '', secondary_url: '', on_sync_completion_always: true }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(axiosInstance.post).not.toHaveBeenCalled();
    }));
    it('Should not send a sync webhook if the webhook url is present but if always send is not checked and there were no sync changes', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 0, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            operation: 'INCREMENTAL',
            success: true,
            now: new Date(),
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_sync_completion_always: false }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should send a sync webhook if the webhook url is present and if always send is not checked and there were sync changes', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 10, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            operation: 'INCREMENTAL',
            success: true,
            now: new Date(),
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_sync_completion_always: false }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(spy).toHaveBeenCalled();
    }));
    it('Should send a sync webhook if the webhook url is present and if always send is checked and there were sync changes', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 10, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            operation: 'INCREMENTAL',
            success: true,
            now: new Date(),
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_sync_completion_always: true }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(spy).toHaveBeenCalled();
    }));
    it('Should send an sync webhook if the webhook url is present and if always send is checked and there were no sync changes', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 0, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            operation: 'INCREMENTAL',
            now: new Date(),
            activityLogId: 1,
            logCtx,
            success: true,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { secondary_url: '', on_sync_completion_always: true }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(spy).toHaveBeenCalled();
    }));
    it('Should send an sync webhook twice if the webhook url and secondary are present and if always send is checked and there were no sync changes', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const responseResults = { added: 0, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            operation: 'INCREMENTAL',
            now: new Date(),
            success: true,
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_sync_completion_always: true }),
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            }
        });
        expect(spy).toHaveBeenCalledTimes(2);
    }));
    it('Should send a webhook with the correct body on sync success', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const now = new Date();
        const responseResults = { added: 10, updated: 0, deleted: 0 };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            responseResults,
            operation: 'INCREMENTAL',
            now,
            success: true,
            activityLogId: 1,
            logCtx,
            webhookSettings: webhookSettings,
            environment: {
                name: 'dev',
                id: 1,
                secret_key: 'secret'
            }
        });
        const body = {
            from: 'nango',
            type: 'sync',
            modifiedAfter: now.toISOString(),
            model: 'model',
            queryTimeStamp: now,
            responseResults,
            connectionId: connection.connection_id,
            syncName: 'syncName',
            providerConfigKey: connection.provider_config_key,
            success: true,
            syncType: 'INCREMENTAL'
        };
        expect(spy).toHaveBeenCalledTimes(2);
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
    it('Should not send an error webhook if the option is not checked', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const error = {
            type: 'error',
            description: 'error description'
        };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            success: false,
            error,
            operation: 'INCREMENTAL',
            now: new Date(),
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_sync_error: false }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(spy).not.toHaveBeenCalled();
    }));
    it('Should send an error webhook if the option is checked with the correct body', () => __awaiter(void 0, void 0, void 0, function* () {
        const logCtx = getLogCtx();
        const error = {
            type: 'error',
            description: 'error description'
        };
        yield sendSync({
            connection,
            syncName: 'syncName',
            model: 'model',
            success: false,
            error,
            operation: 'INCREMENTAL',
            now: new Date(),
            activityLogId: 1,
            logCtx,
            webhookSettings: Object.assign(Object.assign({}, webhookSettings), { on_sync_error: true }),
            environment: { name: 'dev', id: 1, secret_key: 'secret' }
        });
        expect(spy).toHaveBeenCalled();
    }));
});
//# sourceMappingURL=sync.unit.test.js.map