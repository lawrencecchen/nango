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
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const api_1 = require("../../utils/api");
const analytics_1 = require("../../utils/analytics");
const utils_1 = require("../../utils/utils");
const user_1 = require("../../utils/user");
const DefaultLayout_1 = __importDefault(require("../../layout/DefaultLayout"));
const Google_1 = __importDefault(require("../../components/ui/button/Auth/Google"));
function InviteSignup() {
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [invitedName, setName] = (0, react_1.useState)('');
    const [invitedEmail, setEmail] = (0, react_1.useState)('');
    const [invitedAccountID, setAccountID] = (0, react_1.useState)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const getInvitee = (0, api_1.useInviteSignupAPI)();
    const signin = (0, user_1.useSignin)();
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const { token } = (0, react_router_dom_1.useParams)();
    (0, react_1.useEffect)(() => {
        const getInvite = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getInvitee(token);
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const invitee = yield res.json();
                const { name, email, account_id } = invitee;
                setName(name);
                setEmail(email);
                setAccountID(Number(account_id));
            }
            else {
                (0, utils_1.isEnterprise)() ? navigate('/signin') : navigate('/signup');
            }
        });
        if (!loaded) {
            setLoaded(true);
            getInvite();
        }
    }, [navigate, getInvitee, token, loaded, setLoaded]);
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setServerErrorMessage('');
        const target = e.target;
        const res = yield (0, api_1.apiFetch)(`/api/v1/account/signup/token`, {
            method: 'POST',
            body: JSON.stringify({
                name: target.name.value,
                email: target.email.value,
                password: target.password.value,
                accountId: invitedAccountID,
                token
            })
        });
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            const data = yield res.json();
            const user = data['user'];
            analyticsTrack('web:account_signup', {
                user_id: user.id,
                email: user.email,
                name: user.name,
                accountId: user.accountId
            });
            signin(user);
            navigate('/');
        }
        else if (res != null) {
            const errorMessage = (yield res.json()).error.message || 'Unknown error';
            setServerErrorMessage(errorMessage);
        }
    });
    return (<>
            <DefaultLayout_1.default>
                <div className="flex flex-col justify-center">
                    <div className="flex flex-col justify-center w-80 mx-4">
                        <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-white">Sign up</h2>
                        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <div className="mt-1">
                                    <input id="name" name="name" type="text" autoComplete="name" defaultValue={invitedName} required placeholder="Name" minLength={1} maxLength={100} className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div>
                                <div className="mt-1">
                                    <input id="email" name="email" type="email" autoComplete="email" defaultValue={invitedEmail} placeholder="Email" required readOnly={!(0, utils_1.isEnterprise)()} className={`${(0, utils_1.isEnterprise)() ? '' : 'cursor-not-allowed outline-none border-transparent focus:border-transparent focus:ring-0 border-none '}bg-bg-black text-text-light-gray block h-11 focus:outline-none w-full appearance-none rounded-md px-3 py-2 text-[14px] shadow-sm`}/>
                                </div>
                            </div>

                            <div>
                                <div className="mt-1">
                                    <input id="password" name="password" type="password" placeholder="Password" autoComplete="current-password" required minLength={8} maxLength={50} className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div className="grid">
                                <button type="submit" className="bg-white flex h-11 justify-center rounded-md border px-4 pt-3 text-[14px] text-black shadow hover:border-2 active:ring-2 active:ring-offset-2">
                                    Sign up
                                </button>
                                {serverErrorMessage && <p className="mt-6 place-self-center text-sm text-red-600">{serverErrorMessage}</p>}
                            </div>
                        </form>
                        {utils_1.MANAGED_AUTH_ENABLED && (<>
                                <div className="flex items-center justify-center my-4 text-xs">
                                    <div className="border-t border-gray-600 flex-grow mr-7"></div>
                                    <span className="text-dark-500">or continue with</span>
                                    <div className="border-t border-gray-600 flex-grow ml-7"></div>
                                </div>
                                <Google_1.default text="Sign up with Google" invitedAccountID={invitedAccountID} token={token} setServerErrorMessage={setServerErrorMessage}/>
                            </>)}
                    </div>
                    <div className="grid w-full">
                        <div className="mt-8 flex text-xs">
                            <p className="text-dark-500">
                                By signing in, you agree to our
                                <a href="https://www.nango.dev/terms" target="_blank" rel="noreferrer" className="text-white ml-1">
                                    Terms of Service
                                </a>
                                <span className="text-dark-500 ml-1">and</span>
                                <a href="https://www.nango.dev/privacy-policy" target="_blank" rel="noreferrer" className="text-white ml-1">
                                    Privacy Policy
                                </a>
                                <span className="text-dark-500">.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </DefaultLayout_1.default>
        </>);
}
exports.default = InviteSignup;
//# sourceMappingURL=InviteSignup.js.map