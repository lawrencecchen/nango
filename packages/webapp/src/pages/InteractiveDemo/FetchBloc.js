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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchBloc = void 0;
const prism_1 = require("@mantine/prism");
const icons_1 = require("@geist-ui/icons");
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("./utils");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const language_snippets_1 = require("../../utils/language-snippets");
const store_1 = require("../../store");
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const Spinner_1 = __importDefault(require("../../components/ui/Spinner"));
const Bloc_1 = require("./Bloc");
const utils_2 = require("../../utils/utils");
const analytics_1 = require("../../utils/analytics");
const api_1 = require("../../utils/api");
const FetchBloc = ({ step, connectionId, providerConfigKey, secretKey, records, onProgress }) => {
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const [language, setLanguage] = (0, react_1.useState)(utils_1.Language.Node);
    const [error, setError] = (0, react_1.useState)(null);
    const [pollingInterval, setPollingInterval] = (0, react_1.useState)(undefined);
    const [show, setShow] = (0, react_1.useState)(true);
    const baseUrl = (0, store_1.useStore)((state) => state.baseUrl);
    const snippet = (0, react_1.useMemo)(() => {
        if (language === utils_1.Language.Node) {
            return (0, language_snippets_1.nodeSnippet)(utils_1.model, secretKey, connectionId, providerConfigKey);
        }
        else if (language === utils_1.Language.cURL) {
            return (0, language_snippets_1.curlSnippet)(baseUrl, utils_1.endpointSync, secretKey, connectionId, providerConfigKey);
        }
        return '';
    }, [language, baseUrl, secretKey, connectionId, providerConfigKey]);
    (0, react_1.useEffect)(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);
    const fetchRecords = () => __awaiter(void 0, void 0, void 0, function* () {
        const params = { model: utils_1.model };
        const res = yield (0, api_1.apiFetch)(`/records?${new URLSearchParams(params).toString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Provider-Config-Key': providerConfigKey,
                'Connection-Id': connectionId
            }
        });
        if (res.status !== 200) {
            const json = (yield res.json());
            setError(json.message ? json.message : 'An unexpected error occurred, please retry');
            analyticsTrack('web:demo:fetch_error');
            setPollingInterval(undefined);
            return;
        }
        const fetchedRecords = (yield res.json());
        if (fetchedRecords.records.length <= 0) {
            setError('An unexpected error occurred, please retry');
            setPollingInterval(undefined);
            return;
        }
        setError(null);
        onProgress(fetchedRecords.records);
        setPollingInterval(undefined);
    });
    const startPolling = () => {
        if (pollingInterval) {
            return;
        }
        analyticsTrack('web:demo:fetch');
        function poll() {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield (0, api_1.apiFetch)(`/api/v1/onboarding/sync-status?env=dev`, {
                    method: 'POST',
                    body: JSON.stringify({ connectionId })
                });
                if (res.status !== 200) {
                    clearInterval(pollingInterval);
                    setPollingInterval(undefined);
                    const json = (yield res.json());
                    setError(json.message ? json.message : 'An unexpected error occurred, please retry');
                    analyticsTrack('web:demo:fetch_error');
                    return;
                }
                const data = (yield res.json());
                if (data.jobStatus === 'SUCCESS') {
                    analyticsTrack('web:demo:fetch_success');
                    clearInterval(pollingInterval);
                    void fetchRecords();
                }
            });
        }
        const tmp = setInterval(poll, 1000);
        void poll();
        setPollingInterval(tmp);
    };
    const cleanedRecords = (0, react_1.useMemo)(() => {
        if (records.length <= 0) {
            return '';
        }
        return JSON.stringify(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        records.map((_a) => {
            var { _nango_metadata } = _a, rest = __rest(_a, ["_nango_metadata"]);
            return rest;
        }), null, 2);
    }, [records]);
    return (<Bloc_1.Bloc title="Fetch the new data" subtitle={<>
                    Fetch GitHub{' '}
                    <a href="https://github.com/NangoHQ/interactive-demo/issues?q=is%3Aissue+is%3Aopen+label%3Ademo" target="_blank" rel="noreferrer" className="underline">
                        sample issues
                    </a>{' '}
                    issues in your backend, via Nango.
                </>} active={step === utils_1.Steps.Webhooks} done={step >= utils_1.Steps.Fetch}>
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
                    {step === utils_1.Steps.Webhooks && !pollingInterval && (<Button_1.default type="button" variant="primary" onClick={startPolling}>
                            <img className="h-5" src="/images/chart-icon.svg" alt=""/>
                            Retrieve GitHub Issues
                        </Button_1.default>)}
                    {pollingInterval && (<div className="flex items-center">
                            <Spinner_1.default size={1}/>
                            <span className="ml-2">Please wait while &ldquo;Issues&rdquo; are being fetched</span>
                        </div>)}

                    {step > utils_1.Steps.Webhooks && (<div>
                            <span className="text-emerald-300 text-sm flex items-center h-9 gap-2">
                                <react_icons_1.CheckCircledIcon className="h-5 w-5"/>
                                {records.length} issues fetched!
                            </span>
                            <button className="my-2 flex text-zinc-400 text-sm gap-2 py-0" onClick={() => setShow(!show)}>
                                {show ? (<>
                                        <icons_1.ChevronDown className="h-5 w-5"/>
                                        Hide
                                    </>) : (<>
                                        <icons_1.ChevronRight className="h-5 w-5"/>
                                        Show
                                    </>)}
                            </button>
                            {show && (<div>
                                    <div className="mb-2 p-1.5 bg-amber-300 bg-opacity-20 rounded justify-center items-center gap-2 inline-flex text-xs">
                                        <react_icons_1.InfoCircledIcon className="h-4 w-4"/> Object schemas are customizable and can be unified across APIs.
                                    </div>
                                    <prism_1.Prism language="json" colorScheme="dark" className="p-1 transparent-code bg-black" noCopy>
                                        {cleanedRecords}
                                    </prism_1.Prism>
                                </div>)}
                        </div>)}
                    {error && <p className="text-sm text-red-500 py-1">{error}</p>}
                </div>
            </div>
        </Bloc_1.Bloc>);
};
exports.FetchBloc = FetchBloc;
//# sourceMappingURL=FetchBloc.js.map