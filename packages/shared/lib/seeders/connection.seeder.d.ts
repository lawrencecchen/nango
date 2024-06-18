import type { NangoConnection } from '../models/Connection.js';
import type { Environment } from '../models/Environment.js';
export declare const createConnectionSeeds: (env: Environment) => Promise<number[]>;
export declare const createConnectionSeed: (env: Environment, provider: string) => Promise<NangoConnection>;
export declare const deleteAllConnectionSeeds: () => Promise<void>;
