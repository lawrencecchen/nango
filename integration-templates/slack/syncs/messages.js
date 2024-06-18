var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import { createHash } from 'crypto';
export default function fetchData(nango) {
    var e_1, _a, e_2, _b, e_3, _c;
    return __awaiter(this, void 0, void 0, function* () {
        let batchMessages = [];
        let batchMessageReply = [];
        let metadata = (yield nango.getMetadata()) || {};
        const channelsLastSyncDate = metadata['channelsLastSyncDate'] || {};
        const unseenChannels = Object.keys(channelsLastSyncDate);
        const channelsRequestConfig = {
            endpoint: 'users.conversations',
            paginate: {
                limit: 200,
                response_path: 'channels'
            }
        };
        try {
            // For every channel read messages, replies & reactions
            for (var _d = __asyncValues(getEntries(nango.paginate(channelsRequestConfig))), _e; _e = yield _d.next(), !_e.done;) {
                const currentChannel = _e.value;
                const channelSyncTimestamp = channelsLastSyncDate[currentChannel.id]
                    ? new Date(new Date().setDate(new Date().getDate() - 10)).getTime() / 1000
                    : '';
                channelsLastSyncDate[currentChannel.id] = new Date().toString();
                // Keep track of channels we no longer saw in the API
                if (unseenChannels.includes(currentChannel.id)) {
                    unseenChannels.splice(unseenChannels.indexOf(currentChannel.id), 1);
                }
                yield nango.log(`Processing channel: ${currentChannel.id} - ${channelSyncTimestamp === '' ? 'Initial sync, getting whole history' : 'Incremential sync, re-syncing last 10 days'}`);
                const messagesRequestConfig = {
                    endpoint: 'conversations.history',
                    params: {
                        channel: currentChannel['id'],
                        oldest: channelSyncTimestamp.toString()
                    },
                    paginate: {
                        limit: 200,
                        response_path: 'messages'
                    }
                };
                try {
                    for (var _f = (e_2 = void 0, __asyncValues(getEntries(nango.paginate(messagesRequestConfig)))), _g; _g = yield _f.next(), !_g.done;) {
                        let message = _g.value;
                        message = message;
                        const mappedMessage = {
                            id: createHash('sha256').update(`${message.ts}${currentChannel.id}`).digest('hex'),
                            ts: message.ts,
                            channel_id: currentChannel.id,
                            thread_ts: message.thread_ts ? message.thread_ts : null,
                            app_id: message.app_id ? message.app_id : null,
                            bot_id: message.bot_id ? message.bot_id : null,
                            display_as_bot: message.display_as_bot ? message.display_as_bot : null,
                            is_locked: message.is_locked ? message.is_locked : null,
                            metadata: {
                                event_type: message.type
                            },
                            parent_user_id: message.parent_user_id ? message.parent_user_id : null,
                            subtype: message.subtype ? message.subtype : null,
                            text: message.text ? message.text : null,
                            topic: message.topic ? message.topic : null,
                            user_id: message.user ? message.user : null,
                            raw_json: JSON.stringify(message)
                        };
                        batchMessages.push(mappedMessage);
                        if (batchMessages.length > 49) {
                            yield nango.batchSave(batchMessages, 'SlackMessage');
                            batchMessages = [];
                        }
                        // Save reactions if there are
                        if (message.reactions) {
                            yield saveReactions(nango, currentChannel.id, message);
                        }
                        // Replies to fetch?
                        if (message.reply_count > 0) {
                            const messagesReplyRequestConfig = {
                                endpoint: 'conversations.replies',
                                params: {
                                    channel: currentChannel.id,
                                    ts: message.thread_ts
                                },
                                paginate: {
                                    limit: 200,
                                    response_path: 'messages'
                                }
                            };
                            try {
                                for (var _h = (e_3 = void 0, __asyncValues(getEntries(nango.paginate(messagesReplyRequestConfig)))), _j; _j = yield _h.next(), !_j.done;) {
                                    const reply = _j.value;
                                    if (reply.ts === message.ts) {
                                        continue;
                                    }
                                    const mappedReply = {
                                        id: createHash('sha256').update(`${reply.ts}${currentChannel.id}`).digest('hex'),
                                        ts: reply.ts,
                                        channel_id: currentChannel.id,
                                        thread_ts: reply.thread_ts ? reply.thread_ts : null,
                                        app_id: reply.app_id ? reply.app_id : null,
                                        bot_id: reply.bot_id ? reply.bot_id : null,
                                        display_as_bot: reply.display_as_bot ? reply.display_as_bot : null,
                                        is_locked: reply.is_locked ? reply.is_locked : null,
                                        metadata: {
                                            event_type: reply.type
                                        },
                                        parent_user_id: reply.parent_user_id ? reply.parent_user_id : null,
                                        subtype: reply.subtype ? reply.subtype : null,
                                        text: reply.text ? reply.text : null,
                                        topic: reply.topic ? reply.topic : null,
                                        user_id: reply.user ? reply.user : null,
                                        root: {
                                            message_id: message.client_message_id,
                                            ts: message.thread_ts
                                        },
                                        raw_json: JSON.stringify(reply)
                                    };
                                    batchMessageReply.push(mappedReply);
                                    if (batchMessageReply.length > 49) {
                                        yield nango.batchSave(batchMessageReply, 'SlackMessageReply');
                                        batchMessageReply = [];
                                    }
                                    // Save reactions if there are
                                    if (reply.reactions) {
                                        yield saveReactions(nango, currentChannel.id, reply);
                                    }
                                }
                            }
                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                            finally {
                                try {
                                    if (_j && !_j.done && (_c = _h.return)) yield _c.call(_h);
                                }
                                finally { if (e_3) throw e_3.error; }
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_b = _f.return)) yield _b.call(_f);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) yield _a.call(_d);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield nango.batchSave(batchMessages, 'SlackMessage');
        yield nango.batchSave(batchMessageReply, 'SlackMessageReply');
        // Remove channels we no longer saw
        if (unseenChannels.length > 0) {
            for (const channel of unseenChannels) {
                delete channelsLastSyncDate[channel];
            }
        }
        // Store last sync date per channel
        metadata = (yield nango.getMetadata()) || {}; // Re-read current metadata, in case it has been changed whilst the sync ran
        metadata['channelsLastSyncDate'] = channelsLastSyncDate;
        yield nango.setMetadata(metadata);
    });
}
function saveReactions(nango, currentChannelId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const batchReactions = [];
        for (const reaction of message.reactions) {
            for (const user of reaction.users) {
                const mappedReaction = {
                    id: createHash('sha256').update(`${message.ts}${reaction.name}${currentChannelId}${user}`).digest('hex'),
                    message_ts: message.ts,
                    channel_id: currentChannelId,
                    user_id: user,
                    thread_ts: message.thread_ts ? message.thread_ts : null,
                    reaction_name: reaction.name
                };
                batchReactions.push(mappedReaction);
            }
        }
        yield nango.batchSave(batchReactions, 'SlackMessageReaction');
    });
}
function getEntries(generator) {
    return __asyncGenerator(this, arguments, function* getEntries_1() {
        var e_4, _a;
        try {
            for (var generator_1 = __asyncValues(generator), generator_1_1; generator_1_1 = yield __await(generator_1.next()), !generator_1_1.done;) {
                const entry = generator_1_1.value;
                for (const child of entry) {
                    yield yield __await(child);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (generator_1_1 && !generator_1_1.done && (_a = generator_1.return)) yield __await(_a.call(generator_1));
            }
            finally { if (e_4) throw e_4.error; }
        }
    });
}
//# sourceMappingURL=messages.js.map