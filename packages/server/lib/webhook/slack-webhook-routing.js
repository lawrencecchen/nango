var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const route = (nango, integration, headers, body, _rawBody, logContextGetter) => __awaiter(void 0, void 0, void 0, function* () {
    // slack sometimes sends the payload as a form encoded string, so we need to parse it
    // it also sends json as a x-www-form-urlencoded string, so we need to handle that too
    let payload;
    if (headers['content-type'] === 'application/x-www-form-urlencoded') {
        try {
            payload = JSON.parse(body['payload'] || body);
        }
        catch (_a) {
            payload = body;
        }
    }
    else {
        payload = body;
    }
    if (payload['type'] === 'url_verification') {
        return { acknowledgementResponse: body['challenge'] };
    }
    else {
        // the team.id is sometimes stored in the team_id field, and sometimes in the team.id field
        // so we need to check both
        const teamId = payload['team_id'] || payload['team']['id'];
        const response = yield nango.executeScriptForWebhooks(integration, Object.assign(Object.assign({}, payload), { teamId }), 'type', 'teamId', logContextGetter, 'team.id');
        return { parsedBody: payload, connectionIds: (response === null || response === void 0 ? void 0 : response.connectionIds) || [] };
    }
});
export default route;
//# sourceMappingURL=slack-webhook-routing.js.map