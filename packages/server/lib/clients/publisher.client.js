var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as uuid from 'uuid';
import { createClient } from 'redis';
import { getLogger } from '@nangohq/utils';
import { getRedisUrl } from '@nangohq/shared';
import { errorHtml, successHtml } from '../utils/utils.js';
const logger = getLogger('Server.Publisher');
class Redis {
    constructor(url) {
        this.url = url;
        this.pub = createClient({ url: this.url });
        this.pub.on('error', (err) => {
            logger.error(`Redis (publisher) error: ${err}`);
        });
        this.pub.on('connect', () => {
            logger.info(`Redis (publisher) connected to ${this.url}`);
        });
        this.sub = createClient({ url: this.url });
        this.sub.on('error', (err) => {
            logger.error(`Redis (subscriber) error: ${err}`);
        });
        this.sub.on('connect', () => {
            logger.info(`Redis Subscriber connected to ${this.url}`);
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pub.connect();
            yield this.sub.connect();
        });
    }
    publish(channel, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pub.publish(channel, message);
        });
    }
    subscribe(channel, onMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sub.subscribe(channel, (message, channel) => __awaiter(this, void 0, void 0, function* () {
                onMessage(message, channel);
            }));
        });
    }
    unsubscribe(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sub.unsubscribe(channel);
        });
    }
}
class RedisPublisher {
    constructor(redis) {
        this.redis = redis;
    }
    publish(wsClientId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = RedisPublisher.REDIS_CHANNEL_PREFIX + wsClientId;
            try {
                yield this.redis.publish(channel, message);
                return true;
            }
            catch (err) {
                logger.error(`Error publishing message '${message}' to channel '${channel}': ${err}`);
                return false;
            }
        });
    }
    subscribe(wsClientId, onMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = RedisPublisher.REDIS_CHANNEL_PREFIX + wsClientId;
            try {
                yield this.redis.subscribe(channel, (message, channel) => {
                    const wsClientId = channel.replace(RedisPublisher.REDIS_CHANNEL_PREFIX, '');
                    onMessage(message, wsClientId);
                });
            }
            catch (err) {
                logger.error(`Error subscribing to redis channel "${channel}": ${err}`);
            }
        });
    }
    unsubscribe(wsClientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = RedisPublisher.REDIS_CHANNEL_PREFIX + wsClientId;
            try {
                yield this.redis.unsubscribe(channel);
            }
            catch (err) {
                logger.error(`Error unsubscribing from redis channel "${channel}": ${err}`);
            }
        });
    }
}
RedisPublisher.REDIS_CHANNEL_PREFIX = 'publisher:';
class WebSocketPublisher {
    constructor() {
        this.wsClients = new Map();
    }
    subscribe(ws, wsClientId) {
        this.wsClients.set(wsClientId, ws);
        ws.send(JSON.stringify({ message_type: "connection_ack" /* MessageType.ConnectionAck */, ws_client_id: wsClientId }));
        return wsClientId;
    }
    unsubscribe(wsClientId) {
        this.wsClients.delete(wsClientId);
    }
    publish(wsClientId, message) {
        const client = this.wsClients.get(wsClientId);
        if (client) {
            client.send(message);
            return true;
        }
        return false;
    }
}
export class Publisher {
    constructor(redisClients) {
        this.wsPublisher = new WebSocketPublisher();
        if (redisClients) {
            this.redisPublisher = new RedisPublisher(redisClients);
        }
        else {
            this.redisPublisher = null;
        }
    }
    subscribe(ws, wsClientId = uuid.v4()) {
        return __awaiter(this, void 0, void 0, function* () {
            this.wsPublisher.subscribe(ws, wsClientId);
            if (this.redisPublisher) {
                const onMessage = (message, channel) => __awaiter(this, void 0, void 0, function* () {
                    this.wsPublisher.publish(channel, message);
                    yield this.unsubscribe(wsClientId);
                });
                yield this.redisPublisher.subscribe(wsClientId, onMessage);
            }
        });
    }
    unsubscribe(wsClientId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.wsPublisher.unsubscribe(wsClientId);
            if (this.redisPublisher) {
                yield this.redisPublisher.unsubscribe(wsClientId);
            }
        });
    }
    publish(wsClientId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // returns true if the message was sent to the WebSocket client
            // false otherwise
            const delivered = this.wsPublisher.publish(wsClientId, message);
            if (!delivered) {
                // If the message was not sent because this instance doesn't have a WebSocket client for the channel
                // we forward it to another instance via Redis
                if (this.redisPublisher) {
                    yield this.redisPublisher.publish(wsClientId, message);
                }
            }
            return delivered;
        });
    }
    notifyErr(res, wsClientId, providerConfigKey, connectionId, wsErr) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.debug(`OAuth flow error for provider config "${providerConfigKey}" and connectionId "${connectionId}": ${wsErr.type} - ${wsErr.message}`);
            if (wsClientId) {
                const data = JSON.stringify({
                    message_type: "error" /* MessageType.Error */,
                    provider_config_key: providerConfigKey,
                    connection_id: connectionId,
                    error_type: wsErr.type,
                    error_desc: wsErr.message
                });
                const published = yield this.publish(wsClientId, data);
                if (published) {
                    yield this.unsubscribe(wsClientId);
                }
            }
            errorHtml(res, wsClientId, wsErr);
        });
    }
    notifySuccess(res, wsClientId, providerConfigKey, connectionId, isPending = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (wsClientId) {
                const data = JSON.stringify({
                    message_type: "success" /* MessageType.Success */,
                    provider_config_key: providerConfigKey,
                    connection_id: connectionId,
                    is_pending: isPending
                });
                const published = yield this.publish(wsClientId, data);
                if (published) {
                    yield this.unsubscribe(wsClientId);
                }
            }
            successHtml(res, wsClientId, providerConfigKey, connectionId);
        });
    }
}
const redis = await (() => __awaiter(void 0, void 0, void 0, function* () {
    let redis;
    const url = getRedisUrl();
    if (url) {
        redis = new Redis(url);
        yield redis.connect();
    }
    return redis;
}))();
export default new Publisher(redis);
//# sourceMappingURL=publisher.client.js.map