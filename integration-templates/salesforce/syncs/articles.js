var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const customFields = (yield nango.getMetadata()).customFields;
        const query = buildQuery(customFields, nango.lastSyncDate);
        yield fetchAndSaveRecords(nango, query, customFields);
    });
}
function buildQuery(customFields, lastSyncDate) {
    let baseQuery = `
        SELECT Id, Title, ${customFields.join(' ,')}, LastModifiedDate
        FROM Knowledge__kav
        WHERE IsLatestVersion = true
    `;
    if (lastSyncDate) {
        baseQuery += ` AND LastModifiedDate > ${lastSyncDate.toISOString()}`;
    }
    return baseQuery;
}
function fetchAndSaveRecords(nango, query, customFields) {
    return __awaiter(this, void 0, void 0, function* () {
        let endpoint = '/services/data/v53.0/query';
        while (true) {
            const response = yield nango.get({
                endpoint: endpoint,
                params: endpoint === '/services/data/v53.0/query' ? { q: query } : {}
            });
            const mappedRecords = mapRecords(response.data.records, customFields);
            yield nango.batchSave(mappedRecords, 'SalesforceArticle');
            if (response.data.done) {
                break;
            }
            endpoint = response.data.nextRecordsUrl;
        }
    });
}
function mapRecords(records, customFields) {
    return records.map((record) => {
        return {
            id: record.Id,
            title: record.Name,
            content: customFields.map((field) => `Field: ${field}\n${record[field]}`).join('\n'),
            last_modified_date: record.LastModifiedDate
        };
    });
}
//# sourceMappingURL=articles.js.map