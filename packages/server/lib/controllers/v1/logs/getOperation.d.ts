/// <reference types="express" resolution-mode="require"/>
export declare const getOperation: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | {
          data: import('@nangohq/types').OperationRow;
      },
    unknown,
    {
        env: string;
    },
    Required<import('../../../utils/express.js').RequestLocals>
>;
