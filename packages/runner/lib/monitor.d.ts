import type { NangoProps } from '@nangohq/shared';
export declare class RunnerMonitor {
    private runnerId;
    private tracked;
    private jobsServiceUrl;
    private persistServiceUrl;
    private idleMaxDurationMs;
    private lastIdleTrackingDate;
    private lastMemoryReportDate;
    private idleInterval;
    private memoryInterval;
    constructor({ runnerId, jobsServiceUrl, persistServiceUrl }: { runnerId: string; jobsServiceUrl: string; persistServiceUrl: string });
    private onExit;
    track(nangoProps: NangoProps): void;
    untrack(nangoProps: NangoProps): void;
    private checkMemoryUsage;
    private reportHighMemoryUsage;
    private checkIdle;
}
