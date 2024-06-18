import type { Account, Environment, User } from '../models/index.js';
export declare function seedAccountEnvAndUser(): Promise<{
    account: Account;
    env: Environment;
    user: User;
}>;
