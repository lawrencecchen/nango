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
const utils_1 = require("../../utils/utils");
const api_1 = require("../../utils/api");
const DefaultLayout_1 = __importDefault(require("../../layout/DefaultLayout"));
const Google_1 = __importDefault(require("../../components/ui/button/Auth/Google"));
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
function Signup() {
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [showResendEmail, setShowResendEmail] = (0, react_1.useState)(false);
    const [email, setEmail] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const signupAPI = (0, api_1.useSignupAPI)();
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        setServerErrorMessage('');
        setShowResendEmail(false);
        const target = e.target;
        const res = yield signupAPI(target.name.value, target.email.value, target.password.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            const response = yield res.json();
            const { uuid } = response;
            navigate(`/verify-email/${uuid}`);
        }
        else {
            const errorResponse = yield (res === null || res === void 0 ? void 0 : res.json());
            if (errorResponse.error.code === 'email_not_verified') {
                setShowResendEmail(true);
                setEmail(target.email.value);
            }
            setServerErrorMessage(((_a = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.error) === null || _a === void 0 ? void 0 : _a.message) || 'Issue signing up. Please try again.');
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
                        <h2 className="mt-4 text-center text-[20px] text-white">Sign up to Nango</h2>
                        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <div className="mt-1">
                                    <input id="name" name="name" type="text" autoComplete="name" required minLength={1} placeholder="Name" maxLength={100} className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div>
                                <div className="mt-1">
                                    <input id="email" name="email" type="email" autoComplete="email" placeholder="Email" required className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div>
                                <div className="mt-1">
                                    <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Password" required minLength={8} maxLength={50} className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                </div>
                            </div>

                            <div className="grid">
                                <button type="submit" className="bg-white flex h-11 justify-center rounded-md border px-4 pt-3 text-[14px] text-black shadow hover:border-2 active:ring-2 active:ring-offset-2">
                                    Sign up
                                </button>
                                {serverErrorMessage && (<>
                                        <p className="mt-6 place-self-center text-sm text-red-600">{serverErrorMessage}</p>
                                        {showResendEmail && (<Button_1.default onClick={resendVerificationEmail} className="flex justify-center mt-2 text-light-gray" variant="danger">
                                                Resend verification email
                                            </Button_1.default>)}
                                    </>)}
                            </div>
                        </form>
                        {utils_1.MANAGED_AUTH_ENABLED && (<>
                                <div className="flex items-center justify-center my-4 text-xs">
                                    <div className="border-t border-gray-600 flex-grow mr-7"></div>
                                    <span className="text-dark-500">or continue with</span>
                                    <div className="border-t border-gray-600 flex-grow ml-7"></div>
                                </div>
                                <Google_1.default text="Sign up with Google" setServerErrorMessage={setServerErrorMessage}/>
                            </>)}
                    </div>
                    <div className="grid text-xs">
                        <div className="mt-7 flex place-self-center">
                            <p className="text-dark-500">Already have an account?</p>
                            <react_router_dom_1.Link to="/signin" className="text-white ml-1">
                                Sign in.
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
exports.default = Signup;
//# sourceMappingURL=Signup.js.map