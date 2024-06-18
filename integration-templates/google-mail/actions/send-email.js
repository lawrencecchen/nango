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
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // generate a base64 representation of input
            const email = `From: ${input.from}\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.body}`;
            const base64EncodedEmail = Buffer.from(email).toString('base64');
            // send the email using nango proxy
            const sentEmailResponse = yield nango.proxy({
                method: 'POST',
                endpoint: '/gmail/v1/users/me/messages/send',
                data: {
                    raw: base64EncodedEmail
                }
            });
            return mapEmail(sentEmailResponse.data);
        }
        catch (error) {
            throw new nango.ActionError({
                message: 'Failed to send email in the gmail-send action script.',
                details: {
                    message: error === null || error === void 0 ? void 0 : error.message,
                    method: (_a = error === null || error === void 0 ? void 0 : error.config) === null || _a === void 0 ? void 0 : _a.method,
                    url: (_b = error === null || error === void 0 ? void 0 : error.config) === null || _b === void 0 ? void 0 : _b.url,
                    code: error === null || error === void 0 ? void 0 : error.code
                }
            });
        }
    });
}
function mapEmail(record) {
    return {
        id: record.id,
        threadId: record.threadId
    };
}
//# sourceMappingURL=send-email.js.map