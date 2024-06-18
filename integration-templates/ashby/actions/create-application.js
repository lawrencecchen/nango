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
        if (!input.candidateId) {
            throw new nango.ActionError({
                message: 'candidateId is a required field'
            });
        }
        else if (!input.jobId) {
            throw new nango.ActionError({
                message: 'jobId is a required field'
            });
        }
        try {
            const postData = {
                candidateId: input.candidateId,
                jobId: input.jobId,
                interviewPlanId: input.interviewPlanId,
                interviewStageId: input.interviewStageId,
                sourceId: input.sourceId,
                creditedToUserId: input.creditedToUserId
            };
            const resp = yield nango.post({
                endpoint: '/application.create',
                data: postData
            });
            const { id, createdAt, updatedAt, status, customFields, candidate, currentInterviewStage, source, archiveReason, job, creditedToUser, hiringTeam, appliedViaJobPostingId } = resp.data.results;
            return {
                id,
                createdAt,
                updatedAt,
                status,
                customFields,
                candidate,
                currentInterviewStage,
                source,
                archiveReason,
                job,
                creditedToUser,
                hiringTeam,
                appliedViaJobPostingId
            };
        }
        catch (error) {
            throw new nango.ActionError({
                message: `Error in runAction: ${error.message}`
            });
        }
    });
}
//# sourceMappingURL=create-application.js.map