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
        const { lastSyncDate } = nango;
        const pageSize = 50;
        let after = '';
        while (true) {
            const filterParam = lastSyncDate
                ? `
        , filter: {
            updatedAt: { gte: "${lastSyncDate.toISOString()}" }
        }`
                : '';
            const afterParam = after ? `, after: "${after}"` : '';
            const query = `
        query {
            issues (first: ${pageSize}${afterParam}${filterParam}) {
                nodes {
                    assignee {
                        id
                        email
                        displayName
                        avatarUrl
                        name
                    }
                    createdAt
                    updatedAt
                    creator {
                        id
                        email
                        displayName
                        avatarUrl
                        name
                    }
                    description
                    dueDate
                    id
                    project {
                        id
                    }
                    team {
                        id
                    }
                    title
                    state {
                        description
                        id
                        name
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }`;
            const response = yield nango.post({
                baseUrlOverride: 'https://api.linear.app',
                endpoint: '/graphql',
                data: {
                    query: query
                }
            });
            yield nango.batchSave(mapIssues(response.data.data.issues.nodes), 'LinearIssue');
            if (!response.data.data.issues.pageInfo.hasNextPage || !response.data.data.issues.pageInfo.endCursor) {
                break;
            }
            else {
                after = response.data.data.issues.pageInfo.endCursor;
            }
        }
    });
}
function mapIssues(records) {
    return records.map((record) => {
        var _a, _b, _c;
        return {
            id: record.id,
            assigneeId: ((_a = record.assignee) === null || _a === void 0 ? void 0 : _a.id) ? record.assignee.id : null,
            creatorId: ((_b = record.creator) === null || _b === void 0 ? void 0 : _b.id) ? record.creator.id : null,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            description: record.description,
            dueDate: record.dueDate ? new Date(record.dueDate) : null,
            projectId: ((_c = record.project) === null || _c === void 0 ? void 0 : _c.id) ? record.project.id : null,
            teamId: record.team.id,
            title: record.title,
            status: record.state.name
        };
    });
}
//# sourceMappingURL=issues.js.map