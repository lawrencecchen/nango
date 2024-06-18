var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import { LogActionEnum } from '../models/Activity.js';
import environmentService from './environment.service.js';
import errorManager, { ErrorSourceEnum } from '../utils/error.manager.js';
class AccountService {
    getAccountById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db.knex.select('*').from(`_nango_accounts`).where({ id: id }).first();
                return result || null;
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.DATABASE,
                    accountId: id
                });
                return null;
            }
        });
    }
    editAccount(name, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db.knex.update({ name, updated_at: new Date() }).from(`_nango_accounts`).where({ id });
            }
            catch (e) {
                errorManager.report(e, {
                    source: ErrorSourceEnum.PLATFORM,
                    operation: LogActionEnum.DATABASE,
                    accountId: id
                });
            }
        });
    }
    getAccountByUUID(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.select('*').from(`_nango_accounts`).where({ uuid }).first();
            return result || null;
        });
    }
    getAccountAndEnvironmentIdByUUID(targetAccountUUID, targetEnvironment) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield db.knex.select('id').from(`_nango_accounts`).where({ uuid: targetAccountUUID });
            if (account == null || account.length == 0 || account[0] == null) {
                return null;
            }
            const accountId = account[0].id;
            const environment = yield db.knex.select('id').from(`_nango_environments`).where({
                account_id: accountId,
                name: targetEnvironment
            });
            if (environment == null || environment.length == 0 || environment[0] == null) {
                return null;
            }
            return { accountId, environmentId: environment[0].id };
        });
    }
    getUUIDFromAccountId(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield db.knex.select('uuid').from(`_nango_accounts`).where({ id: accountId });
            if (account == null || account.length == 0 || account[0] == null) {
                return null;
            }
            return account[0].uuid;
        });
    }
    getOrCreateAccount(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield db.knex.select('id').from(`_nango_accounts`).where({ name });
            if (account == null || account.length == 0 || !account[0]) {
                const newAccount = yield db.knex.insert({ name, created_at: new Date() }).into(`_nango_accounts`).returning('*');
                if (!newAccount || newAccount.length == 0 || !newAccount[0]) {
                    throw new Error('Failed to create account');
                }
                yield environmentService.createDefaultEnvironments(newAccount[0]['id']);
                return newAccount[0];
            }
            return account[0];
        });
    }
    /**
     * Create Account
     * @desc create a new account and assign to the default environmenets
     */
    createAccount(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.knex.from(`_nango_accounts`).insert({ name: name }, ['id']);
            if (Array.isArray(result) && result.length === 1 && result[0] != null && 'id' in result[0]) {
                yield environmentService.createDefaultEnvironments(result[0]['id']);
                return result[0];
            }
            return null;
        });
    }
    editCustomer(is_capped, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db.knex.update({ is_capped }).from(`_nango_accounts`).where({ id: accountId });
        });
    }
}
export default new AccountService();
//# sourceMappingURL=account.service.js.map