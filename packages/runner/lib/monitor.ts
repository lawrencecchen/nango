import os from 'os';
import fs from 'fs';
import type { NangoProps } from '@nangohq/shared';
import * as superjson from 'superjson';
import { fetch } from 'undici';
import { getLogger, stringifyError } from '@nangohq/utils';

const MEMORY_WARNING_PERCENTAGE_THRESHOLD = 75;
const logger = getLogger('Runner');

export class RunnerMonitor {
    private runnerId: string;
    private tracked: Map<number, NangoProps> = new Map<number, NangoProps>();
    private jobsServiceUrl = '';
    private persistServiceUrl = '';
    private idleMaxDurationMs = parseInt(process.env['IDLE_MAX_DURATION_MS'] || '') || 0;
    private lastIdleTrackingDate = Date.now();
    private lastMemoryReportDate: Date | null = null;
    private idleInterval: NodeJS.Timeout | null = null;
    private memoryInterval: NodeJS.Timeout | null = null;

    constructor({ runnerId, jobsServiceUrl, persistServiceUrl }: { runnerId: string; jobsServiceUrl: string; persistServiceUrl: string }) {
        this.runnerId = runnerId;
        this.jobsServiceUrl = jobsServiceUrl;
        this.persistServiceUrl = persistServiceUrl;
        if (this.jobsServiceUrl.length > 0) {
            this.memoryInterval = this.checkMemoryUsage();
            this.idleInterval = this.checkIdle();
        }
        process.on('SIGTERM', this.onExit.bind(this));
    }

    private onExit(): void {
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
        }
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
    }

    track(nangoProps: NangoProps): void {
        if (nangoProps.syncJobId) {
            this.lastIdleTrackingDate = Date.now();
            this.tracked.set(nangoProps.syncJobId, nangoProps);
        }
    }

    untrack(nangoProps: NangoProps): void {
        if (nangoProps.syncJobId) {
            this.tracked.delete(nangoProps.syncJobId);
        }
    }

    private checkMemoryUsage(): NodeJS.Timeout {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return setInterval(async () => {
            const rss = process.memoryUsage().rss;
            const total = getTotalMemoryInBytes();
            const memoryUsagePercentage = (rss / total) * 100;
            if (memoryUsagePercentage > MEMORY_WARNING_PERCENTAGE_THRESHOLD) {
                await this.reportHighMemoryUsage(memoryUsagePercentage);
            }
        }, 1000);
    }

    private async reportHighMemoryUsage(memoryUsagePercentage: number): Promise<void> {
        // only report if it has been more than 30 seconds since the last report
        if (this.lastMemoryReportDate) {
            const now = new Date();
            const diffInSecs = (now.getTime() - this.lastMemoryReportDate.getTime()) / 1000;
            if (diffInSecs < 30) {
                return;
            }
        }
        this.lastMemoryReportDate = new Date();
        for (const { environmentId, activityLogId } of this.tracked.values()) {
            if (!environmentId || !activityLogId) {
                continue;
            }
            await httpSend({
                method: 'post',
                url: `${this.persistServiceUrl}/environment/${environmentId}/log`,
                data: JSON.stringify({
                    activityLogId: activityLogId,
                    level: 'warn',
                    msg: `Memory usage of nango scripts is high: ${memoryUsagePercentage.toFixed(2)}% of the total available memory.`
                })
            });
        }
    }

    private checkIdle(): NodeJS.Timeout {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return setInterval(async () => {
            if (this.idleMaxDurationMs > 0 && this.tracked.size == 0) {
                const idleTimeMs = Date.now() - this.lastIdleTrackingDate;
                if (idleTimeMs > this.idleMaxDurationMs) {
                    logger.info(`Runner '${this.runnerId}' idle for more than ${this.idleMaxDurationMs}ms`);
                    await httpSend({
                        method: 'post',
                        url: `${this.jobsServiceUrl}/idle`,
                        data: superjson.stringify({
                            runnerId: this.runnerId,
                            idleTimeMs
                        })
                    });
                    this.lastIdleTrackingDate = Date.now();
                }
            }
        }, 10000);
    }
}

function getRenderTotalMemoryInBytes(): number {
    const memoryMaxFile = '/sys/fs/cgroup/memory.max';
    try {
        const output = fs.readFileSync(memoryMaxFile, 'utf-8');
        const memoryLimitInBytes = parseInt(output.trim(), 10);
        return memoryLimitInBytes;
    } catch {
        return 0;
    }
}

function getTotalMemoryInBytes(): number {
    // when running inside a container, os.totalmem() returns the total memory of the system, not the memory limit of the container
    // see: https://github.com/nodejs/node/issues/51095
    // process.constrainedMemory() is supposed to return the memory limit of the container but it doesn't work on Render
    // so we need to use a workaround to get the memory limit of the container on Render
    return process.constrainedMemory() || getRenderTotalMemoryInBytes() || os.totalmem();
}

async function httpSend({ method, url, data }: { method: string; url: string; data: string }): Promise<void> {
    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: data
        });
        if (res.status > 299) {
            logger.error(`Error (status=${res.status}) sending '${data}' to '${url}': ${JSON.stringify(await res.json())}`);
        }
    } catch (err) {
        logger.error(`Error sending '${data}' to '${url}': ${stringifyError(err)}`);
    }
}
