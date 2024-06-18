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
exports.Tabs = void 0;
const react_router_dom_1 = require("react-router-dom");
const react_helmet_1 = require("react-helmet");
const core_1 = require("@geist-ui/core");
const react_1 = require("react");
const react_toastify_1 = require("react-toastify");
const swr_1 = __importStar(require("swr"));
const outline_1 = require("@heroicons/react/24/outline");
const api_1 = require("../../utils/api");
const LeftNavBar_1 = require("../../components/LeftNavBar");
const ActionModal_1 = __importDefault(require("../../components/ui/ActionModal"));
const error_circle_1 = require("../../components/ui/label/error-circle");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const Info_1 = __importDefault(require("../../components/ui/Info"));
const IntegrationLogo_1 = __importDefault(require("../../components/ui/IntegrationLogo"));
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const useEnvironment_1 = require("../../hooks/useEnvironment");
const Syncs_1 = __importDefault(require("./Syncs"));
const Authorization_1 = __importDefault(require("./Authorization"));
const PageNotFound_1 = __importDefault(require("../PageNotFound"));
const utils_1 = require("../../utils/utils");
const slack_connection_1 = require("../../utils/slack-connection");
const store_1 = require("../../store");
const logs_1 = require("../../utils/logs");
var Tabs;
(function (Tabs) {
    Tabs[Tabs["Syncs"] = 0] = "Syncs";
    Tabs[Tabs["Authorization"] = 1] = "Authorization";
})(Tabs = exports.Tabs || (exports.Tabs = {}));
function ShowIntegration() {
    var _a;
    const { mutate } = (0, swr_1.useSWRConfig)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { environmentAndAccount, mutate: environmentMutate } = (0, useEnvironment_1.useEnvironment)(env);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [connectionResponse, setConnectionResponse] = (0, react_1.useState)(null);
    const [slackIsConnecting, setSlackIsConnecting] = (0, react_1.useState)(false);
    const [, setFetchingRefreshToken] = (0, react_1.useState)(false);
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [modalShowSpinner, setModalShowSpinner] = (0, react_1.useState)(false);
    const [pageNotFound, setPageNotFound] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)(Tabs.Syncs);
    const [slackIsConnected, setSlackIsConnected] = (0, react_1.useState)(true);
    const getConnectionDetailsAPI = (0, api_1.useGetConnectionDetailsAPI)(env);
    const deleteConnectionAPI = (0, api_1.useDeleteConnectionAPI)(env);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    const { setVisible, bindings } = (0, core_1.useModal)();
    const { connectionId, providerConfigKey } = (0, react_router_dom_1.useParams)();
    const { data: syncs, isLoading: syncLoading, error: syncLoadError, mutate: reload } = (0, swr_1.default)(`/api/v1/sync?env=${env}&connection_id=${connectionId}&provider_config_key=${providerConfigKey}`, api_1.swrFetcher, {
        refreshInterval: 10000,
        keepPreviousData: false
    });
    (0, react_1.useEffect)(() => {
        if (syncLoadError) {
            (0, api_1.requestErrorToast)();
        }
    }, [syncLoadError]);
    (0, react_1.useEffect)(() => {
        if (environmentAndAccount) {
            setSlackIsConnected(environmentAndAccount.environment.slack_notifications);
        }
    }, [environmentAndAccount]);
    (0, react_1.useEffect)(() => {
        if (location.hash === '#models' || location.hash === '#syncs') {
            setActiveTab(Tabs.Syncs);
        }
        if (location.hash === '#authorization' || (0, utils_1.isHosted)()) {
            setActiveTab(Tabs.Authorization);
        }
    }, [location]);
    (0, react_1.useEffect)(() => {
        if (!connectionId || !providerConfigKey)
            return;
        const getConnections = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getConnectionDetailsAPI(connectionId, providerConfigKey, false);
            if ((res === null || res === void 0 ? void 0 : res.status) === 404) {
                setPageNotFound(true);
            }
            else if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const data = yield res.json();
                setConnectionResponse(data);
            }
            else if ((res === null || res === void 0 ? void 0 : res.status) === 400) {
                const data = yield res.json();
                if (data.connection) {
                    setConnectionResponse(data);
                }
            }
            else if (res != null) {
                setServerErrorMessage(`
We could not retrieve and/or refresh your access token due to the following error:
\n\n${(yield res.json()).error}
`);
                setConnectionResponse({
                    errorLog: null,
                    provider: null,
                    connection: {
                        provider_config_key: providerConfigKey,
                        connection_id: connectionId
                    }
                });
            }
        });
        if (!loaded) {
            setLoaded(true);
            getConnections();
        }
    }, [connectionId, providerConfigKey, getConnectionDetailsAPI, loaded, setLoaded]);
    const deleteButtonClicked = () => __awaiter(this, void 0, void 0, function* () {
        if (!connectionId || !providerConfigKey)
            return;
        setModalShowSpinner(true);
        const res = yield deleteConnectionAPI(connectionId, providerConfigKey);
        setModalShowSpinner(false);
        if ((res === null || res === void 0 ? void 0 : res.status) === 204) {
            react_toastify_1.toast.success('Connection deleted!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            void mutate((key) => typeof key === 'string' && key.startsWith('/api/v1/connection'), undefined);
            navigate(`/${env}/connections`, { replace: true });
        }
    });
    const forceRefresh = () => __awaiter(this, void 0, void 0, function* () {
        if (!connectionId || !providerConfigKey)
            return;
        setFetchingRefreshToken(true);
        const res = yield getConnectionDetailsAPI(connectionId, providerConfigKey, true);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            const data = yield res.json();
            setConnectionResponse(data);
            react_toastify_1.toast.success('Token refresh success!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else if (res != null) {
            react_toastify_1.toast.error('Failed to refresh token!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        setTimeout(() => {
            setFetchingRefreshToken(false);
        }, 400);
    });
    const createSlackConnection = () => __awaiter(this, void 0, void 0, function* () {
        setSlackIsConnecting(true);
        if (!environmentAndAccount)
            return;
        const { uuid: accountUUID, host: hostUrl } = environmentAndAccount;
        const onFinish = () => {
            environmentMutate();
            react_toastify_1.toast.success('Slack connection created!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setSlackIsConnecting(false);
        };
        const onFailure = () => {
            react_toastify_1.toast.error('Failed to create Slack connection!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setSlackIsConnecting(false);
        };
        yield (0, slack_connection_1.connectSlack)({ accountUUID, env, hostUrl, onFinish, onFailure });
    });
    if (pageNotFound) {
        return <PageNotFound_1.default />;
    }
    if (!loaded || syncLoading || !connectionResponse) {
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    }
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
            <ActionModal_1.default bindings={bindings} modalTitle="Delete connection?" modalContent="All credentials & synced data associated with this connection will be deleted." modalAction={() => deleteButtonClicked()} modalShowSpinner={modalShowSpinner} modalTitleColor="text-red-500" setVisible={setVisible}/>
            <div className="mx-auto">
                <div className="flex gap-4 justify-between">
                    <div className="flex gap-6">
                        <react_router_dom_1.Link to={`/${env}/integration/${connectionResponse.connection.provider_config_key}`}>
                            {(connectionResponse === null || connectionResponse === void 0 ? void 0 : connectionResponse.provider) && (<IntegrationLogo_1.default provider={connectionResponse.provider} height={24} width={24} classNames="cursor-pointer p-1 border border-border-gray rounded-xl"/>)}
                        </react_router_dom_1.Link>
                        <div className="mt-3">
                            <span className="text-left text-xl font-semibold tracking-tight text-gray-400 mb-12">Connection</span>
                            <h2 className="text-left text-3xl font-semibold tracking-tight text-white break-all">{connectionId}</h2>
                        </div>
                    </div>
                    <Button_1.default variant="zinc" size="sm" className="flex cursor-pointer text-gray-400 neutral-700 items-center mt-4" onClick={() => {
            setVisible(true);
        }}>
                        <outline_1.TrashIcon className="flex h-5 w-5"/>
                        <span className="px-1">Delete</span>
                    </Button_1.default>
                </div>
            </div>

            <section className="mt-14">
                <ul className="flex text-gray-400 space-x-2 font-semibold text-sm cursor-pointer">
                    <li className={`flex items-center p-2 rounded ${activeTab === Tabs.Syncs ? 'bg-active-gray text-white' : 'hover:bg-hover-gray'}`} onClick={() => setActiveTab(Tabs.Syncs)}>
                        Syncs
                        {syncs && syncs.find((sync) => { var _a; return typeof ((_a = sync.active_logs) === null || _a === void 0 ? void 0 : _a.activity_log_id) === 'number'; }) && (<span className="ml-2 bg-red-base h-1.5 w-1.5 rounded-full inline-block"></span>)}
                    </li>
                    <li className={`flex items-center p-2 rounded ${activeTab === Tabs.Authorization ? 'bg-active-gray text-white' : 'hover:bg-hover-gray'}`} onClick={() => setActiveTab(Tabs.Authorization)}>
                        Authorization
                        {connectionResponse.errorLog && <span className="ml-2 bg-red-base h-1.5 w-1.5 rounded-full inline-block"></span>}
                    </li>
                </ul>
            </section>

            {serverErrorMessage && (<div className="flex my-4">
                    <Info_1.default showIcon={false} size={14} padding="py-1 px-1 py-1" color="red">
                        <div className="flex items-center text-sm">
                            <error_circle_1.ErrorCircle />
                            <span className="ml-2">{serverErrorMessage}</span>
                        </div>
                    </Info_1.default>
                </div>)}

            {activeTab === Tabs.Authorization && connectionResponse.errorLog && (<div className="flex my-4">
                    <Info_1.default showIcon={false} size={14} padding="py-1 px-1" color="red">
                        <div className="flex items-center text-sm">
                            <error_circle_1.ErrorCircle />
                            <span className="ml-2">There was an error refreshing the credentials</span>
                            <react_router_dom_1.Link to={(0, logs_1.getLogsUrl)({
                env,
                operationId: connectionResponse.errorLog.activity_log_id,
                connections: connectionResponse.connection.connection_id,
                day: (_a = connectionResponse.errorLog) === null || _a === void 0 ? void 0 : _a.created_at
            })} className="ml-1 cursor-pointer underline">
                                (logs).
                            </react_router_dom_1.Link>
                        </div>
                    </Info_1.default>
                </div>)}

            {activeTab === Tabs.Syncs && syncs && syncs.find((sync) => { var _a; return typeof ((_a = sync.active_logs) === null || _a === void 0 ? void 0 : _a.activity_log_id) === 'number'; }) && (<div className="flex my-4">
                    <Info_1.default showIcon={false} size={14} padding="py-1 px-1" color="red">
                        <div className="flex items-center text-sm">
                            <error_circle_1.ErrorCircle />
                            <span className="ml-2">
                                Last sync execution failed for the following sync
                                {syncs.filter((sync) => { var _a; return typeof ((_a = sync.active_logs) === null || _a === void 0 ? void 0 : _a.activity_log_id) === 'number'; }).length > 1 ? 's' : ''}:{' '}
                                {syncs
                .filter((sync) => { var _a; return typeof ((_a = sync.active_logs) === null || _a === void 0 ? void 0 : _a.activity_log_id) === 'number'; })
                .map((sync, index) => {
                var _a;
                return (<react_1.Fragment key={sync.name}>
                                            {sync.name} (
                                            <react_router_dom_1.Link className="underline" to={(0, logs_1.getLogsUrl)({ env, operationId: (_a = sync.active_logs) === null || _a === void 0 ? void 0 : _a.activity_log_id, syncs: sync.name })}>
                                                logs
                                            </react_router_dom_1.Link>
                                            ){index < syncs.filter((sync) => { var _a; return typeof ((_a = sync.active_logs) === null || _a === void 0 ? void 0 : _a.activity_log_id) === 'number'; }).length - 1 && ', '}
                                        </react_1.Fragment>);
            })}
                                .
                            </span>
                        </div>
                    </Info_1.default>
                </div>)}

            {!slackIsConnected && !(0, utils_1.isHosted)() && (<Info_1.default size={14} color="blue" showIcon={false} padding="mt-7 p-1 py-1">
                    <div className="flex text-sm items-center">
                        <IntegrationLogo_1.default provider="slack" height={6} width={6} classNames="flex mr-2"/>
                        Receive instant monitoring alerts on Slack.{' '}
                        <button disabled={slackIsConnecting} onClick={createSlackConnection} className={`ml-1 ${!slackIsConnecting ? 'cursor-pointer underline' : 'text-text-light-gray'}`}>
                            Set up now for the {env} environment.
                        </button>
                    </div>
                </Info_1.default>)}

            <section className="mt-10">
                {activeTab === Tabs.Syncs && (<Syncs_1.default syncs={syncs} connection={connectionResponse.connection} provider={connectionResponse.provider} reload={reload} loaded={loaded} syncLoaded={!syncLoading} env={env}/>)}
                {activeTab === Tabs.Authorization && (<Authorization_1.default connection={connectionResponse.connection} forceRefresh={forceRefresh} loaded={loaded} syncLoaded={!syncLoading}/>)}
            </section>
            <react_helmet_1.Helmet>
                <style>{'.no-border-modal footer { border-top: none !important; }'}</style>
            </react_helmet_1.Helmet>
        </DashboardLayout_1.default>);
}
exports.default = ShowIntegration;
//# sourceMappingURL=Show.js.map