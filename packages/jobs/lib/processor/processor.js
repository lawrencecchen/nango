import { getLogger } from '@nangohq/utils';
import { ProcessorWorker } from './processor.worker.js';
const logger = getLogger('jobs.processor');
export class Processor {
    constructor(orchestratorServiceUrl) {
        this.orchestratorServiceUrl = orchestratorServiceUrl;
        this.workers = [];
        this.stopped = true;
    }
    isStopped() {
        return this.stopped;
    }
    start() {
        logger.info('Starting task processors');
        try {
            const syncWorker = new ProcessorWorker({
                orchestratorUrl: this.orchestratorServiceUrl,
                groupKey: 'sync',
                maxConcurrency: 200
            });
            syncWorker.start();
            const actionWorker = new ProcessorWorker({
                orchestratorUrl: this.orchestratorServiceUrl,
                groupKey: 'action',
                maxConcurrency: 200
            });
            actionWorker.start();
            const webhookWorker = new ProcessorWorker({
                orchestratorUrl: this.orchestratorServiceUrl,
                groupKey: 'webhook',
                maxConcurrency: 50
            });
            webhookWorker.start();
            this.workers = [syncWorker, actionWorker, webhookWorker];
            this.stopped = false;
        }
        catch (e) {
            logger.error(e);
        }
    }
    stop() {
        if (this.workers) {
            this.workers.forEach((worker) => worker.stop());
        }
        this.stopped = true;
    }
}
//# sourceMappingURL=processor.js.map