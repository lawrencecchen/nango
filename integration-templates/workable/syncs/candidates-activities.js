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
            const candidates = yield getAllCandidates(nango);
            for (const candidate of candidates) {
                const endpoint = `/spi/v3/candidates/${candidate.id}/activities`;
                const config = {
                    paginate: {
                        type: 'link',
                        link_path_in_response_body: 'paging.next',
                        limit_name_in_request: 'limit',
                        response_path: 'activities',
                        limit: LIMIT
                    }
                };
                try {
                    for (var _b = (e_1 = void 0, __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint })))), _c; _c = yield _b.next(), !_c.done;) {
                        const activity = _c.value;
                        const mappedActivity = activity.map(mapActivity) || [];
                        const batchSize = mappedActivity.length;
                        totalRecords += batchSize;
                        yield nango.log(`Saving batch of ${batchSize} activitie(s) for candidate ${candidate.id} (total activitie(s): ${totalRecords})`);
                        yield nango.batchSave(mappedActivity, 'WorkableCandidateActivity');
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
function getAllCandidates(nango) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const proxyConfig = {
            endpoint: '/spi/v3/candidates',
            paginate: {
                type: 'link',
                link_path_in_response_body: 'paging.next',
                limit_name_in_request: 'limit',
                response_path: 'candidates',
                limit: LIMIT
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
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
function mapActivity(activity) {
    return {
        id: activity.id,
        action: activity.action,
        stage_name: activity.stage_name,
        created_at: activity.created_at,
        body: activity.body,
        member: activity.member,
        rating: activity.rating
    };
}
//# sourceMappingURL=candidates-activities.js.map