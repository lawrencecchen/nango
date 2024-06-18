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
        if (!input.candidateId) {
            throw new nango.ActionError({
                message: 'candidateId is a required field'
            });
        }
        else if (typeof input.note === 'object') {
            const noteObject = input.note;
            if (!noteObject.value || !noteObject.type) {
                throw new nango.ActionError({
                    message: 'When note is an object, it must have "value" and "type" properties, both of which are required'
                });
            }
        }
        else if (!input.note) {
            throw new nango.ActionError({
                message: 'note is a required field'
            });
        }
        try {
            const postData = {
                candidateId: input.candidateId,
                sendNotifications: input.sendNotifications,
                note: input.note
            };
            const resp = yield nango.post({
                endpoint: `/candidate.createNote`,
                data: postData
            });
            const { id, createdAt, content, author } = resp.data.results;
            return { id, createdAt, content, author };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-note.js.map