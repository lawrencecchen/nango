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
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield nango.getConnection();
        const response = yield nango.proxy({
            endpoint: `oauth/token/accessible-resources`,
            connectionId: connection.connection_id,
            providerConfigKey: connection.provider_config_key
        });
        if (axios.isAxiosError(response) || !response || !response.data || response.data.length === 0 || !response.data[0].id) {
            return;
        }
        const cloudId = response.data[0].id;
        const accountResponse = yield nango.proxy({
            endpoint: `ex/jira/${cloudId}/rest/api/3/myself`,
            connectionId: connection.connection_id,
            providerConfigKey: connection.provider_config_key
        });
        if (axios.isAxiosError(accountResponse) || !accountResponse || !accountResponse.data || accountResponse.data.length === 0) {
            yield nango.updateConnectionConfig({ cloudId });
            return;
        }
        const { accountId } = accountResponse.data;
        yield nango.updateConnectionConfig({ cloudId, accountId });
    });
}
//# sourceMappingURL=jira-post-connection.js.map