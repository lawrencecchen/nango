var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield nango.getConnection();
        const color = input.status === 'open' ? '#e01e5a' : '#36a64f';
        const channel = connection.connection_config['incoming_webhook.channel_id'];
        if (!channel) {
            yield nango.log(`Slack Hook channel id not configured for the connection ${nango.connectionId}`);
            return null;
        }
        yield nango.post({
            endpoint: 'conversations.join',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: { channel }
        });
        const payload = {
            channel,
            ts: '',
            attachments: [
                {
                    color: color,
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: input.content
                            }
                        }
                    ]
                }
            ]
        };
        if (input.ts) {
            payload['ts'] = input.ts;
        }
        const response = yield nango.post({
            endpoint: input.ts ? 'chat.update' : 'chat.postMessage',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: payload,
            retries: 10
        });
        if (response.data.ok === true) {
            return response.data;
        }
        throw new nango.ActionError({
            message: `Error posting to the Slack channel id ${channel}: ${response.data}`,
            response: response.data
        });
    });
}
//# sourceMappingURL=flow-result-notifier-action.js.map