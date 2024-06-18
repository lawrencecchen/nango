/// <reference types="express" resolution-mode="require"/>
export declare const updateSecondaryUrl: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | {
          data: {
              url: string;
          };
      },
    {
        url: string;
    },
    {
        env: string;
    },
    Required<import('../../../../utils/express.js').RequestLocals>
>;
