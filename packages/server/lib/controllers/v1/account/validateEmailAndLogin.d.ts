/// <reference types="express" resolution-mode="require"/>
import type { WebUser } from '@nangohq/types';
export declare const validateEmailAndLogin: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'error_logging_in', undefined, unknown>
    | import('@nangohq/types').ApiError<'error_validating_user', undefined, unknown>
    | import('@nangohq/types').ApiError<'token_expired', undefined, unknown>
    | import('@nangohq/types').ApiError<'error_refreshing_token', undefined, unknown>
    | {
          user: WebUser;
      },
    {
        token: string;
    },
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
