var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let nextCursor = null;
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = (yield nango.getMetadata()) || {};
        const jobslastsyncToken = metadata['jobslastsyncToken'] ? String(metadata['jobslastsyncToken']) : '';
        yield saveAllJobs(nango, jobslastsyncToken);
    });
}
function saveAllJobs(nango, jobslastsyncToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            while (true) {
                const payload = {
                    endpoint: '/job.list',
                    data: Object.assign(Object.assign({}, (jobslastsyncToken && { syncToken: jobslastsyncToken })), { cursor: nextCursor, limit: 100 })
                };
                const response = yield nango.post(payload);
                const pageData = response.data.results;
                const mappedJobs = mapJob(pageData);
                if (mappedJobs.length > 0) {
                    const batchSize = mappedJobs.length;
                    totalRecords += batchSize;
                    yield nango.batchSave(mappedJobs, 'AshbyJob');
                    yield nango.log(`Saving batch of ${batchSize} job(s) (total jobs(s): ${totalRecords})`);
                }
                if (response.data.moreDataAvailable) {
                    nextCursor = response.data.nextCursor;
                }
                else {
                    jobslastsyncToken = response.data.syncToken;
                    break;
                }
            }
            const metadata = (yield nango.getMetadata()) || {};
            metadata['jobslastsyncToken'] = jobslastsyncToken;
            yield nango.setMetadata(metadata);
        }
        catch (error) {
            throw new Error(`Error in saveAllJobs: ${error.message}`);
        }
    });
}
function mapJob(jobs) {
    return jobs.map((job) => ({
        id: job.id,
        title: job.title,
        confidential: job.confidential,
        status: job.status,
        employmentType: job.employmentType,
        locationId: job.locationId,
        departmentId: job.departmentId,
        defaultInterviewPlanId: job.defaultInterviewPlanId,
        interviewPlanIds: job.interviewPlanIds,
        customFields: job.customFields,
        jobPostingIds: job.jobPostingIds,
        customRequisitionId: job.customRequisitionId,
        hiringTeam: job.hiringTeam,
        updatedAt: job.updatedAt,
        location: job.location,
        openings: job.openings
    }));
}
//# sourceMappingURL=jobs.js.map