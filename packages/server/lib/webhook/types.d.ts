import type { LogContextGetter } from '@nangohq/logs';
import type { Config as ProviderConfig } from '@nangohq/shared';

import type { InternalNango } from './internal-nango.js';
export declare type WebhookHandler = (
    internalNango: InternalNango,
    integration: ProviderConfig,
    headers: Record<string, any>,
    body: any,
    rawBody: string,
    logContextGetter: LogContextGetter
) => Promise<WebhookResponse>;
export declare type WebhookResponse =
    | {
          acknowledgementResponse?: unknown;
          parsedBody?: unknown;
          connectionIds?: string[] | undefined;
      }
    | undefined;
export declare type WebhookHandlersMap = Record<string, WebhookHandler>;
