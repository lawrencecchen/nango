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
exports.VerifyEmail = void 0;
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const core_1 = require("@geist-ui/core");
const react_toastify_1 = require("react-toastify");
const DefaultLayout_1 = __importDefault(require("../../layout/DefaultLayout"));
const api_1 = require("../../utils/api");
function VerifyEmail() {
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [email, setEmail] = (0, react_1.useState)('');
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { uuid } = (0, react_router_dom_1.useParams)();
    (0, react_1.useEffect)(() => {
        if (!uuid) {
            navigate('/');
        }
    }, [uuid, navigate]);
    (0, react_1.useEffect)(() => {
        const getEmail = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, api_1.apiFetch)(`/api/v1/account/email/${uuid}`);
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const response = (yield res.json());
                const { email, verified } = response;
                if (verified) {
                    react_toastify_1.toast.success('Email already verified. Routing to the login page', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                    navigate('/signin');
                }
                setEmail(email);
            }
            else {
                const errorResponse = (yield res.json());
                setServerErrorMessage(errorResponse.error.message || 'Issue verifying email. Please try again.');
            }
            setLoaded(true);
        });
        if (!loaded) {
            getEmail();
        }
    }, [uuid, loaded, setLoaded, navigate]);
    const resendEmail = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setServerErrorMessage('');
        const res = yield (0, api_1.apiFetch)('/api/v1/account/resend-verification-email/by-uuid', {
            method: 'POST',
            body: JSON.stringify({
                uuid
            })
        });
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Verification email sent again!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else {
            const response = yield res.json();
            setServerErrorMessage(response.error.message || 'Unkown error...');
        }
    });
    if (!loaded) {
        return <core_1.Loading spaceRatio={2.5} className="-top-36"/>;
    }
    return (<>
            <DefaultLayout_1.default>
                <div className="flex flex-col justify-center items-center">
                    <div className="py-3">
                        <h2 className="mt-4 text-center text-[20px] text-white">Verify your email</h2>
                        {email ? (<form className="mt-6 space-y-6" onSubmit={resendEmail}>
                                <span className="text-text-light-gray mb-4 text-[14px]">Check {email} to verify your account and get started.</span>
                                <div className="flex justify-center">
                                    <button className="min-w-8 bg-white flex h-11 justify-center rounded-md border px-4 pt-3 text-[14px] text-black shadow active:ring-2 active:ring-offset-2">
                                        Resend verification email
                                    </button>
                                </div>
                            </form>) : (<span className="flex text-text-light-gray mb-4 text-[14px] mt-6">Invalid user id. Please try and signup again.</span>)}
                        {serverErrorMessage && <p className="mt-6 place-self-center text-sm text-red-600">{serverErrorMessage}</p>}
                    </div>
                </div>
            </DefaultLayout_1.default>
        </>);
}
exports.VerifyEmail = VerifyEmail;
//# sourceMappingURL=VerifyEmail.js.map