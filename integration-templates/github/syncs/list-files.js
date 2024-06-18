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
var Models;
(function (Models) {
    Models["GithubRepoFile"] = "GithubRepoFile";
})(Models || (Models = {}));
const LIMIT = 100;
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const { owner, repo, branch } = yield nango.getMetadata();
        // On the first run, fetch all files. On subsequent runs, fetch only updated files.
        if (!nango.lastSyncDate) {
            yield saveAllRepositoryFiles(nango, owner, repo, branch);
        }
        else {
            yield saveFileUpdates(nango, owner, repo, nango.lastSyncDate);
        }
    });
}
function saveAllRepositoryFiles(nango, owner, repo, branch) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let count = 0;
        const endpoint = `/repos/${owner}/${repo}/git/trees/${branch}`;
        const proxyConfig = {
            endpoint,
            params: { recursive: '1' },
            paginate: { response_path: 'tree', limit: LIMIT }
        };
        yield nango.log(`Fetching files from endpoint ${endpoint}.`);
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
                const fileBatch = _c.value;
                const blobFiles = fileBatch.filter((item) => item.type === 'blob');
                count += blobFiles.length;
                yield nango.batchSave(blobFiles.map(mapToFile), Models.GithubRepoFile);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield nango.log(`Got ${count} file(s).`);
    });
}
function saveFileUpdates(nango, owner, repo, since) {
    return __awaiter(this, void 0, void 0, function* () {
        const commitsSinceLastSync = yield getCommitsSinceLastSync(owner, repo, since, nango);
        for (const commitSummary of commitsSinceLastSync) {
            yield saveFilesUpdatedByCommit(owner, repo, commitSummary, nango);
        }
    });
}
function getCommitsSinceLastSync(owner, repo, since, nango) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let count = 0;
        const endpoint = `/repos/${owner}/${repo}/commits`;
        const proxyConfig = {
            endpoint,
            params: { since: since.toISOString() },
            paginate: {
                limit: LIMIT
            }
        };
        yield nango.log(`Fetching commits from endpoint ${endpoint}.`);
        const commitsSinceLastSync = [];
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
                const commitBatch = _c.value;
                count += commitBatch.length;
                commitsSinceLastSync.push(...commitBatch);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        yield nango.log(`Got ${count} commits(s).`);
        return commitsSinceLastSync;
    });
}
function saveFilesUpdatedByCommit(owner, repo, commitSummary, nango) {
    var e_3, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let count = 0;
        const endpoint = `/repos/${owner}/${repo}/commits/${commitSummary.sha}`;
        const proxyConfig = {
            endpoint,
            paginate: {
                response_data_path: 'files',
                limit: LIMIT
            }
        };
        yield nango.log(`Fetching files from endpoint ${endpoint}.`);
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
                const fileBatch = _c.value;
                count += fileBatch.length;
                yield nango.batchSave(fileBatch.filter((file) => file.status !== 'removed').map(mapToFile), Models.GithubRepoFile);
                yield nango.batchDelete(fileBatch.filter((file) => file.status === 'removed').map(mapToFile), Models.GithubRepoFile);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        yield nango.log(`Got ${count} file(s).`);
    });
}
function mapToFile(file) {
    var _a, _b;
    return {
        id: file.sha,
        name: file.path || file.filename,
        url: file.url || file.blob_url,
        last_modified_date: ((_a = file.committer) === null || _a === void 0 ? void 0 : _a.date) ? new Date((_b = file.committer) === null || _b === void 0 ? void 0 : _b.date) : new Date() // Use commit date or current date
    };
}
//# sourceMappingURL=list-files.js.map