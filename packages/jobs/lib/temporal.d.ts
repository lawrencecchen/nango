import { Worker } from '@temporalio/worker';
export declare class Temporal {
    namespace: string;
    workers: Worker[] | null;
    constructor(namespace: string);
    start(): Promise<void>;
    stop(): void;
}
