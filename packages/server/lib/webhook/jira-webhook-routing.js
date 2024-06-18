var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const route = (nango, integration, _headers, body, _rawBody, logContextGetter) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (Array.isArray(body)) {
        let connectionIds = [];
        for (const event of body) {
            const response = yield nango.executeScriptForWebhooks(integration, event, 'payload.webhookEvent', 'payload.user.accountId', logContextGetter, 'accountId');
            if (response && ((_a = response.connectionIds) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                connectionIds = connectionIds.concat(response.connectionIds);
            }
        }
        return { connectionIds };
    }
    else {
        return nango.executeScriptForWebhooks(integration, body, 'payload.webhookEvent', 'payload.user.accountId', logContextGetter, 'accountId');
    }
});
export default route;
//# sourceMappingURL=jira-webhook-routing.js.map