var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import os from 'os';
import fs from 'fs';
import * as superjson from 'superjson';
import { fetch } from 'undici';
import { getLogger, stringifyError } from '@nangohq/utils';
const MEMORY_WARNING_PERCENTAGE_THRESHOLD = 75;
const logger = getLogger('Runner');
export class RunnerMonitor {
    constructor({ runnerId, jobsServiceUrl, persistServiceUrl }) {
        this.tracked = new Map();
        this.jobsServiceUrl = '';
        this.persistServiceUrl = '';
        this.idleMaxDurationMs = parseInt(process.env['IDLE_MAX_DURATION_MS'] || '') || 0;
        this.lastIdleTrackingDate = Date.now();
        this.lastMemoryReportDate = null;
        this.idleInterval = null;
        this.memoryInterval = null;
        this.runnerId = runnerId;
        this.jobsServiceUrl = jobsServiceUrl;
        this.persistServiceUrl = persistServiceUrl;
        if (this.jobsServiceUrl.length > 0) {
            this.memoryInterval = this.checkMemoryUsage();
            this.idleInterval = this.checkIdle();
        }
        process.on('SIGTERM', this.onExit.bind(this));
    }
    onExit() {
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
        }
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
    }
    track(nangoProps) {
        if (nangoProps.syncJobId) {
            this.lastIdleTrackingDate = Date.now();
            this.tracked.set(nangoProps.syncJobId, nangoProps);
        }
    }
    untrack(nangoProps) {
        if (nangoProps.syncJobId) {
            this.tracked.delete(nangoProps.syncJobId);
        }
    }
    checkMemoryUsage() {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const rss = process.memoryUsage().rss;
            const total = getTotalMemoryInBytes();
            const memoryUsagePercentage = (rss / total) * 100;
            if (memoryUsagePercentage > MEMORY_WARNING_PERCENTAGE_THRESHOLD) {
                yield this.reportHighMemoryUsage(memoryUsagePercentage);
            }
        }), 1000);
    }
    reportHighMemoryUsage(memoryUsagePercentage) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield httpSend({
                    method: 'post',
                    url: `${this.persistServiceUrl}/environment/${environmentId}/log`,
                    data: JSON.stringify({
                        activityLogId: activityLogId,
                        level: 'warn',
                        msg: `Memory usage of nango scripts is high: ${memoryUsagePercentage.toFixed(2)}% of the total available memory.`
                    })
                });
            }
        });
    }
    checkIdle() {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        return setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (this.idleMaxDurationMs > 0 && this.tracked.size == 0) {
                const idleTimeMs = Date.now() - this.lastIdleTrackingDate;
                if (idleTimeMs > this.idleMaxDurationMs) {
                    logger.info(`Runner '${this.runnerId}' idle for more than ${this.idleMaxDurationMs}ms`);
                    yield httpSend({
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
        }), 10000);
    }
}
function getRenderTotalMemoryInBytes() {
    const memoryMaxFile = '/sys/fs/cgroup/memory.max';
    try {
        const output = fs.readFileSync(memoryMaxFile, 'utf-8');
        const memoryLimitInBytes = parseInt(output.trim(), 10);
        return memoryLimitInBytes;
    }
    catch (_a) {
        return 0;
    }
}
function getTotalMemoryInBytes() {
    // when running inside a container, os.totalmem() returns the total memory of the system, not the memory limit of the container
    // see: https://github.com/nodejs/node/issues/51095
    // process.constrainedMemory() is supposed to return the memory limit of the container but it doesn't work on Render
    // so we need to use a workaround to get the memory limit of the container on Render
    return process.constrainedMemory() || getRenderTotalMemoryInBytes() || os.totalmem();
}
function httpSend({ method, url, data }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(url, {
                method: method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: data
            });
            if (res.status > 299) {
                logger.error(`Error (status=${res.status}) sending '${data}' to '${url}': ${JSON.stringify(yield res.json())}`);
            }
        }
        catch (err) {
            logger.error(`Error sending '${data}' to '${url}': ${stringifyError(err)}`);
        }
    });
}
//# sourceMappingURL=monitor.js.map