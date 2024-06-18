/// <reference types="express" resolution-mode="require"/>
export declare const patchSettings: import('express').RequestHandler<
    any,
    import('@nangohq/types').ResDefaultErrors | import('@nangohq/types').WebhookSettings,
    import('@nangohq/types').WebhookSettings,
    {
        env: string;
    },
    Required<import('../../../../utils/express.js').RequestLocals>
>;
