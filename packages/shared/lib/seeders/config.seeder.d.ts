import type { Environment } from '../models/Environment.js';
export declare const createConfigSeeds: (env: Environment) => Promise<void>;
export declare const createConfigSeed: (env: Environment, unique_key: string, provider: string) => Promise<void>;
