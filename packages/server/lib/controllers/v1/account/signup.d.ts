/// <reference types="express" resolution-mode="require"/>
export declare const signup: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'email_already_verified', undefined, unknown>
    | import('@nangohq/types').ApiError<'error_creating_user', undefined, unknown>
    | import('@nangohq/types').ApiError<'user_already_exists', undefined, unknown>
    | import('@nangohq/types').ApiError<'error_creating_account', undefined, unknown>
    | import('@nangohq/types').ApiError<'email_not_verified', undefined, unknown>
    | {
          uuid: string;
      },
    {
        email: string;
        name: string;
        password: string;
    },
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
