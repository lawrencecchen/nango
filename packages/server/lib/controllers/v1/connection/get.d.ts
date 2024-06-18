/// <reference types="express" resolution-mode="require"/>
import type { Connection } from '@nangohq/types';
export declare const getConnection: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'unknown_connection', undefined, unknown>
    | import('@nangohq/types').ApiError<'missing_provider_config', undefined, unknown>
    | import('@nangohq/types').ApiError<'unknown_provider', undefined, unknown>
    | import('@nangohq/types').ApiError<'missing_connection', undefined, unknown>
    | import('@nangohq/types').ApiError<'unknown_provider_config', undefined, unknown>
    | {
          provider: string;
          connection: Connection;
          errorLog: import('@nangohq/types').ActiveLog;
      },
    unknown,
    {
        env: string;
        provider_config_key: string;
        force_refresh?: 'false' | 'true';
    },
    Required<import('../../../utils/express.js').RequestLocals>
>;
