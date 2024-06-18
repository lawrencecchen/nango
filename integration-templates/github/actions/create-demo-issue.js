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
        // Create one issue in GitHub
        const res = yield nango.post({
            endpoint: '/repos/NangoHQ/interactive-demo/issues',
            data: {
                title: `[demo] ${input.title}`,
                body: `This issue was created automatically using Nango Action.

Nango uses actions to perform workflows involving external APIs. Workflows can involve arbitrary series of API requests & data transformations.
Take a look at our [Documentation](https://docs.nango.dev/integrate/guides/perform-workflows-with-an-api)`,
                labels: ['automatic']
            }
        });
        return {
            url: res.data.html_url,
            status: res.status
        };
    });
}
//# sourceMappingURL=create-demo-issue.js.map