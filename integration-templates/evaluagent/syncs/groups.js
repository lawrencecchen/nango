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
        const payload = {
            endpoint: '/v1/org/groups'
        };
        const response = yield nango.get(payload);
        const returnedData = response.data.data;
        const mappedGroups = returnedData.map((group) => ({
            id: group.id,
            name: group.attributes.name,
            level: group.attributes.level,
            active: group.attributes.active,
            parent: group.attributes.parent,
            hasChildren: group.attributes.has_children,
            isCustomReportingGroup: group.attributes.is_custom_reporting_group
        }));
        if (mappedGroups.length > 0) {
            yield nango.batchSave(mappedGroups, 'EvaluAgentGroup');
            yield nango.log(`Sent ${mappedGroups.length} groups`);
        }
    });
}
//# sourceMappingURL=groups.js.map