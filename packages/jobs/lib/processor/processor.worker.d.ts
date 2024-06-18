/// <reference types="node" resolution-mode="require"/>
import type { MessagePort } from 'node:worker_threads';
export declare class ProcessorWorker {
    private worker;
    constructor({ orchestratorUrl, groupKey, maxConcurrency }: { orchestratorUrl: string; groupKey: string; maxConcurrency: number });
    start(): void;
    stop(): void;
}
export declare class ProcessorChild {
    private parent;
    private processor;
    private opts;
    constructor(
        parent: MessagePort,
        workerData: {
            orchestratorUrl: string;
            groupKey: string;
            maxConcurrency: number;
        }
    );
    start(): Promise<void>;
    stop(): void;
}
