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
            const endpoint = '/v1/opportunities';
            const config = Object.assign(Object.assign({}, (nango.lastSyncDate ? { params: { created_at_start: nango.lastSyncDate.getTime() } } : {})), { paginate: {
                    type: 'cursor',
                    cursor_path_in_response: 'next',
                    cursor_name_in_request: 'offset',
                    limit_name_in_request: 'limit',
                    response_path: 'data',
                    limit: LIMIT
                } });
            try {
                for (var _b = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _c; _c = yield _b.next(), !_c.done;) {
                    const opportunity = _c.value;
                    const mappedOpportunity = opportunity.map(mapOpportunity) || [];
                    const batchSize = mappedOpportunity.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} opportunities (total opportunities: ${totalRecords})`);
                    yield nango.batchSave(mappedOpportunity, 'LeverOpportunity');
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
function mapOpportunity(opportunity) {
    return {
        id: opportunity.id,
        name: opportunity.name,
        headline: opportunity.headline,
        contact: opportunity.contact,
        emails: opportunity.emails,
        phones: opportunity.phones,
        confidentiality: opportunity.confidentiality,
        location: opportunity.location,
        links: opportunity.links,
        archived: opportunity.archived,
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt,
        lastInteractionAt: opportunity.lastInteractionAt,
        lastAdvancedAt: opportunity.lastAdvancedAt,
        snoozedUntil: opportunity.snoozedUntil,
        archivedAt: opportunity.archivedAt,
        archiveReason: opportunity.archiveReason,
        stage: opportunity.stage,
        stageChanges: opportunity.stageChanges,
        owner: opportunity.owner,
        tags: opportunity.tags,
        sources: opportunity.sources,
        origin: opportunity.origin,
        sourcedBy: opportunity.sourcedBy,
        applications: opportunity.applications,
        resume: opportunity.resume,
        followers: opportunity.followers,
        urls: opportunity.urls,
        dataProtection: opportunity.dataProtection,
        isAnonymized: opportunity.isAnonymized,
        opportunityLocation: opportunity.opportunityLocation
    };
}
//# sourceMappingURL=opportunities.js.map