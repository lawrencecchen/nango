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
        if (!input.name) {
            throw new nango.ActionError({
                message: 'name is a required field'
            });
        }
        const endpoint = `/1/indexes/contacts`;
        try {
            const postData = {
                name: input.name,
                company: input.company,
                email: input.email
            };
            const resp = yield nango.post({
                endpoint: endpoint,
                data: postData
            });
            return {
                createdAt: resp.data.createdAt,
                taskID: resp.data.taskID,
                objectID: resp.data.objectID
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-contacts.js.map