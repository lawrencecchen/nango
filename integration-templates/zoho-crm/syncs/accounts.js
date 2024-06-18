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
            const endpoint = '/crm/v2/Accounts';
            const config = Object.assign({ headers: {
                    'If-Modified-Since': ((_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toUTCString()) || ''
                }, paginate: {
                    limit: 100
                } }, (fields ? { params: { fields } } : {}));
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const account = _d.value;
                    const mappedAccounts = account.map(mapAccounts) || [];
                    // Save Accounts
                    const batchSize = mappedAccounts.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} accounts (total accounts: ${totalRecords})`);
                    yield nango.batchSave(mappedAccounts, 'ZohoCRMAccount');
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
                yield nango.log('No Accounts found.');
            }
            else {
                throw new Error(`Error in fetchData: ${error.message}`);
            }
        }
    });
}
function mapAccounts(account) {
    return {
        Owner: account.Owner,
        $currency_symbol: account.$currency_symbol,
        $field_states: account.$field_states,
        Account_Type: account.Account_Type,
        SIC_Code: account.SIC_Code,
        Last_Activity_Time: account.Last_Activity_Time,
        Industry: account.Industry,
        Account_Site: account.Account_Site,
        $state: account.$state,
        $process_flow: account.$process_flow,
        Billing_Country: account.Billing_Country,
        $locked_for_me: account.$locked_for_me,
        id: account.id,
        $approved: account.$approved,
        $approval: account.$approval,
        Billing_Street: account.Billing_Street,
        Created_Time: account.Created_Time,
        $editable: account.$editable,
        Billing_Code: account.Billing_Code,
        Shipping_City: account.Shipping_City,
        Shipping_Country: account.Shipping_Country,
        Shipping_Code: account.Shipping_Code,
        Billing_City: account.Billing_City,
        Created_By: account.Created_By,
        $zia_owner_assignment: account.$zia_owner_assignment,
        Annual_Revenue: account.Annual_Revenue,
        Shipping_Street: account.Shipping_Street,
        Ownership: account.Ownership,
        Description: account.Description,
        Rating: account.Rating,
        Shipping_State: account.Shipping_State,
        $review_process: account.$review_process,
        Website: account.Website,
        Employees: account.Employees,
        Record_Image: account.Record_Image,
        Modified_By: account.Modified_By,
        $review: account.$review,
        Phone: account.Phone,
        Account_Name: account.Account_Name,
        Account_Number: account.Account_Number,
        Ticker_Symbol: account.Ticker_Symbol,
        Modified_Time: account.Modified_Time,
        $orchestration: account.$orchestration,
        Parent_Account: account.Parent_Account,
        $in_merge: account.$in_merge,
        Locked__s: account.Locked__s,
        Billing_State: account.Billing_State,
        Tag: account.Tag,
        Fax: account.Fax,
        $approval_state: account.$approval_state
    };
}
//# sourceMappingURL=accounts.js.map