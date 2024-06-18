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
            projects (first: ${pageSize}${afterParam}${filterParam}) {
                nodes {
                    id
                    name
                    url
                    description
                    teams {
                        nodes {
                            id
                        }
                    }
                    createdAt
                    updatedAt
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
            yield nango.batchSave(mapProjects(response.data.data.projects.nodes), 'LinearProject');
            if (!response.data.data.projects.pageInfo.hasNextPage || !response.data.data.projects.pageInfo.endCursor) {
                break;
            }
            else {
                after = response.data.data.projects.pageInfo.endCursor;
            }
        }
    });
}
function mapProjects(records) {
    return records.map((record) => {
        return {
            id: record.id,
            name: record.name,
            url: record.url,
            description: record.description,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            teamId: record.teams.nodes[0]['id'] || ''
        };
    });
}
//# sourceMappingURL=projects.js.map