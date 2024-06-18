var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as uuid from 'uuid';
import { Publisher } from './publisher.client.js';
const mockWebsocket = () => {
    const mock = {};
    mock.send = vi.fn();
    return mock;
};
const mockRes = ({ status }) => {
    const mock = {};
    mock.status = () => status;
    mock.set = vi.fn();
    mock.send = vi.fn();
    return mock;
};
class MockRedis {
    constructor() {
        // Caveat: only one subscription per channel is supported
        this.subscriptions = new Map();
    }
    publish(channel, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const onMessage = this.subscriptions.get(channel);
            if (onMessage) {
                onMessage(message, channel);
            }
            return true;
        });
    }
    subscribe(channel, onMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            this.subscriptions.set(channel, onMessage);
            return true;
        });
    }
    unsubscribe(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.subscriptions.delete(channel);
            return true;
        });
    }
}
const mockRedis = new MockRedis();
describe('Publisher', () => {
    let publisher1;
    let publisher2;
    let wsClientId;
    let ws;
    beforeEach(() => {
        publisher1 = new Publisher(mockRedis);
        publisher2 = new Publisher(mockRedis);
        wsClientId = uuid.v4();
        ws = mockWebsocket();
    });
    it('knowns about the websocket connection', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = mockRes({ status: 200 });
        vi.spyOn(publisher1, 'unsubscribe');
        vi.spyOn(publisher2, 'unsubscribe');
        yield publisher1.subscribe(ws, wsClientId);
        expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
            message_type: 'connection_ack',
            ws_client_id: wsClientId
        }));
        yield publisher1.notifySuccess(res, wsClientId, 'provider-key', 'connection-id');
        expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
            message_type: 'success',
            provider_config_key: 'provider-key',
            connection_id: 'connection-id',
            is_pending: false
        }));
        expect(ws.send).toHaveBeenCalledTimes(2); // connection_ack + success
        expect(publisher1.unsubscribe).toHaveBeenCalledTimes(1);
        expect(publisher2.unsubscribe).toHaveBeenCalledTimes(0);
    }));
    it('does not known about the websocket connection', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = mockRes({ status: 200 });
        vi.spyOn(publisher1, 'unsubscribe');
        yield publisher1.subscribe(ws, wsClientId);
        yield publisher2.notifySuccess(res, wsClientId, 'provider-key', 'connection-id'); // publisher2 does not know about the websocket connection
        expect(ws.send).toHaveBeenCalledTimes(2); // connection_ack + success
        expect(publisher1.unsubscribe).toHaveBeenCalledTimes(1);
    }));
    it('notifies of an error', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = mockRes({ status: 500 });
        vi.spyOn(publisher1, 'unsubscribe');
        yield publisher1.subscribe(ws, wsClientId);
        yield publisher1.notifyErr(res, wsClientId, 'provider-key', 'connection-id', {});
        expect(ws.send).toHaveBeenCalledTimes(2); // connection_ack + error
        expect(publisher1.unsubscribe).toHaveBeenCalledTimes(1);
    }));
});
//# sourceMappingURL=publisher.client.unit.test.js.map