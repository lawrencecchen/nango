/// <reference types="express" resolution-mode="require"/>
export declare const searchFilters: import('express').RequestHandler<
    any,
    | import('@nangohq/types').ResDefaultErrors
    | {
          data: {
              key: string;
              doc_count: number;
          }[];
      },
    {
        category: 'connection' | 'integration' | 'syncConfig';
        search?: string;
    },
    {
        env: string;
    },
    Required<import('../../../utils/express.js').RequestLocals>
>;
