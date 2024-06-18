import type { WebSocket } from 'ws';

import type { WSErr } from '../utils/web-socket-error.js';
export declare type WebSocketClientId = string;
declare class Redis {
    private url;
    private pub;
    private sub;
    constructor(url: string);
    connect(): Promise<void>;
    publish(channel: string, message: string): Promise<void>;
    subscribe(channel: string, onMessage: (message: string, channel: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
}
export declare class Publisher {
    private redisPublisher;
    private wsPublisher;
    constructor(redisClients: Redis | undefined);
    subscribe(ws: WebSocket, wsClientId?: string): Promise<void>;
    unsubscribe(wsClientId: WebSocketClientId): Promise<void>;
    publish(wsClientId: WebSocketClientId, message: string): Promise<boolean>;
    notifyErr(
        res: any,
        wsClientId: WebSocketClientId | undefined,
        providerConfigKey: string | undefined,
        connectionId: string | undefined,
        wsErr: WSErr
    ): Promise<void>;
    notifySuccess(res: any, wsClientId: WebSocketClientId | undefined, providerConfigKey: string, connectionId: string, isPending?: boolean): Promise<void>;
}
declare const _default: Publisher;
export default _default;
