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
        const fields = ''; // Define your fields to retrieve specific field values
        try {
            const endpoint = '/crm/v2/Deals';
            const config = Object.assign({ headers: {
                    'If-Modified-Since': ((_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toUTCString()) || ''
                }, paginate: {
                    limit: 100
                } }, (fields ? { params: { fields } } : {}));
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const deal = _d.value;
                    const mappedDeals = deal.map(mapDeals) || [];
                    // Save Deals
                    const batchSize = mappedDeals.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} deals (total deals: ${totalRecords})`);
                    yield nango.batchSave(mappedDeals, 'ZohoCRMDeal');
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
            if (error.status == 304) {
                yield nango.log('No Deals found.');
            }
            else {
                throw new Error(`Error in fetchData: ${error.message}`);
            }
        }
    });
}
function mapDeals(deal) {
    return {
        Owner: deal.Owner,
        Description: deal.Description,
        $currency_symbol: deal.$currency_symbol,
        Campaign_Source: deal.Campaign_Source,
        $field_states: deal.$field_states,
        $review_process: deal.$review_process,
        Closing_Date: deal.Closing_Date,
        Reason_For_Loss__s: deal.Reason_For_Loss__s,
        Last_Activity_Time: deal.Last_Activity_Time,
        Modified_By: deal.Modified_By,
        $review: deal.$review,
        Lead_Conversion_Time: deal.Lead_Conversion_Time,
        $state: deal.$state,
        $process_flow: deal.$process_flow,
        Deal_Name: deal.Deal_Name,
        Expected_Revenue: deal.Expected_Revenue,
        Overall_Sales_Duration: deal.Overall_Sales_Duration,
        Stage: deal.Stage,
        $locked_for_me: deal.$locked_for_me,
        Account_Name: deal.Account_Name,
        id: deal.id,
        $approved: deal.$approved,
        $approval: deal.$approval,
        Modified_Time: deal.Modified_Time,
        Created_Time: deal.Created_Time,
        Amount: deal.Amount,
        Next_Step: deal.Next_Step,
        Probability: deal.Probability,
        $editable: deal.$editable,
        $orchestration: deal.$orchestration,
        Contact_Name: deal.Contact_Name,
        Sales_Cycle_Duration: deal.Sales_Cycle_Duration,
        Type: deal.Type,
        $in_merge: deal.$in_merge,
        Locked__s: deal.Locked__s,
        Lead_Source: deal.Lead_Source,
        Created_By: deal.Created_By,
        Tag: deal.Tag,
        $zia_owner_assignment: deal.$zia_owner_assignment,
        $approval_state: deal.$approval_state
    };
}
//# sourceMappingURL=deals.js.map