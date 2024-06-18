import type { User } from './user';
export declare function useAnalyticsTrack(): (event: string, properties?: Record<string, string | number>) => void;
export declare function useAnalyticsIdentify(): (user: User) => void;
export declare function useAnalyticsReset(): () => void;
