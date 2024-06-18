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
            const jobs = yield getAllJobs(nango);
            for (const job of jobs) {
                const endpoint = `/spi/v3/jobs/${job.shortcode}/candidates`;
                const config = {
                    paginate: {
                        type: 'link',
                        link_path_in_response_body: 'paging.next',
                        limit_name_in_request: 'limit',
                        response_path: 'candidates',
                        limit: LIMIT
                    }
                };
                try {
                    for (var _b = (e_1 = void 0, __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint })))), _c; _c = yield _b.next(), !_c.done;) {
                        const candidate = _c.value;
                        const mappedCandidate = candidate.map(mapCandidate) || [];
                        // Save candidates
                        const batchSize = mappedCandidate.length;
                        totalRecords += batchSize;
                        yield nango.log(`Saving batch of ${batchSize} candidate(s) for job ${job.shortcode} (total candidates: ${totalRecords})`);
                        yield nango.batchSave(mappedCandidate, 'WorkableCandidate');
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
function getAllJobs(nango) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const config = {
            endpoint: '/spi/v3/jobs',
            paginate: {
                type: 'link',
                link_path_in_response_body: 'paging.next',
                limit_name_in_request: 'limit',
                response_path: 'jobs',
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
function mapCandidate(candidate) {
    return {
        id: candidate.id,
        name: candidate.name,
        firstname: candidate.firstname,
        lastname: candidate.lastname,
        headline: candidate.headline,
        account: candidate.account,
        job: candidate.job,
        stage: candidate.stage,
        disqualified: candidate.disqualified,
        disqualification_reason: candidate.disqualification_reason,
        hired_at: candidate.hired_at,
        sourced: candidate.sourced,
        profile_url: candidate.profile_url,
        address: candidate.address,
        phone: candidate.phone,
        email: candidate.email,
        domain: candidate.domain,
        created_at: candidate.created_at,
        updated_at: candidate.updated_after
    };
}
//# sourceMappingURL=jobs-candidates.js.map