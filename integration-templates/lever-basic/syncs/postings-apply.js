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
            const postings = yield getAllPostings(nango);
            for (const posting of postings) {
                const apply = yield getPostingApply(nango, posting.id);
                if (apply) {
                    const mappedApply = mapApply(apply);
                    totalRecords++;
                    yield nango.log(`Saving apply for posting ${posting.id} (total applie(s): ${totalRecords})`);
                    yield nango.batchSave([mappedApply], 'LeverPostingApply');
                }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function getAllPostings(nango) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const config = {
            endpoint: '/v1/postings',
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
function getPostingApply(nango, postingId) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = `/v1/postings/${postingId}/apply`;
        try {
            const apply = yield nango.get({ endpoint });
            return mapApply(apply.data.data);
        }
        catch (error) {
            throw new Error(`Error in getPostingApply: ${error.message}`);
        }
    });
}
function mapApply(apply) {
    return {
        id: apply.id,
        text: apply.text,
        customQuestions: apply.customQuestions,
        eeoQuestions: apply.eeoQuestions,
        personalInformation: apply.personalInformation,
        urls: apply.urls
    };
}
//# sourceMappingURL=postings-apply.js.map