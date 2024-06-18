import type { MessageRow, MessageRowInsert, MessageMeta, OperationRow } from '@nangohq/types';
interface Options {
    dryRun?: boolean;
    logToConsole?: boolean;
}
/**
 * Context without operation (stateless)
 */
export declare class LogContextStateless {
    id: string;
    dryRun: boolean;
    logToConsole: boolean;
    constructor(
        data: {
            parentId: string;
        },
        options?: Options
    );
    log(data: MessageRowInsert): Promise<boolean>;
    debug(message: string, meta?: MessageMeta | null): Promise<boolean>;
    info(message: string, meta?: MessageMeta | null): Promise<boolean>;
    warn(message: string, meta?: MessageMeta | null): Promise<boolean>;
    error(
        message: string,
        meta?:
            | (MessageMeta & {
                  error?: unknown;
                  err?: never;
                  e?: never;
              })
            | null
    ): Promise<boolean>;
    /**
     * @deprecated Only there for retro compat
     */
    trace(message: string, meta?: MessageMeta | null): Promise<boolean>;
    http(message: string, data: Pick<MessageRow, 'request' | 'response' | 'meta'>): Promise<boolean>;
}
/**
 * Context with operation (can modify state)
 */
export declare class LogContext extends LogContextStateless {
    operation: OperationRow;
    constructor(
        data: {
            parentId: string;
            operation: OperationRow;
        },
        options?: Options
    );
    /**
     * Add more data to the parentId
     */
    enrichOperation(data: Partial<MessageRow>): Promise<void>;
    /**
     * ------ State
     */
    start(): Promise<void>;
    failed(): Promise<void>;
    success(): Promise<void>;
    cancel(): Promise<void>;
    timeout(): Promise<void>;
    private logOrExec;
}
export {};
