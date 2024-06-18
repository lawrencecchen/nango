var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const backfillPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago.
        const { lastSyncDate } = nango;
        const syncDate = lastSyncDate || backfillPeriod;
        const pageSize = 100;
        let nextPageToken = '';
        do {
            const response = yield nango.proxy({
                method: 'GET',
                endpoint: '/gmail/v1/users/me/messages',
                params: {
                    maxResults: `${pageSize}`,
                    q: `after:${Math.floor(syncDate.getTime() / 1000)}`,
                    pageToken: nextPageToken
                }
            });
            const messageList = response.data.messages || [];
            const emails = [];
            for (const message of messageList) {
                const messageDetail = yield nango.proxy({
                    method: 'GET',
                    endpoint: `/gmail/v1/users/me/messages/${message.id}`
                });
                const headers = messageDetail.data.payload.headers.reduce((acc, current) => {
                    acc[current.name] = current.value;
                    return acc;
                }, {});
                emails.push(mapEmail(messageDetail, headers));
            }
            yield nango.batchSave(emails, 'GmailEmail');
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);
    });
}
function mapEmail(messageDetail, headers) {
    const parts = messageDetail.data.payload.parts || [];
    let body = '';
    for (const part of parts) {
        if (part.mimeType === 'text/plain') {
            body = Buffer.from(part.body.data, 'base64').toString('utf8');
            break;
        }
    }
    return {
        id: messageDetail.data.id,
        sender: headers.From,
        recipients: headers.To,
        date: new Date(parseInt(messageDetail.data.internalDate)),
        subject: headers.Subject,
        body: body,
        threadId: messageDetail.data.threadId
    };
}
//# sourceMappingURL=emails.js.map