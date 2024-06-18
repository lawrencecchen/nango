"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const core_1 = require("@geist-ui/core");
const debounce_1 = __importDefault(require("lodash/debounce"));
const uniq_1 = __importDefault(require("lodash/uniq"));
const outline_1 = require("@heroicons/react/24/outline");
const Input_1 = require("../../components/ui/input/Input");
const useConnections_1 = require("../../hooks/useConnections");
const IntegrationLogo_1 = __importDefault(require("../../components/ui/IntegrationLogo"));
const error_circle_1 = require("../../components/ui/label/error-circle");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const LeftNavBar_1 = require("../../components/LeftNavBar");
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const api_1 = require("../../utils/api");
const MultiSelect_1 = require("../../components/MultiSelect");
const store_1 = require("../../store");
const defaultFilter = ['all'];
function ConnectionList() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { data, error, errorNotifications } = (0, useConnections_1.useConnections)(env);
    const [connections, setConnections] = (0, react_1.useState)(null);
    const [filteredConnections, setFilteredConnections] = (0, react_1.useState)([]);
    const [selectedIntegration, setSelectedIntegration] = (0, react_1.useState)(defaultFilter);
    const [connectionSearch, setConnectionSearch] = (0, react_1.useState)('');
    const [states, setStates] = (0, react_1.useState)(defaultFilter);
    (0, react_1.useEffect)(() => {
        if (data) {
            setConnections(data.connections);
            setFilteredConnections(data.connections);
        }
    }, [data]);
    (0, react_1.useEffect)(() => {
        if (data) {
            let filtered = data.connections;
            if (connectionSearch) {
                filtered = filtered === null || filtered === void 0 ? void 0 : filtered.filter((connection) => connection.connection_id.toLowerCase().includes(connectionSearch.toLowerCase()));
            }
            if (selectedIntegration.length > 0 && !selectedIntegration.includes('all')) {
                filtered = filtered === null || filtered === void 0 ? void 0 : filtered.filter((connection) => selectedIntegration.includes(connection.provider_config_key));
            }
            if (states.length !== 0 && !states.includes('all') && !(states.includes('ok') && states.includes('error'))) {
                if (states.includes('error')) {
                    filtered = filtered === null || filtered === void 0 ? void 0 : filtered.filter((connection) => connection.active_logs);
                }
                if (states.includes('ok')) {
                    filtered = filtered === null || filtered === void 0 ? void 0 : filtered.filter((connection) => !connection.active_logs);
                }
            }
            setFilteredConnections(filtered || []);
        }
    }, [connectionSearch, selectedIntegration, states, data]);
    const debouncedSearch = (0, react_1.useCallback)((0, debounce_1.default)((value) => {
        if (!value.trim()) {
            setConnectionSearch('');
            setFilteredConnections((data === null || data === void 0 ? void 0 : data.connections) || []);
            return;
        }
        setConnectionSearch(value);
    }, 300), [data === null || data === void 0 ? void 0 : data.connections]);
    const handleInputChange = (event) => {
        debouncedSearch(event.currentTarget.value);
    };
    const handleIntegrationChange = (values) => {
        if (values.includes('all')) {
            setSelectedIntegration(defaultFilter);
            return;
        }
        setSelectedIntegration(values);
    };
    (0, react_1.useEffect)(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);
    if (error) {
        (0, api_1.requestErrorToast)();
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    }
    if (!data) {
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    }
    const providers = (0, uniq_1.default)(data['connections'].map((connection) => connection.provider_config_key)).sort();
    function formatDate(creationDate) {
        const inputDate = new Date(creationDate);
        const now = new Date();
        const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
        const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (inputDateOnly.getTime() === nowDateOnly.getTime()) {
            const hours = inputDate.getHours();
            const minutes = inputDate.getMinutes();
            const amPm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12; // Convert to 12-hour format and handle 0 as 12
            return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${amPm}`;
        }
        const diffTime = Math.abs(now.getTime() - inputDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        }
        else {
            return inputDate.toLocaleDateString();
        }
    }
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
            <div className="flex justify-between mb-8 items-center">
                <h2 className="flex text-left text-3xl font-semibold tracking-tight text-white">Connections</h2>
                {connections && connections.length > 0 && (<react_router_dom_1.Link to={`/${env}/connections/create`} className="flex items-center mt-auto px-4 h-8 rounded-md text-sm text-black bg-white hover:bg-gray-300">
                        <outline_1.PlusIcon className="flex h-5 w-5 mr-2 text-black"/>
                        Add Connection
                    </react_router_dom_1.Link>)}
            </div>
            {connections && connections.length > 0 && (<>
                    <div className="flex justify-end w-full text-[12px] text-white">
                        {connections.length} connections{' '}
                        {errorNotifications > 0 && (<span className="flex items-center ml-1">
                                ({errorNotifications} errored)<span className="ml-1 bg-red-base h-1.5 w-1.5 rounded-full"></span>
                            </span>)}
                    </div>
                    <div className="flex gap-2 relative my-3">
                        <div className="flex-grow">
                            <Input_1.Input before={<outline_1.MagnifyingGlassIcon className="w-4"/>} placeholder="Search by ID" className="border-active-gray" onChange={handleInputChange} onKeyUp={handleInputChange}/>
                        </div>
                        <div className="flex">
                            <MultiSelect_1.MultiSelect label="Integrations" options={providers.map((integration) => {
                return { name: integration, value: integration };
            })} selected={selectedIntegration} defaultSelect={defaultFilter} onChange={handleIntegrationChange} all/>
                            <MultiSelect_1.MultiSelect label="Filter Errors" options={[
                { name: 'OK', value: 'ok' },
                { name: 'Error', value: 'error' }
            ]} selected={states} defaultSelect={defaultFilter} onChange={setStates} all/>
                        </div>
                    </div>
                    <div className="h-fit rounded-md text-white text-sm">
                        <div className="w-full">
                            <div className="flex gap-4 items-center text-[12px] px-2 py-1 bg-active-gray border border-neutral-800 rounded-md">
                                <div className="w-2/3">Connection IDs</div>
                                <div className="w-1/3">Integration</div>
                                <div className="w-20">Created</div>
                            </div>
                            {filteredConnections.map(({ id, connection_id: connectionId, provider, provider_config_key: providerConfigKey, created: creationDate, active_logs }) => {
                var _a;
                return (<div key={`tr-${id}`} className={`flex gap-4 ${id !== ((_a = connections.at(-1)) === null || _a === void 0 ? void 0 : _a.id) ? 'border-b border-border-gray' : ''} min-h-[4em] px-2 justify-between items-center hover:bg-hover-gray cursor-pointer`} onClick={() => {
                        navigate(`/${env}/connections/${encodeURIComponent(providerConfigKey)}/${encodeURIComponent(connectionId)}`);
                    }}>
                                        <div className="flex items-center w-2/3 gap-2 py-2 truncate">
                                            <span className="break-words break-all truncate">{connectionId}</span>
                                            {active_logs && <error_circle_1.ErrorCircle />}
                                            <CopyButton_1.default dark text={connectionId}/>
                                        </div>
                                        <div className="flex items-center w-1/3 gap-3">
                                            <div className="w-7">
                                                <IntegrationLogo_1.default provider={provider} height={7} width={7}/>
                                            </div>
                                            <p className="break-words break-all">{providerConfigKey}</p>
                                        </div>
                                        <div className="flex w-20">
                                            <time dateTime={creationDate} title={creationDate}>
                                                {formatDate(creationDate)}
                                            </time>
                                        </div>
                                    </div>);
            })}
                        </div>
                    </div>
                </>)}
            {connections && connections.length === 0 && (<div className="flex flex-col border border-border-gray rounded-md items-center text-white text-center p-10 py-20">
                    <h2 className="text-2xl text-center w-full">Connect to an external API</h2>
                    <div className="my-2 text-gray-400">
                        Connections can be created by using the{' '}
                        <react_router_dom_1.Link to="https://docs.nango.dev/reference/sdks/frontend" className="text-blue-400">
                            nango frontend sdk
                        </react_router_dom_1.Link>
                        , or manually here.
                    </div>
                    <react_router_dom_1.Link to={`/${env}/connections/create`} className="flex justify-center w-auto items-center mt-5 px-4 h-10 rounded-md text-sm text-black bg-white hover:bg-gray-300">
                        <span className="flex">
                            <outline_1.PlusIcon className="flex h-5 w-5 mr-2 text-black"/>
                            Add Connection
                        </span>
                    </react_router_dom_1.Link>
                </div>)}
        </DashboardLayout_1.default>);
}
exports.default = ConnectionList;
//# sourceMappingURL=List.js.map