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
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = '/admin/directory/v1/customer/my_customer/orgunits';
        let pageToken;
        const rootUnit = {
            name: '{Root Directory}',
            description: 'Root Directory',
            path: '/',
            id: '',
            parentPath: null,
            parentId: null,
            createdAt: null,
            deletedAt: null
        };
        do {
            const params = pageToken ? { type: 'all', pageToken } : { type: 'all' };
            const response = yield nango.get({
                baseUrlOverride: 'https://admin.googleapis.com',
                endpoint,
                params,
                retries: 5
            });
            if (!response) {
                yield nango.log('No response from the Google API');
                return;
            }
            const { data } = response;
            if (data.organizationUnits) {
                if (!rootUnit.id &&
                    data.organizationUnits.length > 0 &&
                    ((_a = data.organizationUnits[0]) === null || _a === void 0 ? void 0 : _a.parentOrgUnitId) &&
                    ((_b = data.organizationUnits[0]) === null || _b === void 0 ? void 0 : _b.parentOrgUnitPath) === '/') {
                    rootUnit.id = data.organizationUnits[0].parentOrgUnitId;
                    yield nango.batchSave([rootUnit], 'OrganizationalUnit');
                }
                const units = data.organizationUnits.map((ou) => {
                    const unit = {
                        name: ou.name,
                        description: ou.description,
                        path: ou.orgUnitPath,
                        id: ou.orgUnitId,
                        parentPath: ou.parentOrgUnitPath,
                        parentId: ou.parentOrgUnitId,
                        createdAt: null,
                        deletedAt: null
                    };
                    return unit;
                });
                yield nango.batchSave(units, 'OrganizationalUnit');
            }
            pageToken = response.data.nextPageToken;
        } while (pageToken);
    });
}
//# sourceMappingURL=workspace-org-units.js.map