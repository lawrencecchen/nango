import type { Result } from '@nangohq/utils';
import type { JsonValue } from 'type-fest';
import type { Tracer } from 'dd-trace';

import type { OrchestratorTask } from './types.js';
import type { OrchestratorClient } from './client.js';
export declare class OrchestratorProcessor {
    private handler;
    private groupKey;
    private orchestratorClient;
    private queue;
    private stopped;
    private abortControllers;
    private terminatedTimer;
    private checkForTerminatedInterval;
    constructor({
        handler,
        opts
    }: {
        handler: (task: OrchestratorTask) => Promise<Result<JsonValue>>;
        opts: {
            orchestratorClient: OrchestratorClient;
            groupKey: string;
            maxConcurrency: number;
            checkForTerminatedInterval?: number;
        };
    });
    start(ctx: { tracer: Tracer }): void;
    stop(): void;
    private checkForTerminatedTasks;
    private processingLoop;
    private processTask;
    private heartbeat;
}
