import type { Sync } from '../models/Sync.js';
export declare const createSyncSeeds: (connectionId?: number) => Promise<Sync>;
export declare const deleteAllSyncSeeds: () => Promise<void>;
