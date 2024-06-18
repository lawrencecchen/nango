import type { Timestamps } from '../db.ts.js';
/**
 * Onboarding row in database
 */
export interface DBOnboarding extends Timestamps {
    id: number;
    user_id: number;
    progress: number;
    complete: boolean;
}
