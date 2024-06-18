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
        yield fetchAndSaveTickets(nango, query);
    });
}
function buildQuery(lastSyncDate) {
    let baseQuery = `
        SELECT
        Id,
        CaseNumber,
        Subject,
        AccountId,
        Account.Name,
        ContactId,
        Contact.Name,
        OwnerId,
        Owner.Name,
        Priority,
        Status,
        Description,
        Type,
        CreatedDate,
        ClosedDate,
        Origin,
        IsClosed,
        IsEscalated,
        LastModifiedDate,
        (SELECT Id, CommentBody, CreatedDate, CreatedBy.Name FROM CaseComments)
        FROM Case
    `;
    if (lastSyncDate) {
        baseQuery += ` WHERE LastModifiedDate > ${lastSyncDate.toISOString()}`;
    }
    return baseQuery;
}
function fetchAndSaveTickets(nango, query) {
    return __awaiter(this, void 0, void 0, function* () {
        let endpoint = '/services/data/v53.0/query';
        while (true) {
            const response = yield nango.get({
                endpoint: endpoint,
                params: endpoint === '/services/data/v53.0/query' ? { q: query } : {}
            });
            const mappedRecords = mapDeals(response.data.records);
            yield nango.batchSave(mappedRecords, 'SalesforceTicket');
            if (response.data.done) {
                break;
            }
            endpoint = response.data.nextRecordsUrl;
        }
    });
}
function mapDeals(records) {
    return records.map((record) => {
        var _a, _b, _c, _d;
        const salesforceTicket = {
            id: record.Id,
            case_number: record.CaseNumber,
            subject: record.Subject,
            account_id: record.AccountId,
            account_name: ((_a = record.Account) === null || _a === void 0 ? void 0 : _a.Name) || null,
            contact_id: record.ContactId,
            contact_name: ((_b = record.Contact) === null || _b === void 0 ? void 0 : _b.Name) || null,
            owner_id: record.OwnerId,
            owner_name: ((_c = record.Owner) === null || _c === void 0 ? void 0 : _c.Name) || null,
            priority: record.Priority,
            status: record.Status,
            description: record.Description,
            type: record.Type,
            created_date: record.CreatedDate,
            closed_date: record.ClosedDate,
            origin: record.Origin,
            is_closed: record.IsClosed,
            is_escalated: record.IsEscalated,
            conversation: ((_d = record.CaseComments) === null || _d === void 0 ? void 0 : _d.records.map((comment) => ({
                id: comment.Id,
                body: comment.CommentBody,
                created_date: comment.CreatedDate,
                created_by: comment.CreatedBy.Name
            }))) || [],
            last_modified_date: record.LastModifiedDate
        };
        return salesforceTicket;
    });
}
//# sourceMappingURL=tickets.js.map