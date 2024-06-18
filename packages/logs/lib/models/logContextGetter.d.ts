import type { SetRequired } from 'type-fest';
import type { MessageRow, OperationRowInsert } from '@nangohq/types';

import type { FormatMessageData } from './helpers.js';
import { LogContext, LogContextStateless } from '../client.js';
interface Options {
    dryRun?: boolean;
    logToConsole?: boolean;
}
export interface OperationContextData extends FormatMessageData {
    start?: boolean;
}
export declare type LogContextGetter = typeof logContextGetter;
export declare const logContextGetter: {
    /**
     * Create an operation and return a Context
     */
    create(data: OperationRowInsert, { start, ...rest }: SetRequired<OperationContextData, 'account' | 'environment'>, options?: Options): Promise<LogContext>;
    /**
     * Return a Context without creating an operation
     */
    get(
        {
            id
        }: {
            id: MessageRow['id'];
        },
        options?: Options
    ): Promise<LogContext>;
    getStateLess(
        {
            id
        }: {
            id: MessageRow['id'];
        },
        options?: Options
    ): LogContextStateless;
};
export {};
