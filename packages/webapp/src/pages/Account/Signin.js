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
const user_1 = require("../../utils/user");
const utils_1 = require("../../utils/utils");
const DefaultLayout_1 = __importDefault(require("../../layout/DefaultLayout"));
const Google_1 = __importDefault(require("../../components/ui/button/Auth/Google"));
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
function Signin() {
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [showResendEmail, setShowResendEmail] = (0, react_1.useState)(false);
    const [email, setEmail] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const signin = (0, user_1.useSignin)();
    const signinAPI = (0, api_1.useSigninAPI)();
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setServerErrorMessage('');
        setShowResendEmail(false);
        const target = e.target;
        const res = yield signinAPI(target.email.value, target.password.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            const data = yield res.json();
            const user = data['user'];
            signin(user);
            navigate('/');
        }
        else if ((res === null || res === void 0 ? void 0 : res.status) === 401) {
            setServerErrorMessage('Invalid email or password.');
        }
        else if ((res === null || res === void 0 ? void 0 : res.status) === 400) {
            const errorResponse = (yield res.json());
            if (errorResponse.error.code === 'email_not_verified') {
                setShowResendEmail(true);
                setEmail(target.email.value);
                setServerErrorMessage('Please verify your email before logging in.');
            }
            else {
                setServerErrorMessage('Issue logging in. Please try again.');
            }
        }
    });
    const resendVerificationEmail = () => __awaiter(this, void 0, void 0, function* () {
        setShowResendEmail(false);
        setServerErrorMessage('');
        const res = yield (0, api_1.apiFetch)('/api/v1/account/resend-verification-email/by-email', {
            method: 'POST',
            body: JSON.stringify({
                email
            })
        });
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            setServerErrorMessage('Verification email sent.');
        }
        else {
            setServerErrorMessage('Issue sending verification email. Please try again.');
        }
    });
    return (<>
            <DefaultLayout_1.default>
                <div className="flex flex-col justify-center">
                    <div className="flex flex-col justify-center w-80 mx-4">
                        <h2 className="mt-4 text-center text-[20px] text-white">Log in to Nango</h2>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <div className="mt-1">
                                    <input id="email" placeholder="Email" name="email" type="email" autoComplete="email" required className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-end">
                                    <div className="flex flex-end text-sm">
                                        <a href="/forgot-password" className="text-dark-500 text-xs ml-1">
                                            Forgot your password?
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <input id="password" name="password" type="password" placeholder="Password" autoComplete="current-password" required className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div className="grid">
                                <button type="submit" className="bg-white mt-4 flex h-11 justify-center rounded-md border px-4 pt-3 text-[14px] text-black shadow hover:border-2 active:ring-2 active:ring-offset-2">
                                    Log in
                                </button>
                                {serverErrorMessage && (<>
                                        <p className="mt-6 place-self-center text-sm text-red-600">{serverErrorMessage}</p>
                                        {showResendEmail && (<Button_1.default onClick={resendVerificationEmail} className="flex justify-center mt-2 text-light-gray" variant="danger">
                                                Resend verification email
                                            </Button_1.default>)}
                                    </>)}
                            </div>

                            {utils_1.MANAGED_AUTH_ENABLED && (<>
                                    <div className="flex items-center justify-center my-4 text-xs">
                                        <div className="border-t border-gray-600 flex-grow mr-7"></div>
                                        <span className="text-dark-500">or continue with</span>
                                        <div className="border-t border-gray-600 flex-grow ml-7"></div>
                                    </div>

                                    <Google_1.default text="Sign in with Google" setServerErrorMessage={setServerErrorMessage}/>
                                </>)}
                        </form>
                    </div>
                    <div className="grid text-xs">
                        <div className="mt-7 flex place-self-center">
                            <p className="text-dark-500">Don&apos;t have an account?</p>
                            <react_router_dom_1.Link to="/signup" className="text-white ml-1">
                                Sign up.
                            </react_router_dom_1.Link>
                        </div>
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
exports.default = Signin;
//# sourceMappingURL=Signin.js.map