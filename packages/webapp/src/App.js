"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const swr_1 = require("swr");
const react_router_dom_1 = require("react-router-dom");
const core_1 = require("@mantine/core");
const react_toastify_1 = require("react-toastify");
const react_tooltip_1 = require("@radix-ui/react-tooltip");
const user_1 = require("./utils/user");
require("react-toastify/dist/ReactToastify.css");
const utils_1 = require("./utils/utils");
const api_1 = require("./utils/api");
const store_1 = require("./store");
const Signup_1 = __importDefault(require("./pages/Account/Signup"));
const InviteSignup_1 = __importDefault(require("./pages/Account/InviteSignup"));
const Signin_1 = __importDefault(require("./pages/Account/Signin"));
const InteractiveDemo_1 = require("./pages/InteractiveDemo");
const List_1 = __importDefault(require("./pages/Integration/List"));
const Create_1 = __importDefault(require("./pages/Integration/Create"));
const Show_1 = __importDefault(require("./pages/Integration/Show"));
const List_2 = __importDefault(require("./pages/Connection/List"));
const Show_2 = __importDefault(require("./pages/Connection/Show"));
const Create_2 = __importDefault(require("./pages/Connection/Create"));
const Settings_1 = require("./pages/Environment/Settings");
const PrivateRoute_1 = require("./components/PrivateRoute");
const ForgotPassword_1 = __importDefault(require("./pages/Account/ForgotPassword"));
const ResetPassword_1 = __importDefault(require("./pages/Account/ResetPassword"));
const VerifyEmail_1 = require("./pages/Account/VerifyEmail");
const VerifyEmailByExpiredToken_1 = require("./pages/Account/VerifyEmailByExpiredToken");
const EmailVerified_1 = require("./pages/Account/EmailVerified");
const AuthLink_1 = __importDefault(require("./pages/AuthLink"));
const AccountSettings_1 = __importDefault(require("./pages/AccountSettings"));
const UserSettings_1 = __importDefault(require("./pages/UserSettings"));
const Homepage_1 = require("./pages/Homepage");
const NotFound_1 = require("./pages/NotFound");
const Search_1 = require("./pages/Logs/Search");
const sentry_1 = require("./utils/sentry");
const theme = (0, core_1.createTheme)({
    fontFamily: 'Inter'
});
const App = () => {
    const env = (0, store_1.useStore)((state) => state.env);
    const signout = (0, user_1.useSignout)();
    const setShowInteractiveDemo = (0, store_1.useStore)((state) => state.setShowInteractiveDemo);
    const showInteractiveDemo = (0, store_1.useStore)((state) => state.showInteractiveDemo);
    (0, react_1.useEffect)(() => {
        setShowInteractiveDemo(env === 'dev' && ((0, utils_1.isCloud)() || (0, utils_1.isLocal)()));
    }, [env, setShowInteractiveDemo]);
    return (<core_1.MantineProvider theme={theme}>
            <react_tooltip_1.TooltipProvider>
                <swr_1.SWRConfig value={{
            refreshInterval: 15 * 60000,
            // Our server is not well configured if we enable that it will just fetch all the time
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            fetcher: api_1.fetcher,
            onError: (error) => {
                if (error.status === 401) {
                    return signout();
                }
            }
        }}>
                    <sentry_1.SentryRoutes>
                        <react_router_dom_1.Route path="/" element={<Homepage_1.Homepage />}/>
                        <react_router_dom_1.Route element={<PrivateRoute_1.PrivateRoute />} key={env}>
                            {showInteractiveDemo && (<react_router_dom_1.Route path="/dev/interactive-demo" element={<PrivateRoute_1.PrivateRoute />}>
                                    <react_router_dom_1.Route path="/dev/interactive-demo" element={<InteractiveDemo_1.InteractiveDemo />}/>
                                </react_router_dom_1.Route>)}
                            <react_router_dom_1.Route path="/:env/integrations" element={<List_1.default />}/>
                            <react_router_dom_1.Route path="/:env/integration/create" element={<Create_1.default />}/>
                            <react_router_dom_1.Route path="/:env/integration/:providerConfigKey" element={<Show_1.default />}/>
                            <react_router_dom_1.Route path="/:env/connections" element={<List_2.default />}/>
                            <react_router_dom_1.Route path="/:env/connections/create" element={<Create_2.default />}/>
                            <react_router_dom_1.Route path="/:env/connections/create/:providerConfigKey" element={<Create_2.default />}/>
                            <react_router_dom_1.Route path="/:env/connections/:providerConfigKey/:connectionId" element={<Show_2.default />}/>
                            <react_router_dom_1.Route path="/:env/activity" element={<react_router_dom_1.Navigate to={`/${env}/logs`} replace={true}/>}/>
                            <react_router_dom_1.Route path="/:env/logs" element={<Search_1.LogsSearch />}/>
                            <react_router_dom_1.Route path="/:env/environment-settings" element={<Settings_1.EnvironmentSettings />}/>
                            <react_router_dom_1.Route path="/:env/project-settings" element={<react_router_dom_1.Navigate to="/environment-settings"/>}/>
                            {utils_1.AUTH_ENABLED && (<>
                                    <react_router_dom_1.Route path="/:env/account-settings" element={<AccountSettings_1.default />}/>
                                    <react_router_dom_1.Route path="/:env/user-settings" element={<UserSettings_1.default />}/>
                                </>)}
                        </react_router_dom_1.Route>
                        <react_router_dom_1.Route path="/auth-link" element={<AuthLink_1.default />}/>
                        {true && <react_router_dom_1.Route path="/hn-demo" element={<react_router_dom_1.Navigate to={'/signup'}/>}/>}
                        {utils_1.AUTH_ENABLED && (<>
                                <react_router_dom_1.Route path="/signin" element={<Signin_1.default />}/>
                                <react_router_dom_1.Route path="/signup/:token" element={<InviteSignup_1.default />}/>
                                <react_router_dom_1.Route path="/forgot-password" element={<ForgotPassword_1.default />}/>
                                <react_router_dom_1.Route path="/reset-password/:token" element={<ResetPassword_1.default />}/>
                                <react_router_dom_1.Route path="/verify-email/:uuid" element={<VerifyEmail_1.VerifyEmail />}/>
                                <react_router_dom_1.Route path="/verify-email/expired/:token" element={<VerifyEmailByExpiredToken_1.VerifyEmailByExpiredToken />}/>
                                <react_router_dom_1.Route path="/signup/verification/:token" element={<EmailVerified_1.EmailVerified />}/>
                            </>)}
                        {((0, utils_1.isCloud)() || (0, utils_1.isLocal)()) && <react_router_dom_1.Route path="/signup" element={<Signup_1.default />}/>}
                        <react_router_dom_1.Route path="*" element={<NotFound_1.NotFound />}/>
                    </sentry_1.SentryRoutes>
                </swr_1.SWRConfig>
                <react_toastify_1.ToastContainer />
            </react_tooltip_1.TooltipProvider>
        </core_1.MantineProvider>);
};
exports.default = App;
//# sourceMappingURL=App.js.map