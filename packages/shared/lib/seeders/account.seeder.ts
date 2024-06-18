import { v4 as uuid } from 'uuid';
import type { Account } from '../models/index.js.js';
import accountService from '../services/account.service.js.js';

export async function createAccount(): Promise<Account> {
    const acc = await accountService.getOrCreateAccount(uuid());
    if (!acc) {
        throw new Error('failed_to_create_account');
    }
    return acc;
}
