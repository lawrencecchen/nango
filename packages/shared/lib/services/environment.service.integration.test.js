var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect, describe, it, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { multipleMigrations } from '@nangohq/database';
import environmentService, { hashSecretKey } from './environment.service.js';
import { createAccount } from '../seeders/account.seeder.js';
describe('Environment service', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield multipleMigrations();
    }));
    it('should create a service with secrets', () => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield createAccount();
        const envName = uuid();
        const env = yield environmentService.createEnvironment(account.id, envName);
        if (!env) {
            throw new Error('failed_to_create_env');
        }
        expect(env).toStrictEqual({
            account_id: account.id,
            always_send_webhook: false,
            callback_url: null,
            created_at: expect.toBeIsoDate(),
            hmac_enabled: false,
            hmac_key: null,
            id: expect.any(Number),
            name: envName,
            pending_public_key: null,
            pending_secret_key: null,
            pending_secret_key_iv: null,
            pending_secret_key_tag: null,
            public_key: expect.any(String),
            secret_key: expect.any(String),
            secret_key_hashed: expect.any(String),
            secret_key_iv: expect.any(String),
            secret_key_tag: expect.any(String),
            send_auth_webhook: false,
            slack_notifications: false,
            updated_at: expect.toBeIsoDate(),
            uuid: expect.any(String),
            webhook_url: null,
            webhook_url_secondary: null
        });
        expect(env.secret_key).not.toEqual(env.secret_key_hashed);
    }));
    it('should retrieve env and account by various keys', () => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield createAccount();
        const environment = yield environmentService.createEnvironment(account.id, uuid());
        const bySecretKey = yield environmentService.getAccountAndEnvironment({ secretKey: environment.secret_key });
        expect(bySecretKey).toStrictEqual({
            account: Object.assign(Object.assign({}, account), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() }),
            environment: Object.assign(Object.assign({}, environment), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() })
        });
        const byPublicKey = yield environmentService.getAccountAndEnvironment({ publicKey: environment.public_key });
        expect(byPublicKey).toStrictEqual({
            account: Object.assign(Object.assign({}, account), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() }),
            environment: Object.assign(Object.assign({}, environment), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() })
        });
        const byUuid = yield environmentService.getAccountAndEnvironment({ environmentUuid: environment.uuid });
        expect(byUuid).toStrictEqual({
            account: Object.assign(Object.assign({}, account), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() }),
            environment: Object.assign(Object.assign({}, environment), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() })
        });
        const byAccountUuid = yield environmentService.getAccountAndEnvironment({ accountUuid: account.uuid, envName: environment.name });
        expect(byAccountUuid).toStrictEqual({
            account: Object.assign(Object.assign({}, account), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() }),
            environment: Object.assign(Object.assign({}, environment), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() })
        });
        const byAccountId = yield environmentService.getAccountAndEnvironment({ accountId: account.id, envName: environment.name });
        expect(byAccountId).toStrictEqual({
            account: Object.assign(Object.assign({}, account), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() }),
            environment: Object.assign(Object.assign({}, environment), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() })
        });
        const byEnvironmentId = yield environmentService.getAccountAndEnvironment({ environmentId: environment.id });
        expect(byEnvironmentId).toStrictEqual({
            account: Object.assign(Object.assign({}, account), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() }),
            environment: Object.assign(Object.assign({}, environment), { created_at: expect.toBeIsoDateTimezone(), updated_at: expect.toBeIsoDateTimezone() })
        });
    }));
    it('should retrieve env by secretKey', () => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield createAccount();
        const env = yield environmentService.createEnvironment(account.id, uuid());
        const get = yield environmentService.getAccountAndEnvironmentBySecretKey(env.secret_key);
        expect(get).toMatchObject({
            account: { id: account.id },
            environment: { id: env.id }
        });
    }));
    it('should rotate secretKey', () => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield createAccount();
        const env = (yield environmentService.createEnvironment(account.id, uuid()));
        expect(env.secret_key).toBeUUID();
        // Rotate
        yield environmentService.rotateSecretKey(env.id);
        const env2 = (yield environmentService.getById(env.id));
        expect(env2.pending_secret_key).not.toBeNull();
        expect(env2.pending_secret_key).not.toEqual(env2.secret_key);
        expect(env2.secret_key_hashed).not.toEqual(env.secret_key);
        expect(env2.secret_key_hashed).toEqual(yield hashSecretKey(env.secret_key));
        // Activate
        yield environmentService.activateSecretKey(env.id);
        const env3 = (yield environmentService.getById(env.id));
        expect(env3.secret_key).toBeUUID();
        expect(env3.pending_secret_key).toBeNull();
        expect(env3.secret_key).toEqual(env2.pending_secret_key);
        expect(env3.secret_key_hashed).toEqual(yield hashSecretKey(env3.secret_key));
    }));
});
//# sourceMappingURL=environment.service.integration.test.js.map