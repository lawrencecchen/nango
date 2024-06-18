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
        if (!input.title) {
            throw new nango.ActionError({
                message: 'title is a required field'
            });
        }
        else if (input.candidate && !input.candidate.email) {
            throw new nango.ActionError({
                message: 'email is required for the candidate'
            });
        }
        const endpoint = `/x/api/v3/interviews`;
        try {
            const postData = mapInputToPostData(input);
            const resp = yield nango.post({
                endpoint: endpoint,
                data: postData
            });
            return {
                id: resp.data.id,
                status: resp.data.status,
                created_at: resp.data.created_at,
                updated_at: resp.data.updated_at,
                title: resp.data.title,
                feedback: resp.data.feedback,
                notes: resp.data.notes,
                metadata: resp.data.metadata,
                quickpad: resp.data.quickpad,
                ended_at: resp.data.ended_at,
                timezone: resp.data.timezone,
                interview_template_id: resp.data.interview_template_id,
                from: resp.data.from,
                to: resp.data.to,
                url: resp.data.url,
                user: resp.data.user,
                thumbs_up: resp.data.thumbs_up,
                resume_url: resp.data.resume_url,
                interviewers: resp.data.interviewers,
                candidate: resp.data.candidate,
                result_url: resp.data.result_url,
                report_url: resp.data.report_url
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-interview.js.map