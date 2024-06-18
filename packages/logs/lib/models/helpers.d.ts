import type { MessageRow } from '@nangohq/types';
import { z } from 'zod';
import type { estypes } from '@elastic/elasticsearch';
export declare const operationIdRegex: z.ZodString;
export interface FormatMessageData {
    account?: {
        id: number;
        name: string;
    };
    user?:
        | {
              id: number;
          }
        | undefined;
    environment?:
        | {
              id: number;
              name: string;
          }
        | undefined;
    connection?:
        | {
              id: number;
              name: string;
          }
        | undefined;
    integration?:
        | {
              id: number;
              name: string;
              provider: string;
          }
        | undefined;
    syncConfig?:
        | {
              id: number;
              name: string;
          }
        | undefined;
    meta?: MessageRow['meta'];
}
export declare function getFormattedMessage(
    data: Partial<MessageRow>,
    { account, user, environment, integration, connection, syncConfig, meta }?: FormatMessageData
): MessageRow;
export declare const oldLevelToNewLevel: {
    readonly debug: 'debug';
    readonly info: 'info';
    readonly warn: 'warn';
    readonly error: 'error';
    readonly verbose: 'debug';
    readonly silly: 'debug';
    readonly http: 'info';
};
export declare function getFullIndexName(prefix: string, createdAt: string): string;
export declare function createCursor({ sort }: estypes.SearchHit): string;
export declare function parseCursor(str: string): any[];
