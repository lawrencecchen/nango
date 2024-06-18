var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const mapInputToPostData = (input) => {
    return Object.assign({}, input);
};
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input.name) {
            throw new nango.ActionError({
                message: 'name is a required field'
            });
        }
        const endpoint = `/x/api/v3/tests`;
        try {
            const postData = mapInputToPostData(input);
            const resp = yield nango.post({
                endpoint: endpoint,
                data: postData
            });
            return {
                id: resp.data.id,
                unique_id: resp.data.unique_id,
                name: resp.data.name,
                duration: resp.data.duration,
                owner: resp.data.owner,
                instructions: resp.data.instructions,
                created_at: resp.data.created_at,
                state: resp.data.state,
                locked: resp.data.locked,
                test_type: resp.data.test_type,
                starred: resp.data.starred,
                start_time: resp.data.start_time,
                end_time: resp.data.end_time,
                draft: resp.data.draft,
                questions: resp.data.questions,
                sections: resp.data.sections,
                tags: resp.data.tags,
                permission: resp.data.permission
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-test.js.map