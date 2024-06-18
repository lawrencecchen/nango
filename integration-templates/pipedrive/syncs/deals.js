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
            const endpoint = '/v1/deals/collection';
            const config = Object.assign(Object.assign({}, (nango.lastSyncDate ? { params: { since: (_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toISOString() } } : {})), { paginate: {
                    type: 'cursor',
                    cursor_path_in_response: 'additional_data.next_cursor',
                    cursor_name_in_request: 'cursor',
                    limit_name_in_request: 'limit',
                    response_path: 'data',
                    limit: 100
                } });
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const deal = _d.value;
                    const mappedDeal = deal.map(mapDeal) || [];
                    // Save Deal
                    const batchSize = mappedDeal.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} deals (total deals: ${totalRecords})`);
                    yield nango.batchSave(mappedDeal, 'PipeDriveDeal');
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
function mapDeal(deal) {
    return {
        id: deal.id,
        creator_user_id: deal.creator_user_id,
        user_id: deal.user_id,
        person_id: deal.person_id,
        org_id: deal.org_id,
        stage_id: deal.stage_id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        add_time: deal.add_time,
        update_time: deal.update_time,
        status: deal.status,
        probability: deal.probability,
        lost_reason: deal.lost_reason,
        visible_to: deal.visible_to,
        close_time: deal.close_time,
        pipeline_id: deal.pipeline_id,
        won_time: deal.won_time,
        lost_time: deal.lost_time,
        expected_close_date: deal.expected_close_date,
        label: deal.label
    };
}
//# sourceMappingURL=deals.js.map