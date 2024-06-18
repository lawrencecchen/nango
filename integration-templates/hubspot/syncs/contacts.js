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
    return __awaiter(this, void 0, void 0, function* () {
        const properties = ['firstname', 'lastname', 'email'];
        let totalRecords = 0;
        try {
            const endpoint = '/crm/v3/objects/contacts';
            const config = {
                params: {
                    properties: properties.join(',')
                },
                paginate: {
                    type: 'cursor',
                    cursor_path_in_response: 'paging.next.after',
                    limit_name_in_request: 'limit',
                    cursor_name_in_request: 'after',
                    response_path: 'results',
                    limit: 100
                }
            };
            try {
                for (var _b = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _c; _c = yield _b.next(), !_c.done;) {
                    const contact = _c.value;
                    const mappedContact = mapHubspotContacts(contact);
                    const batchSize = mappedContact.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} owners (total owners: ${totalRecords})`);
                    yield nango.batchSave(mappedContact, 'HubspotContact');
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
function mapHubspotContacts(records) {
    return records.map((record) => {
        return {
            id: record.id,
            created_at: record.createdAt,
            updated_at: record.updatedAt,
            first_name: record.properties.firstname,
            last_name: record.properties.lastname,
            email: record.properties.email,
            active: record.archived !== true
        };
    });
}
//# sourceMappingURL=contacts.js.map