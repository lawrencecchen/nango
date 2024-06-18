var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        //input validation
        if (!input.requestJobDescription.type) {
            throw new nango.ActionError({
                message: 'requestJobDescription type is a required field in requestJobDescription'
            });
        }
        else if (!input.inputSettings.type) {
            throw new nango.ActionError({
                message: 'inputSettings type is a required field in inputSettings'
            });
        }
        const connection = yield nango.getConnection();
        try {
            let credentials = {};
            if ('username' in connection.credentials && 'password' in connection.credentials) {
                credentials = {
                    partnerUserID: connection.credentials.username,
                    partnerUserSecret: connection.credentials.password
                };
            }
            else {
                throw new nango.ActionError({
                    message: `Basic API credentials are incomplete`
                });
            }
            const postData = 'requestJobDescription=' +
                encodeURIComponent(JSON.stringify({
                    type: input.requestJobDescription.type,
                    credentials: credentials,
                    inputSettings: {
                        type: input.inputSettings.type
                    }
                }));
            const resp = yield nango.post({
                baseUrlOverride: `https://integrations.expensify.com/Integration-Server`,
                endpoint: `/ExpensifyIntegrations`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: postData
            });
            const { policyList } = resp.data;
            return { policyList };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error}`
            });
        }
    });
}
//# sourceMappingURL=list-policies.js.map