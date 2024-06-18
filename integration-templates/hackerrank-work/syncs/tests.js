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
        let totalRecords = 0;
        try {
            const endpoint = '/x/api/v3/tests';
            const config = {
                paginate: {
                    type: 'link',
                    limit_name_in_request: 'limit',
                    link_path_in_response_body: 'next',
                    response_path: 'data',
                    limit: 100
                }
            };
            const lastSyncDate = nango.lastSyncDate;
            try {
                for (var _b = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _c; _c = yield _b.next(), !_c.done;) {
                    const test = _c.value;
                    const testsToSave = [];
                    for (const item of test) {
                        if (lastSyncDate !== undefined && new Date(item.created_at) < lastSyncDate) {
                            continue; // Skip tests created before lastSyncDate
                        }
                        const mappedTest = mapTest(item);
                        totalRecords++;
                        testsToSave.push(mappedTest);
                    }
                    if (testsToSave.length > 0) {
                        yield nango.batchSave(testsToSave, 'HackerRankWorkTest');
                        yield nango.log(`Saving batch of ${testsToSave.length} test(s) (total test(s): ${totalRecords})`);
                    }
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
function mapTest(test) {
    return {
        id: test.id,
        unique_id: test.unique_id,
        name: test.name,
        duration: test.duration,
        owner: test.owner,
        instructions: test.instructions,
        created_at: test.created_at,
        state: test.state,
        locked: test.locked,
        test_type: test.test_type,
        starred: test.starred,
        start_time: test.start_time,
        end_time: test.end_time,
        draft: test.draft,
        questions: test.questions,
        sections: test.sections,
        tags: test.tags,
        permission: test.permission
    };
}
//# sourceMappingURL=tests.js.map