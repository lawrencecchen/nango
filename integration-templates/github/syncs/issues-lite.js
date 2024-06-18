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
        const MAX_ISSUES = 15;
        const reposResponse = yield nango.get({
            endpoint: '/user/repos'
        });
        const repos = reposResponse.data;
        for (const repo of repos) {
            const issuesResponse = yield nango.get({
                endpoint: `/repos/${repo.owner.login}/${repo.name}/issues`,
                params: {
                    per_page: MAX_ISSUES.toString()
                }
            });
            let issues = issuesResponse.data;
            issues = issues.filter((issue) => !('pull_request' in issue));
            const mappedIssues = issues.map((issue) => ({
                id: issue.id,
                owner: repo.owner.login,
                repo: repo.name,
                issue_number: issue.number,
                title: issue.title,
                state: issue.state,
                author: issue.user.login,
                author_id: issue.user.id,
                body: issue.body,
                date_created: issue.created_at,
                date_last_modified: issue.updated_at
            }));
            if (mappedIssues.length > 0) {
                yield nango.batchSave(mappedIssues, 'Issue');
                yield nango.log(`Sent ${mappedIssues.length} issues from ${repo.owner.login}/${repo.name}`);
            }
        }
    });
}
//# sourceMappingURL=issues-lite.js.map