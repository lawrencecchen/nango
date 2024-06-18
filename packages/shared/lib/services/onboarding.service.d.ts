import type { DBOnboarding } from '@nangohq/types';

import type { Config } from '../models/index.js';
export declare const DEFAULT_GITHUB_CLIENT_ID: string;
export declare const DEFAULT_GITHUB_CLIENT_SECRET: string;
export declare const DEMO_GITHUB_CONFIG_KEY = 'github-demo';
export declare const DEMO_SYNC_NAME = 'issues-demo';
export declare const DEMO_ACTION_NAME = 'create-demo-issue';
export declare const DEMO_MODEL = 'GithubIssueDemo';
export declare const getOnboardingId: (user_id: number) => Promise<number | null>;
export declare const initOnboarding: (user_id: number) => Promise<number | null>;
export declare const updateOnboardingProgress: (id: number, progress: number) => Promise<void>;
export declare const getOnboardingProgress: (user_id: number) => Promise<Required<Pick<DBOnboarding, 'id' | 'progress' | 'complete'>> | undefined>;
/**
 * Create Default Provider Config
 * @desc create a default Github config only for the dev environment
 */
export declare function createOnboardingProvider({ envId }: { envId: number }): Promise<void>;
export declare function getOnboardingProvider({ envId }: { envId: number }): Promise<Config | null>;
