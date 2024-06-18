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
            const endpoint = '/crm/v2/Contacts';
            const config = Object.assign({ headers: {
                    'If-Modified-Since': ((_b = nango.lastSyncDate) === null || _b === void 0 ? void 0 : _b.toUTCString()) || ''
                }, paginate: {
                    limit: 100
                } }, (fields ? { params: { fields } } : {}));
            try {
                for (var _c = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _d; _d = yield _c.next(), !_d.done;) {
                    const contact = _d.value;
                    const mappedContacts = contact.map(mapContacts) || [];
                    // Save Contacts
                    const batchSize = mappedContacts.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} contacts (total contacts: ${totalRecords})`);
                    yield nango.batchSave(mappedContacts, 'ZohoCRMContact');
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
                yield nango.log('No Contacts found.');
            }
            else {
                throw new Error(`Error in fetchData: ${error.message}`);
            }
        }
    });
}
function mapContacts(contact) {
    return {
        Owner: contact.Owner,
        Email: contact.Email,
        $currency_symbol: contact.$currency_symbol,
        $field_states: contact.$field_states,
        Other_Phone: contact.Other_Phone,
        Mailing_State: contact.Mailing_State,
        Other_State: contact.Other_State,
        Other_Country: contact.Other_Country,
        Last_Activity_Time: contact.Last_Activity_Time,
        Department: contact.Department,
        $state: contact.$state,
        Unsubscribed_Mode: contact.Unsubscribed_Mode,
        $process_flow: contact.$process_flow,
        Assistant: contact.Assistant,
        Mailing_Country: contact.Mailing_Country,
        $locked_for_me: contact.locked_for_me,
        id: contact.id,
        $approved: contact.$approved,
        Reporting_To: contact.Reporting_To,
        $approval: contact.$approval,
        Other_City: contact.Other_City,
        Created_Time: contact.Created_Time,
        $editable: contact.$editable,
        Home_Phone: contact.Home_Phone,
        Created_By: contact.Created_By,
        $zia_owner_assignment: contact.$zia_owner_assignment,
        Secondary_Email: contact.Secondary_Email,
        Description: contact.Description,
        Vendor_Name: contact.Vendor_Name,
        Mailing_Zip: contact.Mailing_Zip,
        $review_process: contact.$review_process,
        Twitter: contact.Twitter,
        Other_Zip: contact.Other_Zip,
        Mailing_Street: contact.Mailing_Street,
        Salutation: contact.Salutation,
        First_Name: contact.First_Name,
        Full_Name: contact.Full_Name,
        Asst_Phone: contact.Asst_Phone,
        Record_Image: contact.Record_Image,
        Modified_By: contact.Modified_By,
        $review: contact.$review,
        Skype_ID: contact.Skype_ID,
        Phone: contact.Phone,
        Account_Name: contact.Account_Name,
        Email_Opt_Out: contact.Email_Opt_Out,
        Modified_Time: contact.Modified_Time,
        Date_of_Birth: contact.Date_of_Birth,
        Mailing_City: contact.Mailing_City,
        Unsubscribed_Time: contact.Unsubscribed_Time,
        Title: contact.Title,
        Other_Street: contact.Other_Street,
        Mobile: contact.Mobile,
        $orchestration: contact.$orchestration,
        Last_Name: contact.Last_Name,
        $in_merge: contact.$in_merge,
        Locked__s: contact.Locked__s,
        Lead_Source: contact.Lead_Source,
        Tag: contact.Tag,
        Fax: contact.Fax,
        $approval_state: contact.$approval_state
    };
}
//# sourceMappingURL=contacts.js.map