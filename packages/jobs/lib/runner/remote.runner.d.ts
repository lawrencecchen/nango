import type { Runner } from './runner.js';
import { RunnerType } from './runner.js';
export declare class RemoteRunner implements Runner {
    readonly id: string;
    readonly url: string;
    client: any;
    runnerType: RunnerType;
    constructor(id: string, url: string);
    suspend(): void;
    toJSON(): {
        runnerType: RunnerType;
        id: string;
        url: string;
    };
    static fromJSON(obj: any): RemoteRunner;
    static getOrStart(runnerId: string): Promise<RemoteRunner>;
}
