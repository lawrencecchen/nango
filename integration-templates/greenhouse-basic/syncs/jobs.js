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
            const endpoint = '/v1/jobs';
            const config = Object.assign(Object.assign({}, (nango.lastSyncDate ? { params: { created_after: (_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toISOString() } } : {})), { paginate: {
                    type: 'link',
                    limit_name_in_request: 'per_page',
                    link_rel_in_response_header: 'next',
                    limit: 100
                } });
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const job = _d.value;
                    const mappedJob = job.map(mapJob) || [];
                    const batchSize = mappedJob.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} job(s) (total job(s): ${totalRecords})`);
                    yield nango.batchSave(mappedJob, 'GreenhouseJob');
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
function mapJob(job) {
    return {
        id: job.id,
        name: job.name,
        requisition_id: job.requisition_id,
        notes: job.notes,
        confidential: job.confidential,
        status: job.status,
        created_at: job.created_at,
        opened_at: job.opened_at,
        closed_at: job.closed_at,
        updated_at: job.updated_at,
        is_template: job.is_template,
        copied_from_id: job.copied_from_id,
        departments: job.departments,
        offices: job.offices,
        custom_fields: job.custom_fields,
        keyed_custom_fields: job.keyed_custom_fields,
        hiring_team: job.hiring_team,
        openings: job.openings
    };
}
//# sourceMappingURL=jobs.js.map