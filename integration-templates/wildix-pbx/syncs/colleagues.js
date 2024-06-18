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
        const MAX_IN_PAGE = 10;
        let page = 1;
        let allPages = 1;
        let start = 0;
        const connection = yield nango.getConnection();
        // https://docs.wildix.com/wms/index.html#tag/Colleagues
        while (true) {
            const payload = {
                baseUrlOverride: `https://${connection.connection_config['subdomain']}.wildixin.com`,
                endpoint: '/api/v1/Colleagues/',
                params: {
                    start,
                    count: MAX_IN_PAGE
                }
            };
            const { data } = yield nango.get(payload);
            const { records, total } = data.result;
            allPages = Math.ceil(total / MAX_IN_PAGE);
            const mappedUsers = records.map((colleague) => ({
                id: colleague.id,
                name: colleague.name,
                extension: colleague.extension,
                email: colleague.email,
                mobilePhone: colleague.mobilePhone,
                licenseType: colleague.licenseType,
                language: colleague.language
            }));
            if (mappedUsers.length > 0) {
                yield nango.batchSave(mappedUsers, 'WildixPbxColleague');
                yield nango.log(`Total colleagues ${total}. Page ${page}/${allPages}.`);
            }
            if (records.length === MAX_IN_PAGE) {
                page += 1;
                start = (page - 1) * MAX_IN_PAGE;
            }
            else {
                break;
            }
        }
    });
}
//# sourceMappingURL=colleagues.js.map