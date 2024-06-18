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
        // Get the list of contacts
        // As of 2023-08-02 the "per_page" parameter is not documented but works
        // https://developers.intercom.com/intercom-api-reference/reference/listcontacts
        let finished = false;
        let nextPage = '';
        while (!finished) {
            // This API endpoint has an annoying bug: If you pass "starting_after" with no value you get a 500 server error
            // Because of this we only set it here when we are fetching page >= 2, otherwise we don't pass it.
            const queryParams = {
                per_page: '150'
            };
            if (nextPage !== '') {
                queryParams['starting_after'] = nextPage;
            }
            // Make the API request with Nango
            const resp = yield nango.get({
                baseUrlOverride: 'https://api.intercom.io/',
                endpoint: 'contacts',
                retries: 5,
                headers: {
                    'Intercom-Version': '2.9'
                },
                params: queryParams
            });
            const contacts = resp.data.data;
            const mappedContacts = contacts.map((contact) => ({
                id: contact.id,
                workspace_id: contact.workspace_id,
                external_id: contact.external_id,
                type: contact.role,
                email: contact.email,
                phone: contact.phone,
                name: contact.name,
                created_at: new Date(contact.created_at * 1000),
                updated_at: new Date(contact.updated_at * 1000),
                last_seen_at: contact.last_seen_at ? new Date(contact.last_seen_at * 1000) : null,
                last_replied_at: contact.last_replied_at ? new Date(contact.last_replied_at * 1000) : null
            }));
            // Store this page of conversations in Nango
            yield nango.batchSave(mappedContacts, 'IntercomContact');
            // Are there more pages?
            // If so, set nextPage to the cursor of the next page
            if (resp.data.pages.next) {
                nextPage = resp.data.pages.next.starting_after;
            }
            else {
                finished = true;
            }
        }
    });
}
//# sourceMappingURL=contacts.js.map