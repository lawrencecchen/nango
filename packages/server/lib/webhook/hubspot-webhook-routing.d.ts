import type { Config as ProviderConfig } from '@nangohq/shared';

import type { WebhookHandler } from './types.js';
export declare function validate(integration: ProviderConfig, headers: Record<string, any>, body: any): boolean;
declare const route: WebhookHandler;
export default route;
