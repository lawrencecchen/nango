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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeftNavBarItems = void 0;
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const outline_1 = require("@heroicons/react/24/outline");
const react_icons_1 = require("@radix-ui/react-icons");
const store_1 = require("../store");
const utils_1 = require("../utils/utils");
const useMeta_1 = require("../hooks/useMeta");
const user_1 = require("../utils/user");
const useEnvironment_1 = require("../hooks/useEnvironment");
const useConnections_1 = require("../hooks/useConnections");
var LeftNavBarItems;
(function (LeftNavBarItems) {
    LeftNavBarItems[LeftNavBarItems["Integrations"] = 0] = "Integrations";
    LeftNavBarItems[LeftNavBarItems["Connections"] = 1] = "Connections";
    LeftNavBarItems[LeftNavBarItems["EnvironmentSettings"] = 2] = "EnvironmentSettings";
    LeftNavBarItems[LeftNavBarItems["Syncs"] = 3] = "Syncs";
    LeftNavBarItems[LeftNavBarItems["AccountSettings"] = 4] = "AccountSettings";
    LeftNavBarItems[LeftNavBarItems["UserSettings"] = 5] = "UserSettings";
    LeftNavBarItems[LeftNavBarItems["InteractiveDemo"] = 6] = "InteractiveDemo";
    LeftNavBarItems[LeftNavBarItems["Logs"] = 7] = "Logs";
})(LeftNavBarItems = exports.LeftNavBarItems || (exports.LeftNavBarItems = {}));
const navTextColor = 'text-gray-400';
const navActiveBg = 'bg-active-gray';
const navHoverBg = 'hover:bg-hover-gray';
function LeftNavBar(props) {
    const [showUserSettings, setShowUserSettings] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const signout = (0, user_1.useSignout)();
    const { meta } = (0, useMeta_1.useMeta)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { errorNotifications } = (0, useConnections_1.useConnections)(env);
    const setEnv = (0, store_1.useStore)((state) => state.setEnv);
    const email = (0, store_1.useStore)((state) => state.email);
    const { mutate } = (0, useEnvironment_1.useEnvironment)(env);
    const showInteractiveDemo = (0, store_1.useStore)((state) => state.showInteractiveDemo);
    (0, react_1.useEffect)(() => {
        const closeUserSettings = (e) => {
            if (showUserSettings && !e.target.closest('.user-settings')) {
                setShowUserSettings(false);
            }
        };
        document.addEventListener('click', closeUserSettings);
        return () => {
            document.removeEventListener('click', closeUserSettings);
        };
    }, [showUserSettings]);
    const handleEnvChange = (e) => {
        const newEnv = e.target.value;
        setEnv(newEnv);
        void mutate();
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        pathSegments[0] = newEnv;
        let newPath = `/${pathSegments.join('/')}`;
        // If on 'integration' or 'connections' subpages beyond the second level, redirect to their parent page
        if (pathSegments[1] === 'integration' && pathSegments.length > 2) {
            newPath = `/${newEnv}/integrations`;
        }
        else if (pathSegments[1] === 'connections' && pathSegments.length > 2) {
            newPath = `/${newEnv}/connections`;
        }
        navigate(newPath);
    };
    if (!meta) {
        return null;
    }
    return (<div className="bg-pure-black h-screen w-full">
            <div className="flex-1 ml-3 pr-4 h-full border-r border-border-gray flex flex-col bg-pure-black z-20 justify-between">
                <div className="mt-4">
                    <div className="flex items-center mb-8">
                        <img className="h-6" src="/logo-dark.svg" alt="Nango"/>
                        <img className="mt-1 h-5 ml-1" src="/logo-text.svg" alt="Nango"/>
                        <span className="ml-3 text-xs text-black mono">{meta.version}</span>
                    </div>
                    {meta.environments.length === 0 && (<div className="mb-8">
                            <select className="border-border-gray bg-active-gray text-text-light-gray block w-full appearance-none rounded-md border px-3 py-2 shadow-sm active:outline-none focus:outline-none active:border-white focus:border-white"></select>
                        </div>)}
                    {meta.environments.length > 0 && (<div className="mb-6">
                            <select id="environment" name="env" className="border-border-gray bg-active-gray text-sm text-white block w-full appearance-none rounded-md border px-3 py-1 shadow-sm active:outline-none focus:outline-none active:border-white focus:border-white" onChange={handleEnvChange} value={env}>
                                {meta.environments.map((env) => (<option key={env.name} value={env.name}>
                                        {env.name.slice(0, 1).toUpperCase() + env.name.slice(1)}
                                    </option>))}
                            </select>
                        </div>)}
                    <div className="space-y-1">
                        {showInteractiveDemo && !meta.onboardingComplete && (<react_router_dom_1.Link to="/dev/interactive-demo" className={`flex h-9 p-2 gap-x-3 items-center rounded-md text-sm ${navTextColor} ${props.selectedItem === LeftNavBarItems.InteractiveDemo ? `${navActiveBg} text-white` : `text-gray-400 ${navHoverBg}`}`}>
                                <react_icons_1.RocketIcon />
                                <p>Interactive Demo</p>
                            </react_router_dom_1.Link>)}
                        <react_router_dom_1.Link to={`/${env}/integrations`} className={`flex h-9 p-2 gap-x-3 items-center rounded-md text-sm ${navTextColor} ${props.selectedItem === LeftNavBarItems.Integrations ? `${navActiveBg} text-white` : `text-gray-400 ${navHoverBg}`}`}>
                            <outline_1.SquaresPlusIcon className={`flex h-5 w-5 ${props.selectedItem === LeftNavBarItems.Integrations ? 'text-white' : 'text-gray-400'}`}/>
                            <p>Integrations</p>
                        </react_router_dom_1.Link>
                        <react_router_dom_1.Link to={`/${env}/connections`} className={`flex h-9 p-2 gap-x-3 items-center rounded-md relative text-sm ${navTextColor} ${props.selectedItem === LeftNavBarItems.Connections ? `${navActiveBg} text-white` : `text-gray-400 ${navHoverBg}`}`}>
                            <outline_1.LinkIcon className={`flex h-5 w-5 ${props.selectedItem === LeftNavBarItems.Connections ? 'text-white' : 'text-gray-400'}`}/>
                            {errorNotifications > 0 && <span className="absolute top-[9.5px] left-[23px] bg-red-base h-1.5 w-1.5 rounded-full"></span>}
                            <p>Connections</p>
                        </react_router_dom_1.Link>
                        <react_router_dom_1.Link to={`/${env}/logs`} className={`flex h-9 p-2 gap-x-3 items-center rounded-md text-sm ${navTextColor} ${props.selectedItem === LeftNavBarItems.Logs ? `${navActiveBg} text-white` : `text-gray-400 ${navHoverBg}`}`}>
                            <outline_1.QueueListIcon className={`flex h-5 w-5 ${props.selectedItem === LeftNavBarItems.Logs ? 'text-white' : 'text-gray-400'}`}/>
                            <p className="flex gap-4 items-center">Logs</p>
                        </react_router_dom_1.Link>
                        <react_router_dom_1.Link to={`/${env}/environment-settings`} className={`flex h-9 p-2 gap-x-3 items-center rounded-md text-sm ${navTextColor} ${props.selectedItem === LeftNavBarItems.EnvironmentSettings ? `${navActiveBg} text-white` : `text-gray-400 ${navHoverBg}`}`}>
                            <outline_1.AdjustmentsHorizontalIcon className={`flex h-5 w-5 ${props.selectedItem === LeftNavBarItems.EnvironmentSettings ? 'text-white' : 'text-gray-400'}`}/>
                            <p>Environment Settings</p>
                        </react_router_dom_1.Link>
                    </div>
                </div>
                <div>
                    {email && (<div className="flex mb-5 py-2 w-full user-settings px-2 justify-between relative rounded items-center hover:bg-hover-gray cursor-pointer" onClick={() => setShowUserSettings(!showUserSettings)}>
                            <div className="flex items-center">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-transparent text-sm border border-gray-400 text-gray-400 mr-3">
                                    {email.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="items-center w-32 text-gray-400 justify-center text-left text-sm truncate">{email}</span>
                            </div>
                            <outline_1.EllipsisHorizontalIcon className="flex h-5 w-5 ml-3 text-gray-400 cursor-pointer"/>
                            {((0, utils_1.isCloud)() || (0, utils_1.isEnterprise)() || (0, utils_1.isLocal)()) && showUserSettings && (<div className="absolute -top-[140px] text-sm left-0 group-hover:block border border-neutral-700 w-[223px] bg-pure-black z-10 rounded">
                                    <ul className="text-gray-400 space-y-1 p-0.5 px-1">
                                        <li className={`flex items-center w-full px-2 py-2.5 hover:text-white hover:bg-hover-gray rounded p-1 ${props.selectedItem === LeftNavBarItems.UserSettings ? 'text-white bg-active-gray' : ''}`} onClick={() => navigate(`/${env}/user-settings`)}>
                                            <outline_1.UserCircleIcon className="h-5 w-5 mr-2"/>
                                            <span>Profile</span>
                                        </li>
                                        <li className={`flex items-center w-full px-2 py-2.5 hover:text-white hover:bg-hover-gray rounded p-1 ${props.selectedItem === LeftNavBarItems.AccountSettings ? 'text-white bg-active-gray' : ''}`} onClick={() => navigate(`/${env}/account-settings`)}>
                                            <outline_1.UserGroupIcon className="h-5 w-5 mr-2"/>
                                            <span>Team</span>
                                        </li>

                                        {showInteractiveDemo && meta.onboardingComplete && (<react_router_dom_1.Link to="/dev/interactive-demo" className={`flex h-9 p-2 gap-x-3 items-center rounded-md text-sm ${navTextColor} ${props.selectedItem === LeftNavBarItems.InteractiveDemo
                        ? `${navActiveBg} text-white`
                        : `text-gray-400 ${navHoverBg}`}`}>
                                                <react_icons_1.RocketIcon />
                                                <p>Interactive Demo</p>
                                            </react_router_dom_1.Link>)}
                                        <li className="flex items-center w-full px-2 py-2.5 hover:text-white hover:bg-hover-gray rounded p-1" onClick={() => __awaiter(this, void 0, void 0, function* () { return yield signout(); })}>
                                            <outline_1.ArrowRightOnRectangleIcon className="h-5 w-5 mr-2"/>
                                            <span>Log Out</span>
                                        </li>
                                    </ul>
                                </div>)}
                        </div>)}
                </div>
            </div>
        </div>);
}
exports.default = LeftNavBar;
//# sourceMappingURL=LeftNavBar.js.map