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
const LIMIT = 100;
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            const calls = yield getAllCalls(nango);
            for (const Specificall of calls) {
                const call = yield getSpecificCall(nango, Specificall.id);
                if (call) {
                    const mappedCall = mapCall(call);
                    totalRecords++;
                    yield nango.log(`Saving call for call ${call.id} (total call(s): ${totalRecords})`);
                    yield nango.batchSave([mappedCall], 'ClariCopilotCall');
                }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function getAllCalls(nango) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        //first run to get all calls from the past 1 year
        const lastSyncDate = nango.lastSyncDate;
        const queryDate = lastSyncDate ? lastSyncDate.toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
        const config = {
            endpoint: '/calls',
            params: { filterTimeGt: queryDate },
            paginate: {
                type: 'offset',
                offset_name_in_request: 'skip',
                response_path: 'calls',
                limit_name_in_request: 'limit',
                limit: LIMIT
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(config)), _c; _c = yield _b.next(), !_c.done;) {
                const recordBatch = _c.value;
                records.push(...recordBatch);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return records;
    });
}
function getSpecificCall(nango, callId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const endpoint = `/call-details`;
            const call = yield nango.get({
                endpoint,
                params: {
                    id: callId,
                    includeAudio: 'true',
                    includeVideo: 'true'
                }
            });
            return mapCall(call.data.call);
        }
        catch (error) {
            throw new Error(`Error in getSpecificCall: ${error.message}`);
        }
    });
}
function mapCall(call) {
    return {
        id: call.id,
        source_id: call.source_id,
        title: call.title,
        users: call.users,
        externalParticipants: call.externalParticipants,
        status: call.status,
        bot_not_join_reason: call.bot_not_join_reason,
        type: call.type,
        time: call.time,
        icaluid: call.icaluid,
        calendar_id: call.calendar_id,
        recurring_event_id: call.recurring_event_id,
        original_start_time: call.original_start_time,
        last_modified_time: call.last_modified_time,
        audio_url: call.audio_url,
        video_url: call.video_url,
        disposition: call.disposition,
        deal_name: call.deal_name,
        deal_value: call.deal_value,
        deal_close_date: call.deal_close_date,
        deal_stage_before_call: call.deal_stage_before_call,
        account_name: call.account_name,
        contact_names: call.contact_names,
        crm_info: call.crm_info,
        bookmark_timestamps: call.bookmark_timestamps,
        metrics: call.metrics,
        call_review_page_url: call.call_review_page_url,
        deal_stage_live: call.deal_stage_live,
        transcript: call.transcript,
        summary: call.summary,
        competitor_sentiments: call.competitor_sentiments
    };
}
//# sourceMappingURL=calls.js.map