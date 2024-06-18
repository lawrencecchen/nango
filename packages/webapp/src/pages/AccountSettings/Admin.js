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
exports.Admin = void 0;
const react_1 = require("react");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const store_1 = require("../../store");
const api_1 = require("../../utils/api");
const Admin = () => {
    const env = (0, store_1.useStore)((state) => state.env);
    const [error, setError] = (0, react_1.useState)(null);
    const redirectToAccount = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const payload = {
            account_uuid: target.account_uuid.value,
            login_reason: target.login_reason.value
        };
        const res = yield (0, api_1.apiFetch)(`/api/v1/account/admin/switch?env=${env}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.status === 200) {
            window.location.reload();
        }
        else {
            setError(JSON.stringify(yield res.json()));
        }
    });
    return (<div className="border border-border-gray rounded-md h-fit mt-4 pt-6 pb-14 text-white">
            <div className="px-8">
                <div className="mt-4">
                    <span>Login as a different user</span>
                    <form onSubmit={redirectToAccount} className="flex flex-col mt-2 gap-4">
                        <div>
                            <input type="text" placeholder="Account UUID" name="account_uuid" className="border-border-gray bg-bg-black text-text-light-gray focus:border-white focus:ring-white block h-11 w-1/2 appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-400 shadow-sm focus:outline-none"/>
                        </div>
                        <div>
                            <input type="text" placeholder="Login reason" name="login_reason" className="border-border-gray bg-bg-black text-text-light-gray focus:border-white focus:ring-white block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-400 shadow-sm focus:outline-none"/>
                        </div>
                        <div>
                            <Button_1.default variant={'danger'}>Login To Account</Button_1.default>
                        </div>
                    </form>
                    {error && <p className="mt-2 mx-4 text-sm text-red-600">{error}</p>}
                </div>
            </div>
        </div>);
};
exports.Admin = Admin;
//# sourceMappingURL=Admin.js.map