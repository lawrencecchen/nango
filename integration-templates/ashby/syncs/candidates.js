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
        const candidatelastsyncToken = metadata['candidatelastsyncToken'] ? String(metadata['candidatelastsyncToken']) : '';
        yield saveAllCandidates(nango, candidatelastsyncToken);
    });
}
function saveAllCandidates(nango, candidatelastsyncToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            while (true) {
                const payload = {
                    endpoint: '/candidate.list',
                    data: Object.assign(Object.assign({}, (candidatelastsyncToken && { syncToken: candidatelastsyncToken })), { cursor: nextCursor, limit: 100 })
                };
                const response = yield nango.post(payload);
                const pageData = response.data.results;
                const mappedCandidates = mapCandidate(pageData);
                if (mappedCandidates.length > 0) {
                    const batchSize = mappedCandidates.length;
                    totalRecords += batchSize;
                    yield nango.batchSave(mappedCandidates, 'AshbyCandidate');
                    yield nango.log(`Saving batch of ${batchSize} candidate(s) (total candidate(s): ${totalRecords})`);
                }
                if (response.data.moreDataAvailable) {
                    nextCursor = response.data.nextCursor;
                }
                else {
                    candidatelastsyncToken = response.data.syncToken;
                    break;
                }
            }
            const metadata = (yield nango.getMetadata()) || {};
            metadata['candidatelastsyncToken'] = candidatelastsyncToken;
            yield nango.setMetadata(metadata);
        }
        catch (error) {
            throw new Error(`Error in saveAllCandidates: ${error.message}`);
        }
    });
}
function mapCandidate(candidates) {
    return candidates.map((candidate) => ({
        id: candidate.id,
        createdAt: candidate.createdAt,
        name: candidate.name,
        primaryEmailAddress: candidate.primaryEmailAddress,
        emailAddresses: candidate.emailAddresses,
        primaryPhoneNumber: candidate.primaryPhoneNumber,
        phoneNumbers: candidate.phoneNumbers,
        socialLinks: candidate.socialLinks,
        tags: candidate.tags,
        position: candidate.position,
        company: candidate.company,
        school: candidate.school,
        applicationIds: candidate.applicationIds,
        resumeFileHandle: candidate.resumeFileHandle,
        fileHandles: candidate.fileHandles,
        customFields: candidate.customFields,
        profileUrl: candidate.profileUrl,
        source: candidate.source,
        creditedToUser: candidate.creditedToUser
    }));
}
//# sourceMappingURL=candidates.js.map