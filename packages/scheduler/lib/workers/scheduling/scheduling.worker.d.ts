/// <reference types="node" resolution-mode="require"/>
import type { MessagePort } from 'node:worker_threads';
import type knex from 'knex';
interface CreatedTasksMessage {
    ids: string[];
}
export declare class SchedulingWorker {
    private worker;
    constructor({ databaseUrl, databaseSchema }: { databaseUrl: string; databaseSchema: string });
    start(): void;
    stop(): void;
    on(callback: (message: CreatedTasksMessage) => void): void;
}
export declare class SchedulingChild {
    private db;
    private parent;
    private cancelled;
    private tickIntervalMs;
    constructor(parent: MessagePort, db: knex.Knex);
    start(): Promise<void>;
    stop(): void;
    schedule(): Promise<void>;
}
export {};
