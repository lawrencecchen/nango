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
        // https://learn.microsoft.com/en-us/graph/api/group-list-memberof?view=graph-rest-1.0&source=recommendations&tabs=http
        yield fetchAndUpdateOrgs(nango, 'v1.0/groups');
        yield fetchAndUpdateOrgs(nango, 'v1.0/directory/deletedItems/microsoft.graph.group', true);
    });
}
function fetchAndUpdateOrgs(nango, initialEndpoint, runDelete = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let endpoint = initialEndpoint;
        while (endpoint) {
            const deletedGroups = [];
            const { data } = yield nango.get({
                endpoint,
                retries: 5
            });
            if (!data) {
                yield nango.log('No response from the Microsoft API');
                break;
            }
            const value = data.value;
            const units = [];
            for (const ou of value) {
                const unit = {
                    id: ou.id,
                    name: ou.displayName,
                    createdAt: ou.createdDateTime,
                    deletedAt: ou.deletedDateTime,
                    path: null,
                    parentId: null,
                    parentPath: null,
                    description: ou.description
                };
                if (!runDelete && unit.deletedAt) {
                    deletedGroups.push(unit);
                    continue;
                }
                units.push(unit);
            }
            if (runDelete) {
                yield nango.batchDelete(units, 'OrganizationalUnit');
            }
            else {
                yield nango.batchSave(units, 'OrganizationalUnit');
                if (deletedGroups.length) {
                    yield nango.batchDelete(deletedGroups, 'OrganizationalUnit');
                }
            }
            endpoint = data['@odata.nextLink'];
        }
    });
}
//# sourceMappingURL=org-units.js.map