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
const react_toastify_1 = require("react-toastify");
const api_1 = require("../../utils/api");
const DefaultLayout_1 = __importDefault(require("../../layout/DefaultLayout"));
function Signin() {
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const requestPasswordResetAPI = (0, api_1.useRequestPasswordResetAPI)();
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setServerErrorMessage('');
        const target = e.target;
        const res = yield requestPasswordResetAPI(target.email.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Email sent!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else if ((res === null || res === void 0 ? void 0 : res.status) === 404) {
            setServerErrorMessage('No user matching this email.');
        }
        else {
            setServerErrorMessage('Unknown error...');
        }
    });
    return (<>
            <DefaultLayout_1.default>
                <div className="flex flex-col justify-center">
                    <div className="w-80">
                        <h2 className="mt-4 text-center text-[20px] text-white">Request password reset</h2>
                        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <div>
                                    <div className="mt-1">
                                        <input id="email" name="email" type="email" placeholder="Email" autoComplete="email" required className="border-border-gray bg-dark-600 placeholder-dark-500 text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-[14px] placeholder-gray-400 shadow-sm focus:outline-none"/>
                                    </div>
                                </div>
                            </div>

                            <div className="grid">
                                <button type="submit" className="bg-white flex h-11 justify-center rounded-md border px-4 pt-3 text-[14px] text-black shadow active:ring-2 active:ring-offset-2">
                                    Send password reset email
                                </button>
                                {serverErrorMessage && <p className="mt-6 place-self-center text-sm text-red-600">{serverErrorMessage}</p>}
                            </div>
                        </form>
                    </div>
                </div>
            </DefaultLayout_1.default>
        </>);
}
exports.default = Signin;
//# sourceMappingURL=ForgotPassword.js.map