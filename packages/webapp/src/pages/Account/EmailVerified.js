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
exports.EmailVerified = void 0;
const react_1 = require("react");
const core_1 = require("@geist-ui/core");
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const analytics_1 = require("../../utils/analytics");
const user_1 = require("../../utils/user");
const store_1 = require("../../store");
const api_1 = require("../../utils/api");
const EmailVerified = () => {
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const { token } = (0, react_router_dom_1.useParams)();
    const signin = (0, user_1.useSignin)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const env = (0, store_1.useStore)((state) => state.env);
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        const verifyEmail = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const res = yield (0, api_1.apiFetch)(`/api/v1/account/verify/code`, {
                    method: 'POST',
                    body: JSON.stringify({ token })
                });
                const response = yield res.json();
                if (res.status !== 200) {
                    const errorResponse = response;
                    if (errorResponse.error.code === 'token_expired') {
                        react_toastify_1.toast.error(errorResponse.error.message, { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                        navigate(`/verify-email/expired/${token}`);
                        return;
                    }
                    react_toastify_1.toast.error(response.error.message || 'Issue verifying email. Please try again.', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                }
                else {
                    const user = response['user'];
                    analyticsTrack('web:account_signup', {
                        user_id: user.id,
                        email: user.email,
                        name: user.name,
                        accountId: user.accountId
                    });
                    signin(user);
                    react_toastify_1.toast.success('Email verified successfully!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                    navigate(`/${env}/interactive-demo`);
                }
            }
            catch (_a) {
                react_toastify_1.toast.error('An error occurred while verifying the email. Please try again.', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            }
            finally {
                setLoaded(true);
            }
        });
        verifyEmail();
    }, [token, navigate, env, signin, analyticsTrack]);
    return !loaded ? <core_1.Loading spaceRatio={2.5} className="-top-36"/> : null;
};
exports.EmailVerified = EmailVerified;
//# sourceMappingURL=EmailVerified.js.map