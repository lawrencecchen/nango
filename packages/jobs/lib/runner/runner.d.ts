import type { ProxyAppRouter } from '@nangohq/nango-runner';
export declare enum RunnerType {
    Local = 'local',
    Render = 'render',
    Remote = 'remote'
}
export interface Runner {
    runnerType: RunnerType;
    id: string;
    client: ProxyAppRouter;
    url: string;
    suspend(): Promise<void> | void;
    toJSON(): Record<string, any>;
}
export declare function getRunnerId(suffix: string): string;
export declare function getOrStartRunner(runnerId: string): Promise<Runner>;
export declare function suspendRunner(runnerId: string): Promise<void>;
