var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, vi, beforeAll } from 'vitest';
import { NangoError, configService } from '@nangohq/shared';
import db, { multipleMigrations } from '@nangohq/database';
import configController from './config.controller.js';
const locals = {
    authType: 'secretKey',
    account: { id: 0 },
    environment: { id: 1 },
    user: { id: 0 }
};
/**
 * LIST: ✅
 * GET: ✅
 * CREATE: ✅
 * UPDATE: ✅
 * DELETE: ✅
 */
describe('Should verify the config controller HTTP API calls', () => __awaiter(void 0, void 0, void 0, function* () {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
        console.log('Database is migrated and ready');
    }));
    it('CREATE provider config handles various missing attributes', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_environments');
        const req = {
            body: null,
            headers: {
                Authorization: `Bearer ${result[0].secret_key}`
            }
        };
        const sendMock = vi.fn();
        const res = {
            status: (_code) => {
                return {
                    send: sendMock
                };
            },
            locals
        };
        const statusSpy = vi.spyOn(res, 'status');
        const next = () => {
            return;
        };
        yield configController.createProviderConfig(req, res, next);
        expect(statusSpy).toHaveBeenCalledWith(400);
        let err = new NangoError('missing_body');
        expect(sendMock).toHaveBeenCalledWith({ error: { message: err.message, code: err.type, payload: err.payload } });
        sendMock.mockReset();
        req.body = {};
        res.status = (_code) => {
            return {
                send: sendMock
            };
        };
        yield configController.createProviderConfig(req, res, next);
        expect(statusSpy).toHaveBeenCalledWith(400);
        err = new NangoError('missing_provider_config');
        expect(sendMock).toHaveBeenCalledWith({ error: { message: err.message, code: err.type, payload: err.payload } });
    }));
    it('CREATE a provider config successfully and then LIST', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_environments');
        const req = {
            body: {
                provider_config_key: 'test',
                provider: 'notion',
                oauth_client_id: 'abc',
                oauth_client_secret: 'def',
                oauth_scopes: 'abc,def'
            },
            headers: {
                Authorization: `Bearer ${result[0].secret_key}`
            }
        };
        const res = {
            status: (_code) => {
                return {
                    send: (data) => {
                        return data;
                    }
                };
            },
            locals
        };
        const statusSpy = vi.spyOn(res, 'status');
        const next = () => {
            return;
        };
        yield configController.createProviderConfig(req, res, next);
        expect(statusSpy).toHaveBeenCalledWith(200);
        const config = yield configService.getProviderConfig('test', 1);
        expect(config).toBeDefined();
        expect(config === null || config === void 0 ? void 0 : config.unique_key).toBe('test');
        expect(config === null || config === void 0 ? void 0 : config.oauth_scopes).toBe('abc,def');
        const sendMock = vi.fn();
        const listRes = {
            status: (code) => {
                expect(code).toBe(200);
                return {
                    send: sendMock
                };
            },
            locals
        };
        const listNext = () => {
            return;
        };
        yield configController.listProviderConfigs({}, listRes, listNext);
        const existingConfigs = yield db.knex.select('*').from('_nango_configs').where({ environment_id: 1, deleted: false });
        const configs = existingConfigs.map((config) => {
            return {
                unique_key: config.unique_key,
                provider: config.provider
            };
        });
        expect(sendMock).toHaveBeenCalledWith({ configs });
    }));
    it('UPDATE and then GET a provider config successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_environments');
        const req = {
            body: {
                provider_config_key: 'test',
                provider: 'notion',
                oauth_client_id: 'abc',
                oauth_client_secret: 'def',
                oauth_scopes: 'abc,def,efg',
                app_link: null,
                auth_mode: 'OAUTH2'
            },
            headers: {
                Authorization: `Bearer ${result[0].secret_key}`
            }
        };
        const res = {
            status: (_code) => {
                return {
                    send: (data) => {
                        return data;
                    }
                };
            },
            locals
        };
        const statusSpy = vi.spyOn(res, 'status');
        const next = () => {
            return;
        };
        yield configController.editProviderConfig(req, res, next);
        expect(statusSpy).toHaveBeenCalledWith(200);
        const config = yield configService.getProviderConfig('test', 1);
        expect(config).toBeDefined();
        expect(config === null || config === void 0 ? void 0 : config.oauth_scopes).toBe('abc,def,efg');
        // controller should also return this integration
        req.query = {};
        req.params = {
            providerConfigKey: 'test'
        };
        const sendMock = vi.fn();
        const getRes = {
            status: (code) => {
                expect(code).toBe(200);
                return {
                    send: sendMock
                };
            },
            locals
        };
        yield configController.getProviderConfig(req, getRes, next);
        expect(sendMock).toHaveBeenCalledWith({
            config: {
                provider: 'notion',
                unique_key: 'test',
                syncs: [],
                actions: []
            }
        });
        sendMock.mockReset();
        req.query = {
            include_creds: 'true'
        };
        yield configController.getProviderConfig(req, getRes, next);
        expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
            config: {
                provider: 'notion',
                unique_key: 'test',
                client_id: 'abc',
                client_secret: 'def',
                connection_count: 0,
                connections: [],
                custom: null,
                docs: 'https://docs.nango.dev/integrations/all/notion',
                has_webhook: false,
                scopes: 'abc,def,efg',
                app_link: null,
                auth_mode: 'OAUTH2',
                created_at: expect.any(Date),
                syncs: [],
                actions: [],
                webhook_secret: null,
                webhook_url: null,
                has_webhook_user_defined_secret: undefined
            }
        }));
    }));
    it('DELETE a provider config successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_environments');
        const req = {
            params: {
                providerConfigKey: 'test'
            },
            headers: {
                Authorization: `Bearer ${result[0].secret_key}`
            }
        };
        const res = {
            status: (code) => {
                return code;
            },
            locals
        };
        const statusSpy = vi.spyOn(res, 'status');
        const next = () => {
            return;
        };
        yield configController.deleteProviderConfig(req, res, next);
        const config = yield configService.getProviderConfig('test', 1);
        expect(statusSpy).toHaveBeenCalledWith(204);
        expect(config).toBe(null);
    }));
}));
//# sourceMappingURL=config.controller.integration.test.js.map