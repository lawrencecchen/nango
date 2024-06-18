"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const core_1 = require("@geist-ui/core");
const outline_1 = require("@heroicons/react/24/outline");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const LeftNavBar_1 = require("../../components/LeftNavBar");
const IntegrationLogo_1 = __importDefault(require("../../components/ui/IntegrationLogo"));
const api_1 = require("../../utils/api");
const store_1 = require("../../store");
const useIntegration_1 = require("../../hooks/useIntegration");
function IntegrationList() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { list: data, error } = (0, useIntegration_1.useListIntegration)(env);
    if (error) {
        (0, api_1.requestErrorToast)();
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Integrations}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    }
    if (!data) {
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Integrations}>
                <core_1.Loading spaceRatio={2.5} className="-top-36"/>
            </DashboardLayout_1.default>);
    }
    const { integrations } = data;
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Integrations}>
            <div className="flex justify-between mb-8 items-center">
                <h2 className="flex text-left text-3xl font-semibold tracking-tight text-white">Integrations</h2>
                {integrations.length > 0 && (<react_router_dom_1.Link to={`/${env}/integration/create`} className="flex items-center mt-auto px-4 h-8 rounded-md text-sm text-black bg-white hover:bg-gray-300">
                        <outline_1.PlusIcon className="flex h-5 w-5 mr-2 text-black"/>
                        Configure New Integration
                    </react_router_dom_1.Link>)}
            </div>
            {(integrations === null || integrations === void 0 ? void 0 : integrations.length) > 0 && (<>
                    <div className="h-fit rounded-md text-white text-sm">
                        <div className="w-full">
                            <div className="flex gap-4 items-center text-[12px] px-2 py-1 bg-active-gray border border-neutral-800 rounded-md justify-between">
                                <div className="w-2/3">Name</div>
                                <div className="w-1/3">Connections</div>
                                <div className="w-24">Active Scripts</div>
                            </div>
                            {integrations === null || integrations === void 0 ? void 0 : integrations.map(({ uniqueKey, provider, connection_count, scripts }) => {
                var _a;
                return (<div key={`tr-${uniqueKey}`} className={`flex gap-4 ${uniqueKey !== ((_a = integrations.at(-1)) === null || _a === void 0 ? void 0 : _a.uniqueKey) ? 'border-b border-border-gray' : ''} min-h-[4em] px-2 justify-between items-center hover:bg-hover-gray cursor-pointer`} onClick={() => {
                        navigate(`/${env}/integration/${uniqueKey}`);
                    }}>
                                    <div className="flex items-center w-2/3 gap-2 py-2 truncate">
                                        <div className="w-10 shrink-0">
                                            <IntegrationLogo_1.default provider={provider} height={7} width={7}/>
                                        </div>
                                        <p className="truncate">{uniqueKey}</p>
                                    </div>
                                    <div className="flex items-center w-1/3">
                                        <p className="">{connection_count}</p>
                                    </div>
                                    <div className="flex items-center w-24">
                                        <p className="">{scripts}</p>
                                    </div>
                                </div>);
            })}
                        </div>
                    </div>
                </>)}
            {(integrations === null || integrations === void 0 ? void 0 : integrations.length) === 0 && (<div className="flex flex-col border border-border-gray rounded-md items-center text-white text-center p-10 py-20">
                    <h2 className="text-2xl text-center w-full">Configure a new integration</h2>
                    <div className="my-2 text-gray-400">Before exchanging data with an external API, you need to configure it on Nango.</div>
                    <react_router_dom_1.Link to={`/${env}/integration/create`} className="flex justify-center w-auto items-center mt-5 px-4 h-10 rounded-md text-sm text-black bg-white hover:bg-gray-300">
                        <span className="flex">
                            <outline_1.PlusIcon className="flex h-5 w-5 mr-2 text-black"/>
                            Configure New Integration
                        </span>
                    </react_router_dom_1.Link>
                </div>)}
        </DashboardLayout_1.default>);
}
exports.default = IntegrationList;
//# sourceMappingURL=List.js.map