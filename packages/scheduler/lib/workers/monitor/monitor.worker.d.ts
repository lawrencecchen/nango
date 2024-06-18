/// <reference types="node" resolution-mode="require"/>
import type { MessagePort } from 'node:worker_threads';
import type knex from 'knex';
interface ExpiredTasksMessage {
    ids: string[];
}
export declare class MonitorWorker {
    private worker;
    constructor({ databaseUrl, databaseSchema }: { databaseUrl: string; databaseSchema: string });
    start(): void;
    stop(): void;
    on(callback: (message: ExpiredTasksMessage) => void): void;
}
export declare class MonitorChild {
    private db;
    private parent;
    private cancelled;
    private tickIntervalMs;
    constructor(parent: MessagePort, db: knex.Knex);
    start(): Promise<void>;
    stop(): void;
    expires(): Promise<void>;
}
export {};
