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
        if (!input.campaign_id) {
            throw new nango.ActionError({
                message: 'campaign_id is a required field'
            });
        }
        else if (!input.name) {
            throw new nango.ActionError({
                message: 'name is a required field'
            });
        }
        try {
            const connection = yield nango.getConnection();
            let api_key;
            if ('apiKey' in connection.credentials) {
                api_key = connection.credentials.apiKey;
            }
            else {
                throw new nango.ActionError({
                    message: `API key credentials is incomplete`
                });
            }
            const postData = {
                api_key: api_key,
                campaign_id: input.campaign_id,
                name: input.name
            };
            const resp = yield nango.post({
                endpoint: `/v1/campaign/set/name`,
                data: postData
            });
            const { status } = resp.data;
            return { status };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error}`
            });
        }
    });
}
//# sourceMappingURL=set-campaign-name.js.map