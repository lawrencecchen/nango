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
        const repos = yield getAllRepositories(nango);
        for (const repo of repos) {
            const proxyConfig = {
                endpoint: `/repos/${repo.owner.login}/${repo.name}/issues`,
                paginate: {
                    limit: LIMIT
                }
            };
            try {
                for (var _b = (e_1 = void 0, __asyncValues(nango.paginate(proxyConfig))), _c; _c = yield _b.next(), !_c.done;) {
                    const issueBatch = _c.value;
                    const issues = issueBatch.filter((issue) => !('pull_request' in issue));
                    const mappedIssues = issues.map((issue) => ({
                        id: issue.id,
                        owner: repo.owner.login,
                        repo: repo.name,
                        issue_number: issue.number,
                        title: issue.title,
                        state: issue.state,
                        author: issue.user.login,
                        author_id: issue.user.id,
                        body: issue.body,
                        date_created: issue.created_at,
                        date_last_modified: issue.updated_at
                    }));
                    if (mappedIssues.length > 0) {
                        yield nango.batchSave(mappedIssues, 'GithubIssue');
                        yield nango.log(`Sent ${mappedIssues.length} issues from ${repo.owner.login}/${repo.name}`);
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
    });
}
function getAllRepositories(nango) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const records = [];
        const proxyConfig = {
            endpoint: '/user/repos',
            paginate: {
                limit: LIMIT
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
                const recordBatch = _c.value;
                records.push(...recordBatch);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return records;
    });
}
//# sourceMappingURL=issues.js.map