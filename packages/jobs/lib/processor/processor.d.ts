export declare class Processor {
    private orchestratorServiceUrl;
    private workers;
    private stopped;
    constructor(orchestratorServiceUrl: string);
    isStopped(): boolean;
    start(): void;
    stop(): void;
}
