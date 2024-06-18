/// <reference types="express" resolution-mode="require"/>
export declare const getEmailByUuid: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'user_not_found', undefined, unknown>
    | {
          email: string;
          verified: boolean;
      },
    unknown,
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
