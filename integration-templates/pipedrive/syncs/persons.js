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
            const endpoint = '/v1/persons/collection';
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
                    const person = _d.value;
                    const mappedPerson = person.map(mapPerson) || [];
                    // Save Person
                    const batchSize = mappedPerson.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} persons (total persons: ${totalRecords})`);
                    yield nango.batchSave(mappedPerson, 'PipeDrivePerson');
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
function mapPerson(person) {
    return {
        id: person.id,
        active_flag: person.active_flag,
        owner_id: person.owner_id,
        org_id: person.org_id,
        name: person.name,
        phone: person.phone,
        email: person.email,
        update_time: person.update_time,
        delete_time: person.delete_time,
        add_time: person.add_time,
        visible_to: person.visible_to,
        picture_id: person.picture_id,
        label: person.picture_id,
        cc_email: person.cc_email
    };
}
//# sourceMappingURL=persons.js.map