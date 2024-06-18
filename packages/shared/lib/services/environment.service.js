var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as uuid from 'uuid';
import db from '@nangohq/database';
import { isCloud } from '@nangohq/utils';
import encryptionManager, { pbkdf2 } from '../utils/encryption.manager.js';
import { LogActionEnum } from '../models/Activity.js';
import accountService from './account.service.js';
import errorManager, { ErrorSourceEnum } from '../utils/error.manager.js';
const TABLE = '_nango_environments';
export const defaultEnvironments = ['prod', 'dev'];
const hashLocalCache = new Map();
class EnvironmentService {
    getEnvironmentsByAccountId(account_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db.knex.select('name').from(TABLE).where({ account_id });
                if (result == null || result.length == 0) {
                    return [];
                }
                return result;
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.DATABASE,
                    accountId: account_id
                });
                return [];
            }
        });
    }
    getAccountAndEnvironmentBySecretKey(secretKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isCloud) {
                const environmentVariables = Object.keys(process.env).filter((key) => key.startsWith('NANGO_SECRET_KEY_'));
                if (environmentVariables.length > 0) {
                    for (const environmentVariable of environmentVariables) {
                        const envSecretKey = process.env[environmentVariable];
                        if (envSecretKey !== secretKey) {
                            continue;
                        }
                        const envName = environmentVariable.replace('NANGO_SECRET_KEY_', '').toLowerCase();
                        // This key is set dynamically and does not exists in database
                        const env = yield db.knex.select('account_id').from(TABLE).where({ name: envName }).first();
                        if (!env) {
                            return null;
                        }
                        return this.getAccountAndEnvironment({ accountId: env.account_id, envName });
                    }
                }
            }
            return this.getAccountAndEnvironment({ secretKey });
        });
    }
    getAccountIdFromEnvironment(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('account_id').from(TABLE).where({ id: environment_id });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].account_id;
        });
    }
    getAccountFromEnvironment(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex
                .select('_nango_accounts.*')
                .from(TABLE)
                .join('_nango_accounts', '_nango_accounts.id', '_nango_environments.account_id')
                .where('_nango_environments.id', environment_id)
                .first();
            return result || null;
        });
    }
    getAccountUUIDFromEnvironmentUUID(environment_uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('account_id').from(TABLE).where({ uuid: environment_uuid });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            const accountId = result[0].account_id;
            const uuid = yield accountService.getUUIDFromAccountId(accountId);
            return uuid;
        });
    }
    getAccountAndEnvironmentByPublicKey(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isCloud) {
                const environmentVariables = Object.keys(process.env).filter((key) => key.startsWith('NANGO_PUBLIC_KEY_'));
                if (environmentVariables.length > 0) {
                    for (const environmentVariable of environmentVariables) {
                        const envPublicKey = process.env[environmentVariable];
                        if (envPublicKey !== publicKey) {
                            continue;
                        }
                        const envName = environmentVariable.replace('NANGO_PUBLIC_KEY_', '').toLowerCase();
                        // This key is set dynamically and does not exists in database
                        const env = yield db.knex.select('account_id').from(TABLE).where({ name: envName }).first();
                        if (!env) {
                            return null;
                        }
                        return this.getAccountAndEnvironment({ accountId: env.account_id, envName });
                    }
                }
            }
            return this.getAccountAndEnvironment({ publicKey });
        });
    }
    getAccountAndEnvironment(
    // TODO: fix this union type that is not discriminated
    opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = db.knex
                .select(db.knex.raw('row_to_json(_nango_environments.*) as environment'), db.knex.raw('row_to_json(_nango_accounts.*) as account'))
                .from(TABLE)
                .join('_nango_accounts', '_nango_accounts.id', '_nango_environments.account_id')
                .first();
            let hash;
            if ('secretKey' in opts) {
                // Hashing is slow by design so it's very slow to recompute this hash all the time
                // We keep the hash in-memory to not compromise on security if the db leak
                hash = hashLocalCache.get(opts.secretKey) || (yield hashSecretKey(opts.secretKey));
                q.where('secret_key_hashed', hash);
            }
            else if ('publicKey' in opts) {
                q.where('_nango_environments.public_key', opts.publicKey);
            }
            else if ('environmentUuid' in opts) {
                q.where('_nango_environments.uuid', opts.environmentUuid);
            }
            else if ('accountUuid' in opts) {
                q.where('_nango_accounts.uuid', opts.accountUuid).where('_nango_environments.name', opts.envName);
            }
            else if ('accountId' in opts) {
                q.where('_nango_environments.account_id', opts.accountId).where('_nango_environments.name', opts.envName);
            }
            else if ('environmentId' in opts) {
                q.where('_nango_environments.id', opts.environmentId);
            }
            else {
                return null;
            }
            const res = yield q;
            if (!res) {
                return null;
            }
            if (hash && 'secretKey' in opts) {
                // Store only successful attempt to not pollute the memory
                hashLocalCache.set(opts.secretKey, hash);
            }
            return { account: res.account, environment: encryptionManager.decryptEnvironment(res.environment) };
        });
    }
    getIdByUuid(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('id').from(TABLE).where({ uuid });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].id;
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db.knex.select('*').from(TABLE).where({ id });
                if (result == null || result.length == 0 || result[0] == null) {
                    return null;
                }
                return encryptionManager.decryptEnvironment(result[0]);
            }
            catch (e) {
                errorManager.report(e, {
                    environmentId: id,
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.DATABASE,
                    metadata: {
                        id
                    }
                });
                return null;
            }
        });
    }
    getRawById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db.knex.select('*').from(TABLE).where({ id });
                if (result == null || result.length == 0 || result[0] == null) {
                    return null;
                }
                return result[0];
            }
            catch (e) {
                errorManager.report(e, {
                    environmentId: id,
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.DATABASE,
                    metadata: {
                        id
                    }
                });
                return null;
            }
        });
    }
    getByEnvironmentName(accountId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(TABLE).where({ account_id: accountId, name });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return encryptionManager.decryptEnvironment(result[0]);
        });
    }
    createEnvironment(accountId, environment) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.from(TABLE).insert({ account_id: accountId, name: environment }).returning('id');
            if (Array.isArray(result) && result.length === 1 && result[0] && 'id' in result[0]) {
                const environmentId = result[0]['id'];
                const environment = yield this.getById(environmentId);
                if (!environment) {
                    return null;
                }
                const encryptedEnvironment = yield encryptionManager.encryptEnvironment(Object.assign(Object.assign({}, environment), { secret_key_hashed: yield hashSecretKey(environment.secret_key) }));
                yield db.knex.from(TABLE).where({ id: environmentId }).update(encryptedEnvironment);
                const env = encryptionManager.decryptEnvironment(encryptedEnvironment);
                return env;
            }
            return null;
        });
    }
    createDefaultEnvironments(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const environment of defaultEnvironments) {
                yield this.createEnvironment(accountId, environment);
            }
        });
    }
    getEnvironmentName(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('name').from(TABLE).where({ id });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].name;
        });
    }
    /**
     * Get Environment Id For Account Assuming Prod
     * @desc legacy function to get the environment id for an account assuming prod
     * while the transition is being made from account_id to environment_id
     */
    getEnvironmentIdForAccountAssumingProd(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('id').from(TABLE).where({ account_id: accountId, name: 'prod' });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].id;
        });
    }
    editCallbackUrl(callbackUrl, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(TABLE).where({ id }).update({ callback_url: callbackUrl }, ['id']);
        });
    }
    editHmacEnabled(hmacEnabled, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(TABLE).where({ id }).update({ hmac_enabled: hmacEnabled }, ['id']);
        });
    }
    editSlackNotifications(slack_notifications, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(TABLE).where({ id }).update({ slack_notifications }, ['id']);
        });
    }
    getSlackNotificationsEnabled(environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('slack_notifications').from(TABLE).where({ id: environmentId });
            if (result == null || result.length == 0 || result[0] == null) {
                return null;
            }
            return result[0].slack_notifications;
        });
    }
    editHmacKey(hmacKey, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db.knex.from(TABLE).where({ id }).update({ hmac_key: hmacKey }, ['id']);
        });
    }
    getEnvironmentVariables(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(`_nango_environment_variables`).where({ environment_id });
            if (result === null || result.length === 0) {
                return [];
            }
            return encryptionManager.decryptEnvironmentVariables(result);
        });
    }
    editEnvironmentVariable(environment_id, values) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex.from(`_nango_environment_variables`).where({ environment_id }).del();
            if (values.length === 0) {
                return null;
            }
            const mappedValues = values.map((value) => {
                return Object.assign(Object.assign({}, value), { environment_id });
            });
            const encryptedValues = encryptionManager.encryptEnvironmentVariables(mappedValues);
            const results = yield db.knex.from(`_nango_environment_variables`).where({ environment_id }).insert(encryptedValues);
            if (results === null || results.length === 0) {
                return null;
            }
            return results;
        });
    }
    rotateKey(id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === 'secret') {
                return this.rotateSecretKey(id);
            }
            if (type === 'public') {
                return this.rotatePublicKey(id);
            }
            return null;
        });
    }
    revertKey(id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === 'secret') {
                return this.revertSecretKey(id);
            }
            if (type === 'public') {
                return this.revertPublicKey(id);
            }
            return null;
        });
    }
    activateKey(id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === 'secret') {
                return this.activateSecretKey(id);
            }
            if (type === 'public') {
                return this.activatePublicKey(id);
            }
            return false;
        });
    }
    rotateSecretKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = yield this.getById(id);
            if (!environment) {
                return null;
            }
            const pending_secret_key = uuid.v4();
            yield db.knex.from(TABLE).where({ id }).update({ pending_secret_key });
            environment.pending_secret_key = pending_secret_key;
            const encryptedEnvironment = yield encryptionManager.encryptEnvironment(environment);
            yield db.knex.from(TABLE).where({ id }).update(encryptedEnvironment);
            return pending_secret_key;
        });
    }
    rotatePublicKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const pending_public_key = uuid.v4();
            yield db.knex.from(TABLE).where({ id }).update({ pending_public_key });
            return pending_public_key;
        });
    }
    revertSecretKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = yield this.getById(id);
            if (!environment) {
                return null;
            }
            yield db.knex.from(TABLE).where({ id }).update({
                pending_secret_key: null,
                pending_secret_key_iv: null,
                pending_secret_key_tag: null
            });
            return environment.secret_key;
        });
    }
    revertPublicKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = yield this.getById(id);
            if (!environment) {
                return null;
            }
            yield db.knex.from(TABLE).where({ id }).update({ pending_public_key: null });
            return environment.public_key;
        });
    }
    activateSecretKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = yield this.getRawById(id);
            if (!environment) {
                return false;
            }
            const decrypted = encryptionManager.decryptEnvironment(environment);
            yield db.knex
                .from(TABLE)
                .where({ id })
                .update({
                secret_key: environment.pending_secret_key,
                secret_key_iv: environment.pending_secret_key_iv,
                secret_key_tag: environment.pending_secret_key_tag,
                secret_key_hashed: yield hashSecretKey(decrypted.pending_secret_key),
                pending_secret_key: null,
                pending_secret_key_iv: null,
                pending_secret_key_tag: null
            });
            const updatedEnvironment = yield this.getById(id);
            if (!updatedEnvironment) {
                return false;
            }
            return true;
        });
    }
    activatePublicKey(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const environment = yield this.getById(id);
            if (!environment) {
                return false;
            }
            yield db.knex
                .from(TABLE)
                .where({ id })
                .update({
                public_key: environment.pending_public_key,
                pending_public_key: null
            });
            return true;
        });
    }
}
export function hashSecretKey(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!encryptionManager.getKey()) {
            return key;
        }
        return (yield pbkdf2(key, encryptionManager.getKey(), 310000, 32, 'sha256')).toString('base64');
    });
}
export default new EnvironmentService();
//# sourceMappingURL=environment.service.js.map