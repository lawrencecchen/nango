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
export default function runAction(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        let allRepos = [];
        // Fetch user's personal repositories.
        const personalRepos = yield getAll(nango, '/user/repos');
        allRepos = allRepos.concat(personalRepos);
        // Fetch organizations the user is a part of.
        const organizations = yield getAll(nango, '/user/orgs');
        // For each organization, fetch its repositories.
        for (const org of organizations) {
            const orgRepos = yield getAll(nango, `/orgs/${org.login}/repos`);
            allRepos = allRepos.concat(orgRepos);
        }
        const mappedRepos = allRepos.map((repo) => ({
            id: repo.id,
            owner: repo.owner.login,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            date_created: repo.created_at,
            date_last_modified: repo.updated_at
        }));
        return { repos: mappedRepos };
    });
}
function getAll(nango, endpoint) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const proxyConfig = { endpoint, limit: LIMIT };
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
//# sourceMappingURL=list-repos.js.map