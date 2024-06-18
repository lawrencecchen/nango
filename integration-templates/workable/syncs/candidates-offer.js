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
            const candidates = yield getAllCandidates(nango);
            for (const candidate of candidates) {
                const offer = yield getCandidateOffer(nango, candidate.id);
                if (offer) {
                    const mappedOffer = mapOffer(offer);
                    totalRecords++;
                    yield nango.log(`Saving offer for candidate ${candidate.id} (total offers: ${totalRecords})`);
                    yield nango.batchSave([mappedOffer], 'WorkableCandidateOffer');
                }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function getAllCandidates(nango) {
    var e_1, _a;
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
function getCandidateOffer(nango, candidateId) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = `/spi/v3/candidates/${candidateId}/offer`;
        //candidate's latest offer
        try {
            const offer = yield nango.get({ endpoint });
            return mapOffer(offer.data);
        }
        catch (error) {
            throw new Error(`Error in getCandidateOffer: ${error.message}`);
        }
    });
}
function mapOffer(offer) {
    return {
        id: offer.candidate.id,
        candidate: offer.candidate,
        created_at: offer.created_at,
        document_variables: offer.document_variables,
        documents: offer.documents,
        state: offer.state
    };
}
//# sourceMappingURL=candidates-offer.js.map