import type { LogContextGetter } from '@nangohq/logs';

import type { WebhookHandler } from './types.js';

const route: WebhookHandler = async (nango, integration, _headers, body, _rawBody, logContextGetter: LogContextGetter) => {
    return nango.executeScriptForWebhooks(integration, body, 'nango.eventType', 'nango.connectionId', logContextGetter, 'connectionId');
};

export default route;
