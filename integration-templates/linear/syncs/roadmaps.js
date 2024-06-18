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
            roadmaps (first: ${pageSize}${afterParam}${filterParam}) {
                nodes {
                    id
                    name
                    description
                    createdAt
                    updatedAt
                    projects {
                        nodes {
                            id
                        }
                    }
                    organization {
                        teams {
                            nodes {
                                id
                            }
                        }
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
            yield nango.batchSave(mapRoadmaps(response.data.data.roadmaps.nodes), 'LinearRoadmap');
            if (!response.data.data.roadmaps.pageInfo.hasNextPage || !response.data.data.roadmaps.pageInfo.endCursor) {
                break;
            }
            else {
                after = response.data.data.roadmaps.pageInfo.endCursor;
            }
        }
    });
}
function mapRoadmaps(records) {
    return records.map((record) => {
        return {
            id: record.id,
            name: record.name,
            description: record.description,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            teamId: record.organization.teams.nodes[0]['id'] || '',
            projectIds: record.projects.nodes.map((project) => project.id).join(',')
        };
    });
}
//# sourceMappingURL=roadmaps.js.map