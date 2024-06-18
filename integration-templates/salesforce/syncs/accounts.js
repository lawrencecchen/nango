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
        const query = buildQuery(nango.lastSyncDate);
        yield fetchAndSaveRecords(nango, query);
    });
}
function buildQuery(lastSyncDate) {
    let baseQuery = `
    SELECT
        Id,
        Name,
        Website,
        Description,
        NumberOfEmployees,
        LastModifiedDate
        FROM Account
    `;
    if (lastSyncDate) {
        baseQuery += ` WHERE LastModifiedDate > ${lastSyncDate.toISOString()}`;
    }
    return baseQuery;
}
function fetchAndSaveRecords(nango, query) {
    return __awaiter(this, void 0, void 0, function* () {
        let endpoint = '/services/data/v53.0/query';
        while (true) {
            const response = yield nango.get({
                endpoint: endpoint,
                params: endpoint === '/services/data/v53.0/query' ? { q: query } : {}
            });
            const mappedRecords = mapAccounts(response.data.records);
            yield nango.batchSave(mappedRecords, 'SalesforceAccount');
            if (response.data.done) {
                break;
            }
            endpoint = response.data.nextRecordsUrl;
        }
    });
}
function mapAccounts(records) {
    return records.map((record) => {
        return {
            id: record.Id,
            name: record.Name,
            website: record.Website,
            description: record.Description,
            no_employees: record.NumberOfEmployees,
            last_modified_date: record.LastModifiedDate
        };
    });
}
//# sourceMappingURL=accounts.js.map