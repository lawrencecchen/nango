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
        // Fetch issues from GitHub
        const res = yield nango.get({
            endpoint: '/repos/NangoHQ/interactive-demo/issues?labels=demo&sort=created&direction=asc'
        });
        // Map issues to your preferred schema
        const issues = res.data.map(({ id, title, html_url }) => {
            return { id, title, url: html_url };
        });
        // Persist issues to the Nango cache
        yield nango.batchSave(issues, 'GithubIssueDemo');
    });
}
//# sourceMappingURL=issues-demo.js.map