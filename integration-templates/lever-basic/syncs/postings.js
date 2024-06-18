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
            const endpoint = '/v1/postings';
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
                for (var _b = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _c; _c = yield _b.next(), !_c.done;) {
                    const posting = _c.value;
                    const mappedPosting = posting.map(mapPosting) || [];
                    const batchSize = mappedPosting.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} posting(s) (total posting(s): ${totalRecords})`);
                    yield nango.batchSave(mappedPosting, 'LeverPosting');
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
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function mapPosting(posting) {
    return {
        id: posting.id,
        text: posting.text,
        createdAt: posting.createdAt,
        updatedAt: posting.updatedAt,
        user: posting.user,
        owner: posting.owner,
        hiringManager: posting.hiringManager,
        confidentiality: posting.confidentiality,
        categories: posting.categories,
        content: posting.content,
        country: posting.country,
        followers: posting.followers,
        tags: posting.tags,
        state: posting.state,
        distributionChannels: posting.distributionChannels,
        reqCode: posting.reqCode,
        requisitionCodes: posting.requisitionCodes,
        salaryDescription: posting.salaryDescription,
        salaryDescriptionHtml: posting.salaryDescriptionHtml,
        salaryRange: posting.salaryRange,
        urls: posting.urls,
        workplaceType: posting.workplaceType
    };
}
//# sourceMappingURL=postings.js.map