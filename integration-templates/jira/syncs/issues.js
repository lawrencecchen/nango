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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const jql = nango.lastSyncDate ? `updated >= "${(_a = nango.lastSyncDate) === null || _a === void 0 ? void 0 : _a.toISOString().slice(0, -8).replace('T', ' ')}"` : '';
        let startAt = 0;
        const maxResults = 50;
        const fields = 'id,key,summary,description,issuetype,status,assignee,reporter,project,created,updated';
        const cloudId = yield getCloudId(nango);
        while (true) {
            const response = yield nango.get({
                baseUrlOverride: 'https://api.atlassian.com',
                endpoint: `ex/jira/${cloudId}/rest/api/3/search`,
                params: {
                    jql: jql,
                    startAt: `${startAt}`,
                    maxResults: `${maxResults}`,
                    fields: fields
                },
                headers: {
                    'X-Atlassian-Token': 'no-check'
                },
                retries: 10 // Exponential backoff + long-running job = handles rate limits well.
            });
            const issues = response.data.issues;
            yield nango.batchSave(mapIssues(issues), 'JiraIssue');
            if (issues.length < maxResults) {
                break;
            }
            else {
                startAt += maxResults;
            }
        }
    });
}
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
function mapIssues(records) {
    return records.map((record) => ({
        id: record.id,
        key: record.key,
        summary: record.fields.summary,
        issueType: record.fields.issuetype.name,
        status: record.fields.status.name,
        url: record.self,
        assignee: record.fields.assignee ? record.fields.assignee.emailAddress : null,
        projectKey: record.fields.project.key,
        projectName: record.fields.project.name,
        createdAt: new Date(record.fields.created),
        updatedAt: new Date(record.fields.updated)
    }));
}
//# sourceMappingURL=issues.js.map