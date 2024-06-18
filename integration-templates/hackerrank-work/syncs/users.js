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
            const endpoint = '/x/api/v3/users';
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
                    const user = _c.value;
                    const usersToSave = [];
                    for (const item of user) {
                        if (lastSyncDate !== undefined && new Date(item.created_at) < lastSyncDate) {
                            continue; // Skip users created before lastSyncDate
                        }
                        const mappedUser = mapUser(item);
                        totalRecords++;
                        usersToSave.push(mappedUser);
                    }
                    if (usersToSave.length > 0) {
                        yield nango.batchSave(usersToSave, 'HackerRankWorkUser');
                        yield nango.log(`Saving batch of ${usersToSave.length} user(s) (total user(s): ${totalRecords})`);
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
function mapUser(user) {
    return {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        country: user.country,
        role: user.role,
        status: user.status,
        phone: user.phone,
        timezone: user.timezone,
        questions_permission: user.questions_permission,
        tests_permission: user.tests_permission,
        interviews_permission: user.interviews_permission,
        candidates_permission: user.candidates_permission,
        shared_questions_permission: user.shared_questions_permission,
        shared_tests_permission: user.shared_tests_permission,
        shared_interviews_permission: user.shared_interviews_permission,
        shared_candidates_permission: user.shared_candidates_permission,
        created_at: user.created_at,
        company_admin: user.company_admin,
        team_admin: user.team_admin,
        company_id: user.company_id,
        teams: user.teams,
        activated: user.activated,
        last_activity_time: user.last_activity_time
    };
}
//# sourceMappingURL=users.js.map