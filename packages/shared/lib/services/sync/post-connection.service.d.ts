import type { Account } from '@nangohq/models/Admin.js';
import type { Environment } from '@nangohq/models/Environment.js';
import type { PostConnectionScriptByProvider, PostConnectionScript } from '@nangohq/types';
export declare const postConnectionScriptService: {
    update({
        environment,
        account,
        postConnectionScriptsByProvider
    }: {
        environment: Environment;
        account: Account;
        postConnectionScriptsByProvider: PostConnectionScriptByProvider[];
    }): Promise<void>;
    getByConfig: (configId: number) => Promise<PostConnectionScript[]>;
};
