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
import * as tasks from '@nangohq/models/tasks.js';
import { setTimeout } from 'node:timers/promises';
import { logger } from '../../utils/logger.js';
export class MonitorWorker {
    constructor({ databaseUrl, databaseSchema }) {
        if (isMainThread) {
            const url = new URL('../../../dist/workers/monitor/monitor.worker.boot.js', import.meta.url);
            if (!fs.existsSync(url)) {
                throw new Error(`Monitor script not found at ${url}`);
            }
            this.worker = new Worker(url, { workerData: { url: databaseUrl, schema: databaseSchema } });
            // Throw error if monitor exits with error
            this.worker.on('error', (err) => {
                throw new Error(`Monitor exited with error: ${stringifyError(err)}`);
            });
            // Throw error if monitor exits with non-zero exit code
            this.worker.on('exit', (code) => {
                if (code !== 0) {
                    throw new Error(`Monitor exited with exit code: ${code}`);
                }
            });
        }
        else {
            throw new Error('MonitorWorker should be instantiated in the main thread');
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
export class MonitorChild {
    constructor(parent, db) {
        this.cancelled = false;
        this.tickIntervalMs = 100;
        if (isMainThread) {
            throw new Error('Monitor should not be instantiated in the main thread');
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
            logger.info('Starting monitor...');
            // eslint-disable-next-line no-constant-condition
            while (!this.cancelled) {
                yield this.expires();
                yield setTimeout(this.tickIntervalMs);
            }
        });
    }
    stop() {
        logger.info('Stopping monitor...');
        this.cancelled = true;
    }
    expires() {
        return __awaiter(this, void 0, void 0, function* () {
            const expired = yield tasks.expiresIfTimeout(this.db);
            if (expired.isErr()) {
                logger.error(`Error expiring tasks: ${stringifyError(expired.error)}`);
            }
            else {
                if (expired.value.length > 0) {
                    const taskIds = expired.value.map((t) => t.id);
                    if (taskIds.length > 0 && !this.cancelled) {
                        this.parent.postMessage({ ids: taskIds }); // Notifying parent that tasks have expired
                    }
                    logger.info(`Expired tasks: ${JSON.stringify(expired.value.map((t) => t.id))} `);
                }
            }
        });
    }
}
//# sourceMappingURL=monitor.worker.js.map