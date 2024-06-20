import * as crypto from 'crypto';
import { httpAgent, httpsAgent } from '@nangohq/utils';
import * as http from 'node:http';
import * as https from 'node:https';
import type { LogContext } from '@nangohq/logs';
import type { WebhookTypes, SyncType, AuthOperationType, Environment, ExternalWebhook } from '@nangohq/types';

export const RETRY_ATTEMPTS = 7;

export const NON_FORWARDABLE_HEADERS = [
    'host',
    'authorization',
    'connection',
    'keep-alive',
    'content-length',
    'content-type', // we're sending json so don't want this overwritten
    'content-encoding',
    'cookie',
    'set-cookie',
    'referer',
    'user-agent',
    'sec-',
    'proxy-',
    'www-authenticate',
    'server'
];

export const retry = async (
    activityLogId: number | null,
    logCtx?: LogContext | null | undefined,
    error?: { response?: { status: number }; code?: string },
    attemptNumber?: number
): Promise<boolean> => {
    if (error?.response && (error?.response?.status < 200 || error?.response?.status >= 300)) {
        const content = `Webhook response received an ${
            error?.response?.status || error?.code
        } error, retrying with exponential backoffs for ${attemptNumber} out of ${RETRY_ATTEMPTS} times`;

        if (activityLogId) {
            await logCtx?.error(content);
        }

        return true;
    }

    return false;
};

export const getSignatureHeader = (secret: string, payload: unknown): Record<string, string> => {
    const combinedSignature = `${secret}${JSON.stringify(payload)}`;
    const createdHash = crypto.createHash('sha256').update(combinedSignature).digest('hex');

    return {
        'X-Nango-Signature': createdHash
    };
};

export const filterHeaders = (headers: Record<string, string>): Record<string, string> => {
    const filteredHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
        if (NON_FORWARDABLE_HEADERS.some((header) => key.toLowerCase().startsWith(header))) {
            continue;
        }

        filteredHeaders[key] = value;
    }

    return filteredHeaders;
};

export const shouldSend = ({
    webhookSettings,
    success,
    type,
    operation
}: {
    webhookSettings: ExternalWebhook;
    success: boolean;
    type: 'auth' | 'sync' | 'forward';
    operation: SyncType | AuthOperationType | 'incoming_webhook';
}): boolean => {
    const hasAnyWebhook = Boolean(webhookSettings.primary_url || webhookSettings.secondary_url);

    if (type === 'forward') {
        return hasAnyWebhook;
    }

    if (!hasAnyWebhook) {
        return false;
    }

    if (type === 'auth') {
        if (operation === 'creation' && !webhookSettings.on_auth_creation) {
            return false;
        }

        if (operation === 'refresh' && !webhookSettings.on_auth_refresh_error) {
            return false;
        }

        return true;
    }

    if (type === 'sync') {
        if (!success && !webhookSettings.on_sync_error) {
            return false;
        }
    }

    return true;
};

export const deliver = async ({
    webhooks,
    body,
    webhookType,
    activityLogId,
    logCtx,
    environment,
    endingMessage = '',
    incomingHeaders
}: {
    webhooks: { url: string; type: string }[];
    body: unknown;
    webhookType: WebhookTypes;
    activityLogId: number | null;
    environment: Environment;
    logCtx?: LogContext | undefined;
    endingMessage?: string;
    incomingHeaders?: Record<string, string>;
}): Promise<boolean> => {
    let success = true;

    for (const webhook of webhooks) {
        const { url, type } = webhook;

        try {
            const headers = {
                ...getSignatureHeader(environment.secret_key, body),
                ...filterHeaders(incomingHeaders || {})
            };

            const options = {
                method: 'POST',
                headers,
                agent: url.startsWith('https') ? httpsAgent : httpAgent
            };

            const response = url.startsWith('https')
                ? await httpsRequest({ ...options, hostname: new URL(url).hostname, path: new URL(url).pathname }, JSON.stringify(body))
                : await httpRequest({ ...options, hostname: new URL(url).hostname, path: new URL(url).pathname }, JSON.stringify(body));

            const status = response.statusCode;

            if (logCtx) {
                if (status >= 200 && status < 300) {
                    await logCtx.info(
                        `${webhookType} webhook sent successfully to the ${type} ${url} and received with a ${status} response code${endingMessage ? ` ${endingMessage}` : ''}.`,
                        body as Record<string, unknown>
                    );
                } else {
                    await logCtx.error(
                        `${webhookType} sent webhook successfully to the ${type} ${url} but received a ${status} response code${endingMessage ? ` ${endingMessage}` : ''}. Please send a 2xx on successful receipt.`,
                        body as Record<string, unknown>
                    );
                    success = false;
                }
            }
        } catch (err) {
            if (activityLogId) {
                await logCtx?.error(`${webhookType} webhook failed to send to the ${type} to ${url}`, {
                    error: err
                });
            }

            success = false;
        }
    }

    return success;
};

export async function httpRequest(options: http.RequestOptions, postData?: string): Promise<{ statusCode: number; data: string }> {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode || 0, data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

export async function httpsRequest(options: https.RequestOptions, postData?: string): Promise<{ statusCode: number; data: string }> {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode || 0, data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}
