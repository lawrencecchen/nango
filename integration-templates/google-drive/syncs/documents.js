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
const mimeTypeMapping = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = yield nango.getMetadata();
        if (!metadata || (!metadata.files && !metadata.folders)) {
            throw new Error('Metadata for files or folders is required.');
        }
        const initialFolders = (metadata === null || metadata === void 0 ? void 0 : metadata.folders) ? [...metadata.folders] : [];
        const processedFolders = new Set();
        const batchSize = 100;
        let batch = [];
        function processFolder(folderId) {
            var e_1, _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (processedFolders.has(folderId))
                    return;
                processedFolders.add(folderId);
                const query = `('${folderId}' in parents) and trashed = false`;
                const proxyConfiguration = {
                    endpoint: `drive/v3/files`,
                    params: {
                        fields: 'files(id, name, mimeType, webViewLink, parents), nextPageToken',
                        pageSize: batchSize.toString(),
                        q: query
                    },
                    paginate: {
                        response_path: 'files'
                    }
                };
                try {
                    for (var _b = __asyncValues(nango.paginate(proxyConfiguration)), _c; _c = yield _b.next(), !_c.done;) {
                        const files = _c.value;
                        for (const file of files) {
                            if (file.mimeType === 'application/vnd.google-apps.folder') {
                                yield processFolder(file.id);
                            }
                            else if (file.mimeType === 'application/vnd.google-apps.document' || file.mimeType === 'application/pdf') {
                                const content = yield fetchDocumentContent(nango, file, file.mimeType);
                                batch.push({
                                    id: file.id,
                                    url: file.webViewLink,
                                    content: content || '',
                                    title: file.name
                                });
                                if (batch.length === batchSize) {
                                    yield nango.batchSave(batch, 'Document');
                                    batch = [];
                                }
                            }
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
            });
        }
        for (const folderId of initialFolders) {
            yield processFolder(folderId);
        }
        if (metadata === null || metadata === void 0 ? void 0 : metadata.files) {
            for (const file of metadata.files) {
                try {
                    const documentResponse = yield nango.get({
                        endpoint: `drive/v3/files/${file}`,
                        params: {
                            fields: 'id, name, mimeType, webViewLink, parents'
                        }
                    });
                    const content = yield fetchDocumentContent(nango, documentResponse.data, documentResponse.data.mimeType);
                    batch.push({
                        id: documentResponse.data.id,
                        url: documentResponse.data.webViewLink,
                        content: content || '',
                        title: documentResponse.data.name
                    });
                    if (batch.length === batchSize) {
                        yield nango.batchSave(batch, 'Document');
                        batch = [];
                    }
                }
                catch (e) {
                    yield nango.log(`Error fetching file ${file}: ${e}`);
                }
            }
        }
        if (batch.length > 0) {
            yield nango.batchSave(batch, 'Document');
        }
    });
}
function fetchDocumentContent(nango, doc, mimeType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (mimeType === 'application/vnd.google-apps.spreadsheet') {
                const contentResponse = yield nango.get({
                    endpoint: `drive/v3/files/${doc.id}/export`,
                    params: {
                        mimeType: 'text/csv'
                    },
                    responseType: 'text'
                });
                return contentResponse.data;
            }
            else if (mimeType === 'application/pdf') {
                return '';
            }
            else {
                const exportType = mimeTypeMapping[mimeType] || 'text/plain';
                const contentResponse = yield nango.get({
                    endpoint: `drive/v3/files/${doc.id}/export`,
                    params: {
                        mimeType: exportType
                    }
                });
                return contentResponse.data;
            }
        }
        catch (e) {
            yield nango.log(`Error fetching content for ${doc.name}: ${e}`);
            return null;
        }
    });
}
//# sourceMappingURL=documents.js.map