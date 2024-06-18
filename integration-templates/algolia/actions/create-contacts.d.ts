import type { NangoAction } from '@nangohq/shared/lib/sdk/sync';
export declare type AlgoliaContact = {
    createdAt: string;
    taskID: string;
    objectID: string;
};
export declare type AlgoliaCreateContactInput = {
    name: string;
    company?: string;
    email?: string;
};
export default function runAction(nango: NangoAction, input: AlgoliaCreateContactInput): Promise<AlgoliaContact>;
