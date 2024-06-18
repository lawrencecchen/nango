/// <reference types="express" resolution-mode="require"/>
export declare const resendVerificationEmailByEmail: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'email_already_verified', undefined, unknown>
    | import('@nangohq/types').ApiError<'user_not_found', undefined, unknown>
    | {
          success: boolean;
      },
    {
        email: string;
    },
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
