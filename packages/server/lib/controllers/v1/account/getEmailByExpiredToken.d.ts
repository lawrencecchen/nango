/// <reference types="express" resolution-mode="require"/>
export declare const getEmailByExpiredToken: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'error_refreshing_token', undefined, unknown>
    | import('@nangohq/types').ApiError<'user_not_found', undefined, unknown>
    | {
          email: string;
          verified: boolean;
          uuid: string;
      },
    unknown,
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
