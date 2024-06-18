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
        const metadata = yield nango.getMetadata();
        const { orgsToSync } = metadata;
        if (!metadata) {
            throw new Error('No metadata');
        }
        if (!orgsToSync) {
            throw new Error('No orgs to sync');
        }
        const baseEndpoint = '/v1.0/groups';
        for (const orgId of orgsToSync) {
            const endpoint = `${baseEndpoint}/${orgId}/transitiveMembers?$top=500`;
            yield nango.log(`Fetching users for org ID: ${orgId}`);
            yield fetchAndUpdateUsers(nango, endpoint);
        }
        const endpoint = 'v1.0/directory/deletedItems/microsoft.graph.user?$top=100';
        yield nango.log(`Detecting deleted users`);
        yield fetchAndUpdateUsers(nango, endpoint, true);
    });
}
function fetchAndUpdateUsers(nango, endpoint, runDelete = false) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const selects = [
            'id',
            'mail',
            'displayName',
            'givenName',
            'deletedDateTime',
            'surname',
            'userPrincipalName',
            'mobilePhone',
            'accountEnabled',
            'userType',
            'createdDateTime'
        ];
        do {
            const disabledUsers = [];
            const response = yield nango.get({
                endpoint,
                retries: 5,
                params: {
                    $select: selects.join(',')
                }
            });
            const { data } = response;
            if (!data.value) {
                yield nango.log(`No ${runDelete ? 'deleted ' : ''}users found.`);
                break;
            }
            const users = [];
            for (const u of data.value) {
                let email = u.mail;
                if (runDelete && !email && u.userPrincipalName) {
                    const id = u.id.replace(/-/g, '');
                    email = u.userPrincipalName.replace(id, '');
                }
                if (u['@odata.type'] && !u['@odata.type'].includes('#microsoft.graph.user')) {
                    continue;
                }
                const user = {
                    id: u.id,
                    email,
                    displayName: u.displayName,
                    givenName: u.givenName,
                    familyName: u.surname,
                    picture: null,
                    type: u.userType,
                    isAdmin: null,
                    phone: {
                        value: u.mobilePhone,
                        type: 'mobile'
                    },
                    createdAt: (_a = u.createdDateTime) !== null && _a !== void 0 ? _a : null,
                    deletedAt: (_b = u.deletedDateTime) !== null && _b !== void 0 ? _b : null,
                    organizationId: null,
                    organizationPath: null,
                    department: (_c = u.department) !== null && _c !== void 0 ? _c : null
                };
                if (u.accountEnabled !== undefined && u.accountEnabled === false) {
                    disabledUsers.push(user);
                    continue;
                }
                users.push(user);
            }
            if (runDelete) {
                yield nango.batchDelete(users, 'User');
            }
            else {
                if (disabledUsers.length) {
                    yield nango.batchDelete(disabledUsers, 'User');
                }
                yield nango.batchSave(users, 'User');
            }
            endpoint = data['@odata.nextLink'];
        } while (endpoint);
    });
}
//# sourceMappingURL=users.js.map