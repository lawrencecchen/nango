var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Worker, NativeConnection } from '@temporalio/worker';
import fs from 'fs-extra';
import * as dotenv from 'dotenv';
import { createRequire } from 'module';
import { SYNC_TASK_QUEUE, WEBHOOK_TASK_QUEUE } from '@nangohq/shared';
import { isProd, isEnterprise, getLogger } from '@nangohq/utils';
import * as activities from './activities.js';
import { envs } from './env.js';
const logger = getLogger('Jobs.Temporal');
const TEMPORAL_WORKER_MAX_CONCURRENCY = envs.TEMPORAL_WORKER_MAX_CONCURRENCY;
export class Temporal {
    constructor(namespace) {
        this.namespace = namespace;
        this.workers = null;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('Starting Temporal worker');
            if (process.env['SERVER_RUN_MODE'] !== 'DOCKERIZED') {
                dotenv.config({ path: '../../.env' });
            }
            let crt = null;
            let key = null;
            if (isProd || isEnterprise) {
                crt = yield fs.readFile(`/etc/secrets/${this.namespace}.crt`);
                key = yield fs.readFile(`/etc/secrets/${this.namespace}.key`);
            }
            const temporalAddress = process.env['TEMPORAL_ADDRESS'];
            if (!temporalAddress) {
                throw new Error('TEMPORAL_ADDRESS missing from env var');
            }
            try {
                const connection = yield NativeConnection.connect({
                    address: temporalAddress,
                    tls: !isProd && !isEnterprise
                        ? false
                        : {
                            clientCertPair: {
                                crt: crt,
                                key: key
                            }
                        }
                });
                const syncWorker = {
                    connection,
                    namespace: this.namespace,
                    workflowsPath: createRequire(import.meta.url).resolve('./workflows'),
                    activities,
                    maxConcurrentWorkflowTaskExecutions: TEMPORAL_WORKER_MAX_CONCURRENCY,
                    taskQueue: SYNC_TASK_QUEUE
                };
                const webhookWorker = {
                    connection,
                    namespace: this.namespace,
                    workflowsPath: createRequire(import.meta.url).resolve('./workflows'),
                    activities,
                    maxConcurrentWorkflowTaskExecutions: 50,
                    maxActivitiesPerSecond: 50,
                    taskQueue: WEBHOOK_TASK_QUEUE
                };
                this.workers = yield Promise.all([Worker.create(syncWorker), Worker.create(webhookWorker)]);
                yield Promise.all(this.workers.map((worker) => worker.run()));
            }
            catch (e) {
                logger.error(e);
            }
        });
    }
    stop() {
        if (this.workers) {
            this.workers.forEach((worker) => worker.shutdown());
        }
    }
}
//# sourceMappingURL=temporal.js.map