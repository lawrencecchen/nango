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
import { getLogger, stringifyError } from '@nangohq/utils';
import { OrchestratorClient, OrchestratorProcessor } from '@nangohq/nango-orchestrator';
import tracer from 'dd-trace';
import { handler } from './handler.js';
const logger = getLogger('jobs.processor.worker');
export class ProcessorWorker {
    constructor({ orchestratorUrl, groupKey, maxConcurrency }) {
        if (isMainThread) {
            const url = new URL('../../dist/processor/processor.worker.boot.js', import.meta.url);
            if (!fs.existsSync(url)) {
                throw new Error(`Processor worker boot script not found at ${url}`);
            }
            this.worker = new Worker(url, { workerData: { orchestratorUrl, groupKey, maxConcurrency } });
            this.worker.on('error', (err) => {
                logger.error(`ProcessorWorker exited with error: ${stringifyError(err)}`);
            });
            this.worker.on('exit', (code) => {
                if (code !== 0) {
                    logger.error(`ProcessorWorker exited with exit code: ${code}`);
                }
            });
        }
        else {
            throw new Error('ProcessorWorker should be instantiated in the main thread');
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
}
export class ProcessorChild {
    constructor(parent, workerData) {
        if (isMainThread) {
            throw new Error('Processor should not be instantiated in the main thread');
        }
        if (!workerData.orchestratorUrl || !workerData.groupKey || workerData.maxConcurrency <= 0) {
            throw new Error(`Missing required options for processor worker. Expecting orchestratorUrl, groupKey, maxConcurrency > 0, got: ${JSON.stringify(workerData)}`);
        }
        this.opts = workerData;
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
        const client = new OrchestratorClient({ baseUrl: this.opts.orchestratorUrl });
        this.processor = new OrchestratorProcessor({
            handler,
            opts: {
                orchestratorClient: client,
                groupKey: this.opts.groupKey,
                maxConcurrency: this.opts.maxConcurrency
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`Starting Processor: ${JSON.stringify(this.opts)}`);
            this.processor.start({ tracer });
        });
    }
    stop() {
        logger.info(`Stopping Processor: ${JSON.stringify(this.opts)}`);
        this.processor.stop();
    }
}
//# sourceMappingURL=processor.worker.js.map