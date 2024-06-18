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
exports.DeployBloc = void 0;
const prism_1 = require("@mantine/prism");
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const Bloc_1 = require("./Bloc");
const utils_1 = require("./utils");
const utils_2 = require("../../utils/utils");
const analytics_1 = require("../../utils/analytics");
const api_1 = require("../../utils/api");
const DeployBloc = ({ step, onProgress }) => {
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const [file, setFile] = (0, react_1.useState)('github-issues-demo.ts');
    const [error, setError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const snippet = (0, react_1.useMemo)(() => {
        if (file === 'github-issues-demo.ts') {
            return `function fetchData(nango: NangoSync) {
    // Fetch issues from GitHub.
    const res = await nango.get({ endpoint: '/repos/NangoHQ/interactive-demo/issues' });

    // Map issues to your preferred schema.
    const issues = res.data.map(issue => ({ id, title, url }));

    // Persist issues to the Nango cache.
    await nango.batchSave(issues, '${utils_1.model}');
}`;
        }
        else {
            return `integrations:
  ${utils_1.providerConfigKey}:
    syncs:
      sync-github-issues:
        description: Fetches the GitHub issues from showcase repository
        scopes: public_repo
        runs: every 5 minutes
        output: ${utils_1.model}
        endpoint: ${utils_1.endpointSync}
models:
  ${utils_1.model}:
    id: integer
    title: string
    url: string`;
        }
    }, [file]);
    const onDeploy = () => __awaiter(void 0, void 0, void 0, function* () {
        analyticsTrack('web:demo:deploy');
        setLoading(true);
        try {
            // Deploy the provider
            const res = yield (0, api_1.apiFetch)(`/api/v1/onboarding/deploy?env=dev`, {
                method: 'POST'
            });
            if (res.status !== 200) {
                const json = (yield res.json());
                setError(json.message ? json.message : 'An unexpected error occurred');
                analyticsTrack('web:demo:deploy_error');
                return;
            }
            setError(null);
            analyticsTrack('web:demo:deploy_success');
            onProgress();
        }
        catch (err) {
            analyticsTrack('web:demo:deploy_error');
            setError(err instanceof Error ? `error: ${err.message}` : 'An unexpected error occurred');
            return;
        }
        finally {
            setLoading(false);
        }
    });
    return (<Bloc_1.Bloc title="Deploy an integration" subtitle={<>
                    The following script runs on Nango&apos;s infrastructure & syncs GitHub{' '}
                    <a href="https://github.com/NangoHQ/interactive-demo" target="_blank" rel="noreferrer" className="underline">
                        sample issues
                    </a>{' '}
                    to Nango.
                </>} active={step === utils_1.Steps.Authorize} done={step >= utils_1.Steps.Deploy}>
            <div className="border bg-zinc-900 border-zinc-900 rounded-lg text-white text-sm">
                <div className="flex justify-between items-center px-5 py-4 bg-zinc-900 rounded-lg">
                    <div className="space-x-4">
                        <Bloc_1.Tab variant={'zombie'} className={(0, utils_2.cn)('cursor-default', file !== 'github-issues-demo.ts' && 'cursor-pointer bg-zinc-900 pointer-events-auto')} onClick={() => {
            setFile('github-issues-demo.ts');
        }}>
                            ./github-issues-demo.ts <span className="text-zinc-500">(script)</span>
                        </Bloc_1.Tab>
                        <Bloc_1.Tab variant={'zombie'} className={(0, utils_2.cn)('cursor-default', file !== 'nango.yaml' && 'cursor-pointer bg-zinc-900 pointer-events-auto')} onClick={() => {
            setFile('nango.yaml');
        }}>
                            ./nango.yaml <span className="text-zinc-500">(config)</span>
                        </Bloc_1.Tab>
                    </div>
                </div>

                <prism_1.Prism noCopy language={file === 'nango.yaml' ? 'yaml' : 'typescript'} className="p-3 transparent-code bg-black" colorScheme="dark">
                    {snippet}
                </prism_1.Prism>
                <div className="px-6 py-4">
                    {step === utils_1.Steps.Authorize ? (<Button_1.default type="button" variant="primary" onClick={onDeploy} isLoading={loading}>
                            Deploy GitHub integration
                        </Button_1.default>) : (<span className="text-emerald-300 text-sm flex items-center h-9 gap-2">
                            <react_icons_1.CheckCircledIcon className="h-5 w-5"/>
                            Integration deployed!
                        </span>)}
                    {error && <p className="text-sm text-red-500 py-1">{error}</p>}
                </div>
            </div>
        </Bloc_1.Bloc>);
};
exports.DeployBloc = DeployBloc;
//# sourceMappingURL=DeployBloc.js.map