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
exports.InteractiveDemo = void 0;
const react_1 = require("react");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const LeftNavBar_1 = require("../../components/LeftNavBar");
const store_1 = require("../../store");
const analytics_1 = require("../../utils/analytics");
const AuthorizeBloc_1 = require("./AuthorizeBloc");
const FetchBloc_1 = require("./FetchBloc");
const utils_1 = require("./utils");
const NextBloc_1 = require("./NextBloc");
const ActionBloc_1 = require("./ActionBloc");
const WebhookBloc_1 = require("./WebhookBloc");
const DeployBloc_1 = require("./DeployBloc");
const Spinner_1 = __importDefault(require("../../components/ui/Spinner"));
const useEnvironment_1 = require("../../hooks/useEnvironment");
const api_1 = require("../../utils/api");
const InteractiveDemo = () => {
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [initialLoad, setInitialLoad] = (0, react_1.useState)(false);
    const [step, setStep] = (0, react_1.useState)(utils_1.Steps.Start);
    const [connectionId, setConnectionId] = (0, react_1.useState)('');
    const [onboardingId, setOnboardingId] = (0, react_1.useState)();
    const [records, setRecords] = (0, react_1.useState)([]);
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { environmentAndAccount } = (0, useEnvironment_1.useEnvironment)(env);
    (0, react_1.useEffect)(() => {
        if (!environmentAndAccount) {
            return;
        }
        const { email } = environmentAndAccount;
        let strippedEmail = email.includes('@') ? email.split('@')[0] : email;
        strippedEmail = strippedEmail.replace(/[^a-zA-Z0-9]/g, '_');
        setConnectionId(strippedEmail);
        setLoaded(true);
    }, [setLoaded, setConnectionId, environmentAndAccount]);
    (0, react_1.useEffect)(() => {
        const getProgress = () => __awaiter(void 0, void 0, void 0, function* () {
            const params = {
                env,
                connection_id: connectionId
            };
            const res = yield (0, api_1.apiFetch)(`/api/v1/onboarding?${new URLSearchParams(params).toString()}`, {
                method: 'GET'
            });
            setInitialLoad(true);
            if (res.status !== 200) {
                return;
            }
            const json = (yield res.json());
            if ('error' in json) {
                return;
            }
            setStep(json.progress || 0);
            setOnboardingId(json.id);
            if (json.records) {
                setRecords(json.records);
            }
        });
        if (connectionId) {
            void getProgress();
        }
    }, [setInitialLoad, connectionId, env]);
    const updateProgress = (args) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, api_1.apiFetch)(`/api/v1/onboarding?env=${env}`, {
            method: 'PUT',
            body: JSON.stringify({ progress: args.progress })
        });
        if (!res.ok) {
            return;
        }
    });
    (0, react_1.useEffect)(() => {
        if (!onboardingId) {
            return;
        }
        void updateProgress({ progress: step });
    }, [onboardingId, step, env]);
    const onAuthorize = (id) => {
        setOnboardingId(id);
        setStep(utils_1.Steps.Authorize);
        setTimeout(() => {
            var _a;
            (_a = document.getElementById('demo-deploy')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500); // Wait for the popup to close
    };
    const onDeploy = () => {
        setStep(utils_1.Steps.Deploy);
        setTimeout(() => {
            var _a;
            (_a = document.getElementById('demo-webhook')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 16);
    };
    const onWebhookConfirm = () => {
        analyticsTrack('web:demo:webhook');
        setStep(utils_1.Steps.Webhooks);
        setTimeout(() => {
            var _a;
            (_a = document.getElementById('demo-fetch')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 16);
    };
    const onFetch = (records) => {
        setStep(utils_1.Steps.Fetch);
        setRecords(records);
        // We don't scroll automatically to let users check their records
    };
    const onActionConfirm = () => {
        setStep(utils_1.Steps.Write);
        setTimeout(() => {
            var _a;
            (_a = document.getElementById('demo-next')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 16);
    };
    const onClickNext = () => {
        analyticsTrack('web:demo:next');
        setStep(utils_1.Steps.Complete);
    };
    const resetOnboarding = () => {
        setStep(utils_1.Steps.Start);
    };
    if (!environmentAndAccount) {
        return null;
    }
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.InteractiveDemo}>
            <div className="text-white pb-10">
                <div>
                    <h1 className="text-left text-3xl font-semibold tracking-tight text-white flex items-center gap-4">
                        <span onDoubleClick={resetOnboarding}>Interactive Demo </span>
                        {(!loaded || !initialLoad) && <Spinner_1.default size={1.2}/>}
                    </h1>
                    <h2 className="mt-2 text-sm text-zinc-400">Using GitHub as an example, discover how to integrate with Nango in 3 minutes.</h2>
                </div>
                <div className="flex flex-col gap-8 mt-10">
                    {loaded && initialLoad && (<>
                            <AuthorizeBloc_1.AuthorizeBloc step={step} connectionId={connectionId} hostUrl={environmentAndAccount.host} providerConfigKey={utils_1.providerConfigKey} publicKey={environmentAndAccount.environment.public_key} onProgress={onAuthorize}/>

                            <div id="demo-deploy">
                                <DeployBloc_1.DeployBloc step={step} onProgress={onDeploy}/>
                            </div>

                            <div id="demo-webhook">
                                <WebhookBloc_1.WebhookBloc step={step} connectionId={connectionId} records={records} onProgress={onWebhookConfirm}/>
                            </div>

                            <div id="demo-fetch">
                                <FetchBloc_1.FetchBloc step={step} connectionId={connectionId} providerConfigKey={utils_1.providerConfigKey} secretKey={environmentAndAccount.environment.secret_key} records={records} onProgress={onFetch}/>
                            </div>

                            <div id="demo-action">
                                <ActionBloc_1.ActionBloc step={step} connectionId={connectionId} providerConfigKey={utils_1.providerConfigKey} secretKey={environmentAndAccount.environment.secret_key} onProgress={onActionConfirm}/>
                            </div>

                            <div id="demo-next">{step >= utils_1.Steps.Write && <NextBloc_1.NextBloc onProgress={onClickNext}/>}</div>
                        </>)}
                </div>
            </div>
        </DashboardLayout_1.default>);
};
exports.InteractiveDemo = InteractiveDemo;
//# sourceMappingURL=index.js.map