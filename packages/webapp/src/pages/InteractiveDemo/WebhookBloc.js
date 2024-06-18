"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookBloc = void 0;
const prism_1 = require("@mantine/prism");
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("./utils");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const Bloc_1 = require("./Bloc");
const WebhookBloc = ({ step, connectionId, records, onProgress }) => {
    const date = (0, react_1.useMemo)(() => {
        // We want a fixed date
        return new Date().toISOString();
    }, []);
    const snippet = (0, react_1.useMemo)(() => {
        return `{
    "connectionId": "${connectionId}",
    "model": "${utils_1.model}",
    "providerConfigKey": "github-demo",
    "responseResults": { "added": ${records.length || 3} },
    "modifiedAfter": "${date}"
}`;
    }, [connectionId, records, date]);
    return (<Bloc_1.Bloc title="Receive webhooks when new data is available" subtitle={<>Receive webhooks from Nango when GitHub issues are modified, so you don&apos;t need to poll periodically.</>} active={step === utils_1.Steps.Deploy} done={step >= utils_1.Steps.Webhooks}>
            <div className="border bg-zinc-900 border-zinc-900 rounded-lg text-white text-sm">
                <prism_1.Prism language="json" colorScheme="dark" noCopy className="transparent-code bg-black rounded-t-lg p-3">
                    {snippet}
                </prism_1.Prism>
                <div className="px-6 py-4 bg-zinc-900 rounded-lg">
                    {step === utils_1.Steps.Deploy ? (<Button_1.default variant="primary" onClick={onProgress}>
                            Got it!
                        </Button_1.default>) : (<span className="text-emerald-300 text-sm flex items-center h-9 gap-2">
                            <react_icons_1.CheckCircledIcon className="h-5 w-5"/>
                            Done!
                        </span>)}
                </div>
            </div>
        </Bloc_1.Bloc>);
};
exports.WebhookBloc = WebhookBloc;
//# sourceMappingURL=WebhookBloc.js.map