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
        const endpoint = `/repos/${input.owner}/${input.repo}/contents/${input.path}`;
        let fileSha = undefined;
        try {
            const file = yield nango.get({
                endpoint: endpoint
            });
            fileSha = file && file.data && file.data.sha ? file.data.sha : undefined;
        }
        catch (_a) {
            // File does not exist
        }
        yield nango.log(fileSha ? 'File exists, updating.' : 'File does not exist, creating new file.');
        const resp = yield nango.proxy({
            method: 'PUT',
            endpoint: endpoint,
            data: {
                message: input.message,
                content: Buffer.from(input.content).toString('base64'),
                sha: fileSha
            }
        });
        return {
            url: resp.data.content.html_url,
            status: resp.status == 200 || resp.status == 201 ? 'success' : 'failure',
            sha: resp.data.content.sha
        };
    });
}
//# sourceMappingURL=write-file.js.map