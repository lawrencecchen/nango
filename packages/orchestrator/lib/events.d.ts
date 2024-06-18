/// <reference types="node" resolution-mode="require"/>
import type { Task } from '@nangohq/scheduler';
import EventEmitter from 'node:events';
export declare class EventsHandler extends EventEmitter {
    readonly onCallbacks: {
        CREATED: (task: Task) => void;
        STARTED: (task: Task) => void;
        SUCCEEDED: (task: Task) => void;
        FAILED: (task: Task) => void;
        EXPIRED: (task: Task) => void;
        CANCELLED: (task: Task) => void;
    };
    constructor(on: {
        CREATED: (task: Task) => void;
        STARTED: (task: Task) => void;
        SUCCEEDED: (task: Task) => void;
        FAILED: (task: Task) => void;
        EXPIRED: (task: Task) => void;
        CANCELLED: (task: Task) => void;
    });
}
