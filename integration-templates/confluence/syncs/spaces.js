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
function getCloudId(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield nango.get({
            baseUrlOverride: 'https://api.atlassian.com',
            endpoint: `oauth/token/accessible-resources`,
            retries: 10 // Exponential backoff + long-running job = handles rate limits well.
        });
        return response.data[0].id;
    });
}
export default function fetchData(nango) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const cloudId = yield getCloudId(nango);
        let totalRecords = 0;
        const proxyConfig = {
            baseUrlOverride: `https://api.atlassian.com/ex/confluence/${cloudId}`,
            endpoint: `/wiki/api/v2/spaces`,
            retries: 10,
            paginate: {
                limit: 100
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
                const spaceBatch = _c.value;
                const confluenceSpaces = mapConfluenceSpaces(spaceBatch);
                const batchSize = confluenceSpaces.length;
                totalRecords += batchSize;
                yield nango.log(`Saving batch of ${batchSize} spaces (total records: ${totalRecords})`);
                yield nango.batchSave(confluenceSpaces, 'ConfluenceSpace');
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function mapConfluenceSpaces(spaces) {
    return spaces.map((space) => {
        return {
            id: space.id,
            key: space.key,
            name: space.name,
            type: space.type,
            status: space.status,
            authorId: space.authorId,
            createdAt: space.createdAt,
            homepageId: space.homepageId,
            description: space.description || ''
        };
    });
}
//# sourceMappingURL=spaces.js.map