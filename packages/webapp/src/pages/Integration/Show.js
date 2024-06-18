"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubTabs = exports.Tabs = void 0;
const react_router_dom_1 = require("react-router-dom");
const core_1 = require("@geist-ui/core");
const react_1 = require("react");
const swr_1 = __importDefault(require("swr"));
const outline_1 = require("@heroicons/react/24/outline");
const LeftNavBar_1 = require("../../components/LeftNavBar");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const APIReference_1 = __importDefault(require("./APIReference"));
const EndpointReference_1 = __importDefault(require("./EndpointReference"));
const FlowPage_1 = __importDefault(require("./FlowPage"));
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const IntegrationLogo_1 = __importDefault(require("../../components/ui/IntegrationLogo"));
const Scripts_1 = __importDefault(require("./Scripts"));
const AuthSettings_1 = __importDefault(require("./AuthSettings"));
const utils_1 = require("../../utils/utils");
const store_1 = require("../../store");
const api_1 = require("../../utils/api");
const PageNotFound_1 = __importDefault(require("../PageNotFound"));
const useEnvironment_1 = require("../../hooks/useEnvironment");
var Tabs;
(function (Tabs) {
    Tabs[Tabs["API"] = 0] = "API";
    Tabs[Tabs["Scripts"] = 1] = "Scripts";
    Tabs[Tabs["Auth"] = 2] = "Auth";
})(Tabs = exports.Tabs || (exports.Tabs = {}));
var SubTabs;
(function (SubTabs) {
    SubTabs[SubTabs["Reference"] = 0] = "Reference";
    SubTabs[SubTabs["Flow"] = 1] = "Flow";
})(SubTabs = exports.SubTabs || (exports.SubTabs = {}));
function ShowIntegration() {
    const { providerConfigKey } = (0, react_router_dom_1.useParams)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { data, error, mutate } = (0, swr_1.default)(`/api/v1/integration/${providerConfigKey}?include_creds=true&include_flows=true&env=${env}`);
    const { environmentAndAccount, error: environmentError } = (0, useEnvironment_1.useEnvironment)(env);
    const [activeTab, setActiveTab] = (0, react_1.useState)((0, utils_1.isHosted)() ? Tabs.Auth : Tabs.API);
    const [subTab, setSubTab] = (0, react_1.useState)(null);
    const [currentFlow, setCurrentFlow] = (0, react_1.useState)(null);
    const [endpoint, setEndpoint] = (0, react_1.useState)(null);
    const [flowConfig, setFlowConfig] = (0, react_1.useState)(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    (0, react_1.useEffect)(() => {
        if (location.hash === '#api') {
            setActiveTab(Tabs.API);
        }
        if (location.hash === '#scripts') {
            setActiveTab(Tabs.Scripts);
        }
        if (location.hash === '#auth') {
            setActiveTab(Tabs.Auth);
        }
    }, [location]);
    if (data === null || data === void 0 ? void 0 : data.error) {
        return <PageNotFound_1.default />;
    }
    if (error || environmentError) {
        (0, api_1.requestErrorToast)();
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    }
    if (!data || !environmentAndAccount)
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Integrations}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    const { config: integration, flows: endpoints } = data;
    const showDocs = () => {
        window.open(integration === null || integration === void 0 ? void 0 : integration.docs, '_blank');
    };
    const updateTab = (tab) => {
        setActiveTab(tab);
        setSubTab(null);
    };
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Integrations}>
            <div className="mx-auto">
                <div className="flex gap-4 justify-between">
                    <div className="flex gap-6">
                        <div className="shrink-0 ">
                            <IntegrationLogo_1.default provider={integration === null || integration === void 0 ? void 0 : integration.provider} height={24} width={24} classNames="p-1 border border-border-gray rounded-xl"/>
                        </div>
                        <div className="mt-3">
                            <span className="text-left text-xl font-semibold tracking-tight text-gray-400">Integration</span>
                            <div className="flex gap-4">
                                <h2 className="text-left text-3xl font-semibold tracking-tight text-white break-all">{providerConfigKey}</h2>
                                <outline_1.BookOpenIcon onClick={() => showDocs()} className="mt-1.5 h-8 w-8 text-gray-400 cursor-pointer hover:text-white shrink-0"/>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <Button_1.default variant="zinc" size="sm" className="flex cursor-pointer text-gray-400 neutral-700 items-center mt-4" onClick={() => {
            navigate(`/${env}/connections/create/${providerConfigKey}`);
        }}>
                            <outline_1.LinkIcon className="flex h-5 w-5"/>
                            <span className="px-1">Add Connection</span>
                        </Button_1.default>
                    </div>
                </div>
            </div>
            <section className="mt-14">
                <ul className="flex text-gray-400 space-x-2 text-sm cursor-pointer">
                    <li className={`p-2 rounded ${activeTab === Tabs.API ? 'bg-active-gray text-white' : 'hover:bg-hover-gray'}`} onClick={() => updateTab(Tabs.API)}>
                        API Reference
                    </li>
                    <li className={`p-2 rounded ${activeTab === Tabs.Scripts ? 'bg-active-gray text-white' : 'hover:bg-hover-gray'}`} onClick={() => updateTab(Tabs.Scripts)}>
                        Scripts
                    </li>
                    <li className={`p-2 rounded ${activeTab === Tabs.Auth ? 'bg-active-gray text-white' : 'hover:bg-hover-gray'}`} onClick={() => setActiveTab(Tabs.Auth)}>
                        Settings
                    </li>
                </ul>
            </section>
            <section className="mt-10">
                {activeTab === Tabs.API && integration && endpoints && (<>
                        {subTab === SubTabs.Reference ? (<EndpointReference_1.default environment={environmentAndAccount.environment} integration={integration} activeFlow={currentFlow} activeEndpoint={endpoint} setActiveTab={setActiveTab} setSubTab={setSubTab}/>) : (<APIReference_1.default integration={integration} setActiveTab={setActiveTab} endpoints={endpoints} environment={environmentAndAccount.environment} setSubTab={setSubTab} setFlow={setCurrentFlow} setEndpoint={setEndpoint}/>)}
                    </>)}
                {activeTab === Tabs.Scripts && integration && endpoints && (<>
                        {subTab === SubTabs.Flow ? (<FlowPage_1.default integration={integration} environment={environmentAndAccount.environment} flow={currentFlow} flowConfig={flowConfig} reload={() => mutate()} endpoints={endpoints} setFlow={setCurrentFlow} setActiveTab={setActiveTab} setSubTab={setSubTab}/>) : (<Scripts_1.default integration={integration} endpoints={endpoints} reload={() => mutate()} setFlow={setCurrentFlow} setFlowConfig={setFlowConfig} setSubTab={setSubTab}/>)}
                    </>)}
                {activeTab === Tabs.Auth && integration && (environmentAndAccount === null || environmentAndAccount === void 0 ? void 0 : environmentAndAccount.environment) && (<AuthSettings_1.default integration={integration} environment={environmentAndAccount.environment}/>)}
            </section>
        </DashboardLayout_1.default>);
}
exports.default = ShowIntegration;
//# sourceMappingURL=Show.js.map