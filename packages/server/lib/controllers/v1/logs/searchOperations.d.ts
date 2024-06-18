/// <reference types="express" resolution-mode="require"/>
export declare const searchOperations: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | {
          data: import('@nangohq/types').OperationRow[];
          pagination: {
              total: number;
              cursor: string;
          };
      },
    {
        limit?: number;
        states?: import('@nangohq/types').SearchOperationsState[];
        types?: import('@nangohq/types').SearchOperationsType[];
        integrations?: string[];
        connections?: string[];
        syncs?: string[];
        period?: import('@nangohq/types').SearchOperationsPeriod;
        cursor?: string;
    },
    {
        env: string;
    },
    Required<import('../../../utils/express.js').RequestLocals>
>;
