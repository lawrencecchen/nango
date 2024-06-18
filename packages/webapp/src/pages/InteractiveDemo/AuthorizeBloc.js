"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.AuthorizeBloc = void 0;
const react_1 = require("react");
const prism_1 = require("@mantine/prism");
const frontend_1 = __importStar(require("@nangohq/frontend"));
const react_icons_1 = require("@radix-ui/react-icons");
const analytics_1 = require("../../utils/analytics");
const utils_1 = require("./utils");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const Bloc_1 = require("./Bloc");
const api_1 = require("../../utils/api");
const AuthorizeBloc = ({ step, connectionId, hostUrl, providerConfigKey, publicKey, onProgress }) => {
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const [error, setError] = (0, react_1.useState)(null);
    const [id, setId] = (0, react_1.useState)(undefined);
    const onAuthorize = () => __awaiter(void 0, void 0, void 0, function* () {
        analyticsTrack('web:demo:authorize');
        let idTmp = id;
        try {
            // Setup the onboarding process
            const res = yield (0, api_1.apiFetch)(`/api/v1/onboarding?env=dev`, {
                method: 'POST'
            });
            if (res.status !== 201) {
                const json = (yield res.json());
                setError(json.message ? json.message : 'An unexpected error occurred');
                analyticsTrack('web:demo:authorize_error');
                return;
            }
            const json = (yield res.json());
            idTmp = json.id;
            setId(idTmp);
        }
        catch (err) {
            analyticsTrack('web:demo:authorize_error');
            setError(err instanceof Error ? `error: ${err.message}` : 'An unexpected error occurred');
            return;
        }
        try {
            // Start the oauth process
            const nango = new frontend_1.default({ host: hostUrl, publicKey });
            yield nango.auth(providerConfigKey, connectionId);
            setError(null);
            analyticsTrack('web:demo:authorize_success');
            void onProgress(idTmp);
        }
        catch (err) {
            analyticsTrack('web:demo:authorize_error');
            setError(err instanceof frontend_1.AuthError ? `${err.type} error: ${err.message}` : 'An unexpected error occurred');
        }
    });
    const snippet = (0, react_1.useMemo)(() => {
        return `import Nango from '@nangohq/frontend';

// Find the public key in your environment settings (safe to reveal).
const nango = new Nango({ publicKey: '${publicKey}' });

nango.auth('${providerConfigKey}', '${connectionId}')
`;
    }, [publicKey, providerConfigKey, connectionId]);
    return (<Bloc_1.Bloc title="Authorize an API" subtitle={<>Let users authorize GitHub in your frontend.</>} active={step === utils_1.Steps.Start} done={step !== utils_1.Steps.Start}>
            <div className="border bg-zinc-900 border-zinc-900 rounded-lg text-white text-sm">
                <div className="flex justify-between items-center px-5 py-4 bg-zinc-900 rounded-lg">
                    <Bloc_1.Tab>Frontend</Bloc_1.Tab>
                    <CopyButton_1.default dark text={snippet}/>
                </div>
                <prism_1.Prism noCopy language="typescript" className="p-3 transparent-code bg-black font-['Roboto Mono']" colorScheme="dark">
                    {snippet}
                </prism_1.Prism>
                <div className="px-6 py-4 bg-zinc-900 rounded-lg">
                    {step === utils_1.Steps.Start ? (<Button_1.default type="button" variant="primary" onClick={onAuthorize}>
                            <react_icons_1.GitHubLogoIcon />
                            Authorize GitHub
                        </Button_1.default>) : (<span className="text-emerald-300 text-sm flex items-center h-9 gap-2">
                            <react_icons_1.CheckCircledIcon className="h-5 w-5"/>
                            GitHub Authorized!
                        </span>)}
                    {error && <p className="text-sm text-red-500 py-1">{error}</p>}
                </div>
            </div>
        </Bloc_1.Bloc>);
};
exports.AuthorizeBloc = AuthorizeBloc;
//# sourceMappingURL=AuthorizeBloc.js.map