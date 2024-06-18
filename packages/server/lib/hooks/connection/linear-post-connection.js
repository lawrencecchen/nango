var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
export default function execute(nango) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
        query {
            organization {
                id
            }
        }`;
        const connection = yield nango.getConnection();
        const response = yield nango.proxy({
            endpoint: '/graphql',
            data: { query },
            method: 'POST',
            connectionId: connection.connection_id,
            providerConfigKey: connection.provider_config_key
        });
        if (axios.isAxiosError(response) || !response || !response.data || !((_b = (_a = response.data.data) === null || _a === void 0 ? void 0 : _a.organization) === null || _b === void 0 ? void 0 : _b.id)) {
            return;
        }
        const organizationId = response.data.data.organization.id;
        yield nango.updateConnectionConfig({ organizationId });
    });
}
//# sourceMappingURL=linear-post-connection.js.map