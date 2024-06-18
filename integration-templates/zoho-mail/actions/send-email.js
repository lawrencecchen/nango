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
        //we need to enforce accountId to be of type string since accountId contains bigint values 6984040000000000000
        if (!input.accountId || typeof input.accountId !== 'string') {
            throw new nango.ActionError({
                message: 'accountId is a required parameter and needs to be of a non-empty string'
            });
        }
        else if (!input.fromAddress || typeof input.accountId !== 'string') {
            throw new nango.ActionError({
                message: 'fromAddress is a required body field and must be of a non-empty string'
            });
        }
        else if (!input.toAddress || typeof input.accountId !== 'string') {
            throw new nango.ActionError({
                message: 'toAddress is a required body field and must be of a non-empty string'
            });
        }
        try {
            const endpoint = `/api/accounts/${input.accountId}/messages`;
            const postData = {
                fromAddress: input.fromAddress,
                toAddress: input.toAddress,
                ccAddress: input.ccAddress,
                bccAddress: input.bccAddress,
                subject: input.subject,
                encoding: input.encoding,
                mailFormat: input.mailFormat,
                askReceipt: input.askReceipt
            };
            const resp = yield nango.post({
                endpoint: endpoint,
                data: postData
            });
            return {
                status: resp.data.status,
                data: resp.data.data
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error}`
            });
        }
    });
}
//# sourceMappingURL=send-email.js.map