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
        if (!orgsToSync || !orgsToSync.length) {
            throw new Error('No orgs to sync');
        }
        for (const orgUnit of orgsToSync) {
            yield nango.log(`Fetching users for org unit ID: ${orgUnit.id} at the path: ${orgUnit.path}`);
            yield fetchAndUpdateUsers(nango, orgUnit);
        }
        yield nango.log('Detecting deleted users');
        yield fetchAndUpdateUsers(nango, null, true);
    });
}
function fetchAndUpdateUsers(nango, orgUnit, runDelete = false) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const baseUrlOverride = 'https://admin.googleapis.com';
        const endpoint = '/admin/directory/v1/users';
        let pageToken = '';
        do {
            const suspendedUsers = [];
            const params = {
                customer: 'my_customer',
                orderBy: 'email',
                query: orgUnit ? `orgUnitPath='${orgUnit.path}'` : '',
                maxResults: '500',
                showDeleted: runDelete ? 'true' : 'false',
                pageToken
            };
            const response = yield nango.get({
                baseUrlOverride,
                endpoint,
                params
            });
            if (!response) {
                yield nango.log(`No response from the Google API${orgUnit ? `for organizational unit ID: ${orgUnit.id}` : '.'}`);
                break;
            }
            const { data } = response;
            if (!data.users) {
                yield nango.log(`No users to ${runDelete ? 'delete.' : `save for organizational unit ID: ${orgUnit === null || orgUnit === void 0 ? void 0 : orgUnit.id}`}`);
                break;
            }
            const users = [];
            for (const u of data.users) {
                const user = {
                    id: u.id,
                    email: u.primaryEmail,
                    displayName: u.name.fullName,
                    familyName: u.name.familyName,
                    givenName: u.name.givenName,
                    picture: u.thumbnailPhotoUrl,
                    type: u.kind,
                    isAdmin: u.isAdmin,
                    createdAt: u.creationTime,
                    deletedAt: u.deletionTime || null,
                    phone: {
                        value: (_b = (_a = u.phones) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                        type: (_d = (_c = u.phones) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.type
                    },
                    organizationId: runDelete ? null : orgUnit === null || orgUnit === void 0 ? void 0 : orgUnit.id,
                    organizationPath: runDelete ? null : u.orgUnitPath,
                    department: null
                };
                if (u.suspended || u.archived) {
                    suspendedUsers.push(user);
                    continue;
                }
                users.push(user);
            }
            if (runDelete) {
                yield nango.batchDelete(users, 'User');
            }
            else {
                yield nango.batchSave(users, 'User');
                if (suspendedUsers.length) {
                    yield nango.batchDelete(suspendedUsers, 'User');
                }
            }
            pageToken = data.nextPageToken;
        } while (pageToken);
    });
}
//# sourceMappingURL=workspace-users.js.map