/// <reference types="express" resolution-mode="require"/>
import type { WebUser } from '@nangohq/types';
export declare const signupWithToken: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'error_creating_user', undefined, unknown>
    | import('@nangohq/types').ApiError<'user_already_exists', undefined, unknown>
    | import('@nangohq/types').ApiError<'invalid_invite_token', undefined, unknown>
    | import('@nangohq/types').ApiError<'error_logging_in', undefined, unknown>
    | import('@nangohq/types').ApiError<'invalid_account_id', undefined, unknown>
    | {
          user: WebUser;
      },
    {
        email: string;
        name: string;
        password: string;
        token: string;
        accountId: number;
    },
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
