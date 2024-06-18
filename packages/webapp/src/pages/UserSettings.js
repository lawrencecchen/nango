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
const prism_1 = require("@mantine/prism");
const react_toastify_1 = require("react-toastify");
const DashboardLayout_1 = __importDefault(require("../layout/DashboardLayout"));
const LeftNavBar_1 = require("../components/LeftNavBar");
const api_1 = require("../utils/api");
const useUser_1 = require("../hooks/useUser");
function UserSettings() {
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [name, setName] = (0, react_1.useState)('');
    const [email, setEmail] = (0, react_1.useState)('');
    const [userEditMode, setUserEditMode] = (0, react_1.useState)(false);
    const { user, mutate } = (0, useUser_1.useUser)();
    const editUserNameAPI = (0, api_1.useEditUserNameAPI)();
    (0, react_1.useEffect)(() => {
        if (!user) {
            return;
        }
        setName(user.name);
        setEmail(user.email);
        setLoaded(true);
    }, [user, setLoaded]);
    const handleUserNameEdit = () => {
        setUserEditMode(true);
    };
    const handleUserNameSave = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield editUserNameAPI(target.name.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success("User's name updated!", { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setUserEditMode(false);
            setName(target.name.value);
            void mutate();
        }
    });
    if (!loaded) {
        return null;
    }
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.UserSettings}>
            <div className="h-full mb-20">
                <h2 className="text-left text-3xl font-semibold tracking-tight text-white mb-12">User Settings</h2>
                <div className="border border-border-gray rounded-md h-fit pt-6 pb-14">
                    <div>
                        <div className="mx-8 mt-8">
                            <div className="flex flex-col">
                                <label htmlFor="public_key" className="text-text-light-gray block text-sm font-semibold mb-2">
                                    Name
                                </label>
                                <div className="flex">
                                    {userEditMode && (<form className="mt-2 w-full flex" onSubmit={handleUserNameSave}>
                                            <input id="name" name="name" defaultValue={name} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none" required/>
                                            <button type="submit" className="border-border-blue bg-bg-dark-blue active:ring-border-blue flex h-11 rounded-md border ml-4 px-4 pt-3 text-sm font-semibold text-blue-500 shadow-sm hover:border-2 active:ring-2 active:ring-offset-2">
                                                Save
                                            </button>
                                        </form>)}
                                    {!userEditMode && (<div className="flex w-full">
                                            <prism_1.Prism language="bash" colorScheme="dark" className="w-full">
                                                {name}
                                            </prism_1.Prism>
                                            <button onClick={handleUserNameEdit} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                                Edit
                                            </button>
                                        </div>)}
                                </div>
                            </div>
                        </div>
                        <div className="mx-8 mt-8">
                            <div className="flex">
                                <label htmlFor="public_key" className="text-text-light-gray block text-sm font-semibold mb-2">
                                    Email
                                </label>
                            </div>
                            <prism_1.Prism language="bash" colorScheme="dark">
                                {email}
                            </prism_1.Prism>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout_1.default>);
}
exports.default = UserSettings;
//# sourceMappingURL=UserSettings.js.map