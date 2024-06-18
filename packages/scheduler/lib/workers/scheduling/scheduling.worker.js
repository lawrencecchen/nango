var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from 'fs';
import { Worker, isMainThread } from 'node:worker_threads';
import { stringifyError } from '@nangohq/utils';
import { setTimeout } from 'node:timers/promises';
import * as tasks from '@nangohq/models/tasks.js';
import { logger } from '../../utils/logger.js';
import { dueSchedules } from './scheduling.js';
export class SchedulingWorker {
    constructor({ databaseUrl, databaseSchema }) {
        if (isMainThread) {
            const url = new URL('../../../dist/workers/scheduling/scheduling.worker.boot.js', import.meta.url);
            if (!fs.existsSync(url)) {
                throw new Error(`Scheduling script not found at ${url}`);
            }
            this.worker = new Worker(url, { workerData: { url: databaseUrl, schema: databaseSchema } });
            // Throw error if worker exits with error
            this.worker.on('error', (err) => {
                throw new Error(`Scheduling exited with error: ${stringifyError(err)}`);
            });
            // Throw error if worker exits with non-zero exit code
            this.worker.on('exit', (code) => {
                if (code !== 0) {
                    throw new Error(`Scheduling exited with exit code: ${code}`);
                }
            });
        }
        else {
            throw new Error('SchedulingWorker should be instantiated in the main thread');
        }
    }
    start() {
        var _a;
        (_a = this.worker) === null || _a === void 0 ? void 0 : _a.postMessage('start');
    }
    stop() {
        if (this.worker) {
            this.worker.postMessage('stop');
            this.worker = null;
        }
    }
    on(callback) {
        var _a;
        (_a = this.worker) === null || _a === void 0 ? void 0 : _a.on('message', callback);
    }
}
export class SchedulingChild {
    constructor(parent, db) {
        this.cancelled = false;
        this.tickIntervalMs = 100;
        if (isMainThread) {
            throw new Error('Scheduling should not be instantiated in the main thread');
        }
        this.db = db;
        this.parent = parent;
        this.parent.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
            switch (msg) {
                case 'start':
                    yield this.start();
                    break;
                case 'stop':
                    this.stop();
                    break;
            }
        }));
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('Starting scheduling...');
            // eslint-disable-next-line no-constant-condition
            while (!this.cancelled) {
                yield this.schedule();
                yield setTimeout(this.tickIntervalMs);
            }
        });
    }
    stop() {
        logger.info('Stopping scheduling...');
        this.cancelled = true;
    }
    schedule() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const schedules = yield dueSchedules(trx);
                if (schedules.isErr()) {
                    logger.error(`Failed to get due schedules: ${schedules.error}`);
                    return;
                }
                const taskIds = [];
                for (const schedule of schedules.value) {
                    const task = yield tasks.create(trx, {
                        scheduleId: schedule.id,
                        startsAfter: new Date(),
                        name: `${schedule.name}:${new Date().toISOString()}`,
                        payload: schedule.payload,
                        groupKey: schedule.groupKey,
                        retryCount: 0,
                        retryMax: schedule.retryMax,
                        createdToStartedTimeoutSecs: schedule.createdToStartedTimeoutSecs,
                        startedToCompletedTimeoutSecs: schedule.startedToCompletedTimeoutSecs,
                        heartbeatTimeoutSecs: schedule.heartbeatTimeoutSecs
                    });
                    if (task.isErr()) {
                        logger.error(`Failed to create task for schedule: ${schedule.id}`);
                    }
                    else {
                        taskIds.push(task.value.id);
                    }
                }
                if (taskIds.length > 0) {
                    this.parent.postMessage({ ids: taskIds }); // notifying parent that tasks have been created
                }
            }));
        });
    }
}
//# sourceMappingURL=scheduling.worker.js.map