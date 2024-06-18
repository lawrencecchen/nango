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
        // Get the users in the org
        const params = {
            customer: 'my_customer'
        };
        const users = yield paginate(nango, '/admin/directory/v1/users', 'users', params);
        for (const user of users) {
            // Get the access tokens
            const tokens = yield paginate(nango, `/admin/directory/v1/users/${user.id}/tokens`, 'items');
            const mappedTokens = tokens.map((token) => ({
                id: token.clientId,
                user_id: user.id,
                app_name: token.displayText,
                anonymous_app: token.anonymous,
                scopes: token.scopes.join(',')
            }));
            yield nango.batchSave(mappedTokens, 'GoogleWorkspaceUserToken');
        }
    });
}
function paginate(nango, endpoint, resultsKey, queryParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_PAGE = 100;
        let results = [];
        let page = null;
        const callParams = queryParams || {};
        while (true) {
            if (page) {
                callParams['pageToken'] = `${page}`;
            }
            const resp = yield nango.get({
                baseUrlOverride: 'https://admin.googleapis.com',
                endpoint: endpoint,
                params: Object.assign({ maxResults: `${MAX_PAGE}` }, callParams)
            });
            results = results.concat(resp.data[resultsKey]);
            if (resp.data.nextPageToken) {
                page = resp.data.nextPageToken;
            }
            else {
                break;
            }
        }
        return results;
    });
}
//# sourceMappingURL=workspace-user-access-tokens.js.map