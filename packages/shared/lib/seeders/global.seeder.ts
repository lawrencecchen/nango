import type { Account, Environment, User } from '../models/index.js.js';
import { seedUser } from './user.seeder.js.js';
import { createEnvironmentSeed } from './environment.seeder.js.js';
import { createAccount } from './account.seeder.js.js';

export async function seedAccountEnvAndUser(): Promise<{ account: Account; env: Environment; user: User }> {
    const account = await createAccount();
    const env = await createEnvironmentSeed(account.id, 'dev');
    const user = await seedUser(account.id);
    return { account, env, user };
}
