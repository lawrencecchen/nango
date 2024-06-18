/// <reference types="node" resolution-mode="require"/>
import type { ChildProcess } from 'child_process';

import { RunnerType } from './runner.js';
import type { Runner } from './runner.js';
export declare class LocalRunner implements Runner {
    readonly id: string;
    readonly url: string;
    private readonly childProcess;
    client: any;
    runnerType: RunnerType;
    constructor(id: string, url: string, childProcess: ChildProcess);
    suspend(): void;
    toJSON(): {
        runnerType: RunnerType;
        id: string;
        url: string;
    };
    static fromJSON(obj: any): LocalRunner;
    static getOrStart(runnerId: string): Promise<LocalRunner>;
}
