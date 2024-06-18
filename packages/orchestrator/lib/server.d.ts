import type { Express } from 'express';
import type EventEmitter from 'node:events';
export declare const getServer: (scheduler: Scheduler, eventEmmiter: EventEmitter) => Express;
