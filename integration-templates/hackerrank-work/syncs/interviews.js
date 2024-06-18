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
export default function fetchData(nango) {
    var e_1, _a;
    var _b;
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            const now = new Date();
            const endpoint = '/x/api/v3/interviews';
            const config = Object.assign(Object.assign({}, (nango.lastSyncDate ? { params: { updated_at: ((_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toISOString()) + '..' + now.toISOString() } } : {})), { paginate: {
                    type: 'link',
                    limit_name_in_request: 'limit',
                    link_path_in_response_body: 'next',
                    response_path: 'data',
                    limit: 100
                } });
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const interview = _d.value;
                    const mappedInterview = interview.map(mapInterview) || [];
                    // Save Interviews
                    const batchSize = mappedInterview.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} interview(s) (total interview(s): ${totalRecords})`);
                    yield nango.batchSave(mappedInterview, 'HackerRankWorkInterview');
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function mapInterview(interview) {
    return {
        id: interview.id,
        status: interview.status,
        created_at: interview.created_at,
        updated_at: interview.updated_at,
        title: interview.title,
        feedback: interview.feedback,
        notes: interview.notes,
        metadata: interview.metadata,
        quickpad: interview.quickpad,
        ended_at: interview.ended_at,
        timezone: interview.timezone,
        interview_template_id: interview.interview_template_id,
        from: interview.from,
        to: interview.to,
        url: interview.url,
        user: interview.user,
        thumbs_up: interview.thumbs_up,
        resume_url: interview.resume_url,
        interviewers: interview.interviewers,
        candidate: interview.candidate,
        result_url: interview.result_url,
        report_url: interview.report_url
    };
}
//# sourceMappingURL=interviews.js.map