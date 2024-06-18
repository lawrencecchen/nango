"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionBloc = void 0;
const react_1 = require("react");
const prism_1 = require("@mantine/prism");
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("./utils");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const Bloc_1 = require("./Bloc");
const utils_2 = require("../../utils/utils");
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const analytics_1 = require("../../utils/analytics");
const language_snippets_1 = require("../../utils/language-snippets");
const store_1 = require("../../store");
const useMeta_1 = require("../../hooks/useMeta");
const api_1 = require("../../utils/api");
const ActionBloc = ({ step, providerConfigKey, connectionId, secretKey, onProgress }) => {
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const { meta } = (0, useMeta_1.useMeta)();
    const [language, setLanguage] = (0, react_1.useState)(utils_1.Language.Node);
    const [title, setTitle] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)(null);
    const [url, setUrl] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const baseUrl = (0, store_1.useStore)((state) => state.baseUrl);
    const snippet = (0, react_1.useMemo)(() => {
        if (language === utils_1.Language.Node) {
            return (0, language_snippets_1.nodeActionSnippet)(utils_1.actionName, secretKey, connectionId, providerConfigKey, { title }, true);
        }
        else {
            return (0, language_snippets_1.curlSnippet)(baseUrl, utils_1.endpointAction, secretKey, connectionId, providerConfigKey, `{ title: ${JSON.stringify(title)} }`, 'POST');
        }
    }, [title, providerConfigKey, connectionId, secretKey, language, baseUrl]);
    (0, react_1.useEffect)(() => {
        if (meta && title === '') {
            setTitle(`${meta.email.split('@')[0]}'s example issue`);
        }
    }, [meta, title]);
    const onDeploy = () => __awaiter(void 0, void 0, void 0, function* () {
        analyticsTrack('web:demo:action');
        setLoading(true);
        try {
            // Deploy the provider
            const res = yield (0, api_1.apiFetch)(`/api/v1/onboarding/action?env=dev`, {
                method: 'POST',
                body: JSON.stringify({ connectionId, title })
            });
            const json = (yield res.json());
            if (res.status !== 200 || 'message' in json || !('action' in json)) {
                setError('message' in json && json.message ? json.message : 'An unexpected error occurred');
                analyticsTrack('web:demo:action_error');
                return;
            }
            setError(null);
            analyticsTrack('web:demo:action_success');
            setUrl(json.action.url);
            onProgress();
        }
        catch (err) {
            analyticsTrack('web:demo:action_error');
            setError(err instanceof Error ? `error: ${err.message}` : 'An unexpected error occurred');
            return;
        }
        finally {
            setLoading(false);
        }
    });
    return (<Bloc_1.Bloc title="Write back or perform workflows" subtitle={<>Create a sample GitHub issue from your backend, via Nango.</>} active={step === utils_1.Steps.Fetch} done={step >= utils_1.Steps.Write} noTrack>
            {step === utils_1.Steps.Fetch && (<div className="flex items-center gap-4 mb-4">
                    <div className="border-l pl-4 h-10 flex items-center">Issue Title</div>
                    <div className="flex-grow">
                        <input type="text" value={title} placeholder="Enter a GitHub issue title" onChange={(e) => setTitle(e.target.value)} className="border-border-gray bg-bg-black text-text-light-gray focus:border-white focus:ring-white block h-10 w-1/2 appearance-none rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:outline-none"/>
                    </div>
                </div>)}
            <div className="border bg-zinc-900 border-zinc-900 rounded-lg text-white text-sm">
                <div className="flex justify-between items-center px-5 py-4 bg-zinc-900 rounded-lg">
                    <div className="space-x-4">
                        <Bloc_1.Tab variant={language === utils_1.Language.Node ? 'black' : 'zombie'} className={(0, utils_2.cn)('cursor-default', language !== utils_1.Language.Node && 'cursor-pointer bg-zinc-900 pointer-events-auto')} onClick={() => {
            setLanguage(utils_1.Language.Node);
        }}>
                            Node
                        </Bloc_1.Tab>
                        <Bloc_1.Tab variant={language === utils_1.Language.cURL ? 'black' : 'zombie'} className={(0, utils_2.cn)('cursor-default', language !== utils_1.Language.cURL && 'cursor-pointer bg-zinc-900 pointer-events-auto')} onClick={() => {
            setLanguage(utils_1.Language.cURL);
        }}>
                            cURL
                        </Bloc_1.Tab>
                    </div>
                    <CopyButton_1.default dark text={snippet}/>
                </div>
                <prism_1.Prism noCopy language="typescript" className="p-3 transparent-code bg-black" colorScheme="dark">
                    {snippet}
                </prism_1.Prism>
                <div className="px-6 py-4">
                    {step === utils_1.Steps.Fetch ? (<Button_1.default type="button" variant="primary" onClick={onDeploy} disabled={!title} isLoading={loading}>
                            Create GitHub issue
                        </Button_1.default>) : (<span className=" text-emerald-300 text-sm flex items-center h-9 gap-2">
                            <react_icons_1.CheckCircledIcon className="h-5 w-5"/>
                            Issue created!
                            <a href={url || 'https://github.com/NangoHQ/interactive-demo/issues'} target="_blank" rel="noreferrer">
                                <Button_1.default variant="secondary">
                                    View <react_icons_1.ExternalLinkIcon />
                                </Button_1.default>
                            </a>
                        </span>)}
                    {error && <p className="mt-2 text-sm text-red-500 py-1 px-1">{error}</p>}
                </div>
            </div>
        </Bloc_1.Bloc>);
};
exports.ActionBloc = ActionBloc;
//# sourceMappingURL=ActionBloc.js.map