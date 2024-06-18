var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const responses = yield getAllPages(nango, 'conversations.list');
        const metadata = (yield nango.getMetadata()) || {};
        const mappedChannels = responses.map((record) => {
            return {
                id: record.id,
                name: record.name,
                is_channel: record.is_channel,
                is_group: record.is_group,
                is_im: record.is_im,
                created: record.created,
                creator: record.creator,
                is_archived: record.is_archived,
                is_general: record.is_general,
                name_normalized: record.name_normalized,
                is_shared: record.is_shared,
                is_private: record.is_private,
                is_mpim: record.is_mpim,
                updated: record.updated,
                num_members: record.num_members,
                raw_json: JSON.stringify(record)
            };
        });
        // Now let's also join all public channels where we are not yet a member
        if (metadata['joinPublicChannels']) {
            yield joinPublicChannels(nango, mappedChannels);
        }
        // Save channels
        yield nango.batchSave(mappedChannels, 'SlackChannel');
    });
}
// Checks for public channels where the bot is not a member yet and joins them
function joinPublicChannels(nango, channels) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get ID of all channels where we are already a member
        const joinedChannelsResponse = yield getAllPages(nango, 'users.conversations');
        const channelIds = joinedChannelsResponse.map((record) => {
            return record.id;
        });
        // For every public, not shared channel where we are not a member yet, join
        for (const channel of channels) {
            if (!channelIds.includes(channel.id) && channel.is_shared === false && channel.is_private === false) {
                yield nango.post({
                    endpoint: 'conversations.join',
                    data: {
                        channel: channel.id
                    }
                });
            }
        }
    });
}
function getAllPages(nango, endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        let nextCursor = 'x';
        let responses = [];
        while (nextCursor !== '') {
            const response = yield nango.get({
                endpoint: endpoint,
                params: {
                    limit: '200',
                    cursor: nextCursor !== 'x' ? nextCursor : ''
                }
            });
            if (!response.data.ok) {
                yield nango.log(`Received a Slack API error (for ${endpoint}): ${JSON.stringify(response.data, null, 2)}`);
            }
            const { channels, response_metadata } = response.data;
            responses = responses.concat(channels);
            nextCursor = response_metadata.next_cursor;
        }
        return responses;
    });
}
//# sourceMappingURL=channels.js.map