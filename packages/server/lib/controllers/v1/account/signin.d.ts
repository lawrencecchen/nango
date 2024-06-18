/// <reference types="express" resolution-mode="require"/>
import type { WebUser } from '@nangohq/types';
export declare const signin: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | import('@nangohq/types').ApiError<'email_not_verified', undefined, unknown>
    | import('@nangohq/types').ApiError<'unauthorized', undefined, unknown>
    | {
          user: WebUser;
      },
    {
        email: string;
        password: string;
    },
    unknown,
    Required<import('../../../utils/express.js').RequestLocals>
>;
