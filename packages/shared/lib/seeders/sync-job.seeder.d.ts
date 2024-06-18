import type { Job } from '../models/Sync.js';
export declare const createSyncJobSeeds: (syncId: string) => Promise<Job>;
export declare const deleteAllSyncJobSeeds: () => Promise<void>;
