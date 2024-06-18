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
        if (!input.id) {
            throw new nango.ActionError({
                message: 'candidate id is a required field'
            });
        }
        else if (!input.member_id) {
            throw new nango.ActionError({
                message: 'member_id is a required field'
            });
        }
        else if (!input.comment) {
            throw new nango.ActionError({
                message: 'comment is a required field'
            });
        }
        else if (!input.comment.body) {
            throw new nango.ActionError({
                message: 'body is a required field for comment'
            });
        }
        const endpoint = `/spi/v3/candidates/${input.id}/comments`;
        try {
            const postData = {
                member_id: input.member_id,
                comment: {
                    body: input.comment.body,
                    policy: input.comment.policy,
                    attachment: input.comment.attachment
                }
            };
            const resp = yield nango.post({
                endpoint: endpoint,
                data: postData
            });
            return {
                id: resp.data.id
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-comment.js.map