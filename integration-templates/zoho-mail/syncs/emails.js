var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const LIMIT = 100;
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        let offset = 1;
        const metadata = (yield nango.getMetadata()) || {};
        const accountId = metadata['accountId'] ? String(metadata['accountId']) : '';
        if (!accountId || typeof accountId !== 'string') {
            throw new Error(`Please set a custom metadata accountId for the connection`);
        }
        try {
            let moreEmails = true;
            while (moreEmails) {
                const response = yield nango.get({
                    endpoint: `/api/accounts/${accountId}/messages/view`,
                    params: {
                        limit: LIMIT,
                        start: offset
                    }
                });
                if (response.data && response.data.data.length > 0) {
                    const mappedEmail = response.data.data.map(mapEmail) || [];
                    // Save Email
                    const batchSize = mappedEmail.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} email(s) (total email(s): ${totalRecords})`);
                    yield nango.batchSave(mappedEmail, 'ZohoMailEmail');
                    if (response.data.data.length < LIMIT) {
                        break;
                    }
                    offset += LIMIT;
                }
                else {
                    moreEmails = false;
                }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error}`);
        }
    });
}
function mapEmail(email) {
    return {
        summary: email.summary,
        sentDateInGMT: email.sentDateInGMT,
        calendarType: email.calendarType,
        subject: email.subject,
        messageId: email.messageId,
        flagid: email.flagid,
        status2: email.status2,
        priority: email.priority,
        hasInline: email.hasInline,
        toAddress: email.toAddress,
        folderId: email.folderId,
        ccAddress: email.ccAddress,
        hasAttachment: email.hasAttachment,
        size: email.size,
        sender: email.sender,
        receivedTime: email.receivedTime,
        fromAddress: email.fromAddress,
        status: email.status
    };
}
//# sourceMappingURL=emails.js.map