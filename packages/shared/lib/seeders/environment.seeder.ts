import type { Environment } from '../models/Environment.js';
import environmentService from '../services/environment.service.js';

export async function createEnvironmentSeed(accountId = 0, envName = 'test'): Promise<Environment> {
    const env = await environmentService.createEnvironment(accountId, envName);
    if (!env) {
        throw new Error('Failed to create environment');
    }
    return env;
}
