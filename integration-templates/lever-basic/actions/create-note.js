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
        if (!input.opportunityId) {
            throw new nango.ActionError({
                message: 'opportunity id is a required field'
            });
        }
        else if (!input.value) {
            throw new nango.ActionError({
                message: 'value of the note is a required field'
            });
        }
        const endpoint = `/v1/opportunities/${input.opportunityId}/notes`;
        try {
            const postData = {
                value: input.value,
                secret: input.secret,
                score: input.score,
                notifyFollowers: input.notifyFollowers,
                createdAt: input.createdAt
            };
            const params = Object.entries(Object.assign(Object.assign({}, (input.perform_as ? { perform_as: input.perform_as } : {})), (input.note_id ? { note_id: input.note_id } : {})))
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            const urlWithParams = `${endpoint}${params ? `?${params}` : ''}`;
            const resp = yield nango.post({
                endpoint: urlWithParams,
                data: postData
            });
            return {
                id: resp.data.data.id,
                text: resp.data.data.text,
                fields: resp.data.data.fields,
                user: resp.data.data.user,
                secret: resp.data.data.secret,
                completedAt: resp.data.data.completedAt,
                createdAt: resp.data.data.createdAt,
                deletedAt: resp.data.data.deletedAt
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-note.js.map