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
            const endpoint = '/v1/candidates';
            const config = Object.assign(Object.assign({}, (nango.lastSyncDate ? { params: { created_after: (_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toISOString() } } : {})), { paginate: {
                    type: 'link',
                    limit_name_in_request: 'per_page',
                    link_rel_in_response_header: 'next',
                    limit: 100
                } });
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const candidate = _d.value;
                    const mappedCandidate = candidate.map(mapCandidate) || [];
                    const batchSize = mappedCandidate.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} candidate(s) (total candidate(s): ${totalRecords})`);
                    yield nango.batchSave(mappedCandidate, 'GreenhouseCandidate');
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
function mapCandidate(candidate) {
    return {
        id: candidate.id,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        company: candidate.company,
        title: candidate.title,
        created_at: candidate.created_at,
        updated_at: candidate.updated_at,
        last_activity: candidate.last_activity,
        is_private: candidate.is_private,
        photo_url: candidate.photo_url,
        attachments: candidate.attachments,
        application_ids: candidate.application_ids,
        phone_numbers: candidate.phone_numbers,
        addresses: candidate.addresses,
        email_addresses: candidate.email_addresses,
        website_addresses: candidate.website_addresses,
        social_media_addresses: candidate.social_media_addresses,
        recruiter: candidate.recruiter,
        coordinator: candidate.coordinator,
        can_email: candidate.can_email,
        tags: candidate.tags,
        applications: candidate.applications,
        educations: candidate.educations,
        employments: candidate.employments,
        linked_user_ids: candidate.linked_user_ids,
        custom_fields: candidate.custom_fields,
        keyed_custom_fields: candidate.keyed_custom_fields
    };
}
//# sourceMappingURL=candidates.js.map