/// <reference types="express" resolution-mode="require"/>
export declare const searchMessages: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | {
          data: import('@nangohq/types').MessageRow[];
          pagination: {
              total: number;
              cursorBefore: string;
              cursorAfter: string;
          };
      },
    {
        operationId: string;
        limit?: number;
        states?: import('@nangohq/types').SearchOperationsState[];
        search?: string;
        cursorBefore?: string;
        cursorAfter?: string;
    },
    {
        env: string;
    },
    Required<import('../../../utils/express.js').RequestLocals>
>;
