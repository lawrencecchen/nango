import type { ExternalWebhook, WebhookSettings } from '@nangohq/types';
export declare function get(id: number): Promise<ExternalWebhook | null>;
export declare function update(environment_id: number, data: WebhookSettings): Promise<void>;
export declare function updatePrimaryUrl(environment_id: number, primaryUrl: string): Promise<void>;
export declare function updateSecondaryUrl(environment_id: number, secondaryUrl: string): Promise<void>;
