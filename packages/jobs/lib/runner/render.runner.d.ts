import type { ProxyAppRouter } from '@nangohq/nango-runner';

import { RunnerType } from './runner.js';
import type { Runner } from './runner.js';
export declare class RenderRunner implements Runner {
    readonly id: string;
    readonly url: string;
    readonly serviceId: string;
    client: ProxyAppRouter;
    runnerType: RunnerType;
    constructor(id: string, url: string, serviceId: string);
    toJSON(): {
        runnerType: RunnerType;
        id: string;
        url: string;
        serviceId: string;
    };
    static fromJSON(obj: { id: string; url: string; serviceId: string }): RenderRunner;
    suspend(): Promise<void>;
    static get(runnerId: string): Promise<RenderRunner | undefined>;
    static getOrStart(runnerId: string): Promise<RenderRunner>;
}
