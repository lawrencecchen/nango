import type { Account } from '../models/Admin.js';
declare class AccountService {
    getAccountById(id: number): Promise<Account | null>;
    editAccount(name: string, id: number): Promise<void>;
    getAccountByUUID(uuid: string): Promise<Account | null>;
    getAccountAndEnvironmentIdByUUID(
        targetAccountUUID: string,
        targetEnvironment: string
    ): Promise<{
        accountId: number;
        environmentId: number;
    } | null>;
    getUUIDFromAccountId(accountId: number): Promise<string | null>;
    getOrCreateAccount(name: string): Promise<Account>;
    /**
     * Create Account
     * @desc create a new account and assign to the default environmenets
     */
    createAccount(name: string): Promise<Account | null>;
    editCustomer(is_capped: boolean, accountId: number): Promise<void>;
}
declare const _default: AccountService;
export default _default;
