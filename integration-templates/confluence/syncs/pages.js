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
        const cloudId = yield getCloudId(nango);
        const proxyConfig = {
            // The base URL is specific for user because of the cloud ID path param
            baseUrlOverride: `https://api.atlassian.com/ex/confluence/${cloudId}`,
            endpoint: `/wiki/api/v2/pages`,
            paginate: {
                limit: 100
            }
        };
        try {
            for (var _b = __asyncValues(nango.paginate(proxyConfig)), _c; _c = yield _b.next(), !_c.done;) {
                const pageBatch = _c.value;
                const confluencePages = mapConfluencePages(pageBatch);
                const batchSize = confluencePages.length;
                totalRecords += batchSize;
                yield nango.log(`Saving batch of ${batchSize} pages (total records: ${totalRecords})`);
                yield nango.batchSave(confluencePages, 'ConfluencePage');
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
function mapConfluencePages(results) {
    return results.map((page) => {
        return {
            id: page.id,
            title: page.title,
            type: page.type,
            status: page.status,
            authorId: page.authorId,
            createdAt: page.createdAt,
            spaceId: page.spaceId,
            parentId: page.parentId,
            parentType: page.parentType,
            position: page.position,
            version: {
                createdAt: page.version.createdAt,
                message: page.version.message,
                number: page.version.number,
                minorEdit: page.version.minorEdit,
                authorId: page.version.authorId
            },
            body: {
                storage: page.body.storage,
                atlas_doc_format: page.body.atlas_doc_format
            }
        };
    });
}
function getCloudId(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield nango.get({
            baseUrlOverride: 'https://api.atlassian.com',
            endpoint: `oauth/token/accessible-resources`
        });
        return response.data[0].id;
    });
}
//# sourceMappingURL=pages.js.map