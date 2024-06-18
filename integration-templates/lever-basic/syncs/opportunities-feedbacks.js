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
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            const opportunities = yield getAllOpportunities(nango);
            for (const opportunity of opportunities) {
                const endpoint = `/v1/opportunities/${opportunity.id}/feedback`;
                const config = {
                    paginate: {
                        type: 'cursor',
                        cursor_path_in_response: 'next',
                        cursor_name_in_request: 'offset',
                        limit_name_in_request: 'limit',
                        response_path: 'data',
                        limit: LIMIT
                    }
                };
                try {
                    for (var _b = (e_1 = void 0, __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint })))), _c; _c = yield _b.next(), !_c.done;) {
                        const feedback = _c.value;
                        const mappedFeedback = feedback.map(mapFeedback) || [];
                        // Save feedbacks
                        const batchSize = mappedFeedback.length;
                        totalRecords += batchSize;
                        yield nango.log(`Saving batch of ${batchSize} feedback(s) for opportunity ${opportunity.id} (total feedback(s): ${totalRecords})`);
                        yield nango.batchSave(mappedFeedback, 'LeverOpportunityFeedback');
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function getAllOpportunities(nango) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const config = {
            endpoint: '/v1/opportunities',
            paginate: {
                type: 'cursor',
                cursor_path_in_response: 'next',
                cursor_name_in_request: 'offset',
                limit_name_in_request: 'limit',
                response_path: 'data',
                limit: LIMIT
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(config)), _c; _c = yield _b.next(), !_c.done;) {
                const recordBatch = _c.value;
                records.push(...recordBatch);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return records;
    });
}
function mapFeedback(feedback) {
    return {
        id: feedback.id,
        type: feedback.type,
        text: feedback.text,
        instructions: feedback.instructions,
        fields: feedback.fields,
        baseTemplateId: feedback.baseTemplateId,
        interview: feedback.interview,
        panel: feedback.panel,
        user: feedback.user,
        createdAt: feedback.createdAt,
        completedAt: feedback.completedAt,
        updatedAt: feedback.updatedAt,
        deletedAt: feedback.deletedAt
    };
}
//# sourceMappingURL=opportunities-feedbacks.js.map