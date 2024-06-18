var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Err, stringifyError, getLogger } from '@nangohq/utils';
import PQueue from 'p-queue';
const logger = getLogger('orchestrator.clients.processor');
export class OrchestratorProcessor {
    constructor({ handler, opts }) {
        this.terminatedTimer = null;
        this.stopped = true;
        this.handler = handler;
        this.groupKey = opts.groupKey;
        this.orchestratorClient = opts.orchestratorClient;
        this.queue = new PQueue({ concurrency: opts.maxConcurrency });
        this.abortControllers = new Map();
        this.checkForTerminatedInterval = opts.checkForTerminatedInterval || 1000;
    }
    start(ctx) {
        this.stopped = false;
        this.terminatedTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            yield this.checkForTerminatedTasks();
        }), this.checkForTerminatedInterval); // checking for cancelled/expired doesn't require to be very responsive so we can do it on an interval
        void this.processingLoop(ctx);
    }
    stop() {
        this.stopped = true;
        if (this.terminatedTimer) {
            clearInterval(this.terminatedTimer);
        }
    }
    checkForTerminatedTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.stopped || this.abortControllers.size <= 0) {
                return;
            }
            const ids = Array.from(this.abortControllers.keys());
            const search = yield this.orchestratorClient.searchTasks({ ids });
            if (search.isErr()) {
                return Err(search.error);
            }
            for (const task of search.value) {
                // if task is already in a terminal state, invoke the abort signal
                if (['FAILED', 'EXPIRED', 'CANCELLED', 'SUCCEEDED'].includes(task.state)) {
                    const abortController = this.abortControllers.get(task.id);
                    if (abortController) {
                        if (!abortController.signal.aborted) {
                            abortController.abort();
                        }
                        this.abortControllers.delete(task.id);
                    }
                }
            }
            return;
        });
    }
    processingLoop(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this.stopped) {
                // wait for the queue to have space before dequeuing more tasks
                yield this.queue.onSizeLessThan(this.queue.concurrency);
                const available = this.queue.concurrency - this.queue.size;
                const limit = available + this.queue.concurrency; // fetching more than available to keep the queue full
                const tasks = yield this.orchestratorClient.dequeue({ groupKey: this.groupKey, limit, longPolling: true });
                if (tasks.isErr()) {
                    logger.error(`failed to dequeue tasks: ${stringifyError(tasks.error)}`);
                    yield new Promise((resolve) => setTimeout(resolve, 1000)); // wait for a bit before retrying to avoid hammering the server in case of repetitive errors
                    continue;
                }
                for (const task of tasks.value) {
                    const active = ctx.tracer.scope().active();
                    const span = ctx.tracer.startSpan('processor.process', Object.assign(Object.assign({}, (active ? { childOf: active } : {})), { tags: { 'task.id': task.id } }));
                    void this.processTask(task, ctx)
                        .catch((err) => span.setTag('error', err))
                        .finally(() => span.finish());
                }
            }
            return;
        });
    }
    processTask(task, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let heartbeat;
            this.abortControllers.set(task.id, task.abortController);
            yield this.queue.add(() => __awaiter(this, void 0, void 0, function* () {
                const active = ctx.tracer.scope().active();
                const span = ctx.tracer.startSpan('processor.process.task', Object.assign(Object.assign({}, (active ? { childOf: active } : {})), { tags: { 'task.id': task.id } }));
                try {
                    if (task.abortController.signal.aborted) {
                        // task was aborted while waiting in the queue
                        logger.info(`task ${task.id} was aborted before processing started`);
                        return;
                    }
                    heartbeat = this.heartbeat(task);
                    const res = yield this.handler(task);
                    if (res.isErr()) {
                        const setFailed = yield this.orchestratorClient.failed({ taskId: task.id, error: res.error });
                        if (setFailed.isErr()) {
                            logger.error(`failed to set task ${task.id} as failed: ${stringifyError(setFailed.error)}`);
                            span.setTag('error', setFailed);
                        }
                        else {
                            span.setTag('error', res.error);
                        }
                    }
                    else {
                        const setSucceed = yield this.orchestratorClient.succeed({ taskId: task.id, output: res.value });
                        if (setSucceed.isErr()) {
                            logger.error(`failed to set task ${task.id} as succeeded: ${stringifyError(setSucceed.error)}`);
                            span.setTag('error', setSucceed);
                        }
                    }
                }
                catch (err) {
                    const error = new Error(stringifyError(err));
                    logger.error(`Failed to process task ${task.id}: ${stringifyError(error)}`);
                    const setFailed = yield this.orchestratorClient.failed({ taskId: task.id, error });
                    if (setFailed.isErr()) {
                        logger.error(`failed to set task ${task.id} as failed. Unknown error: ${stringifyError(setFailed.error)}`);
                        span.setTag('error', setFailed);
                    }
                    else {
                        span.setTag('error', error);
                    }
                }
                finally {
                    this.abortControllers.delete(task.id);
                    clearInterval(heartbeat);
                    span.finish();
                }
            }));
        });
    }
    heartbeat(task) {
        return setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const res = yield this.orchestratorClient.heartbeat({ taskId: task.id });
            if (res.isErr()) {
                logger.error(`failed to send heartbeat for task ${task.id}: ${stringifyError(res.error)}`);
            }
        }), 300000);
    }
}
//# sourceMappingURL=processor.js.map