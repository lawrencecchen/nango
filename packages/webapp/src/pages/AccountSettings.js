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
const core_1 = require("@geist-ui/core");
const CopyButton_1 = __importDefault(require("../components/ui/button/CopyButton"));
const DashboardLayout_1 = __importDefault(require("../layout/DashboardLayout"));
const LeftNavBar_1 = require("../components/LeftNavBar");
const api_1 = require("../utils/api");
const utils_1 = require("../utils/utils");
const Admin_1 = require("./AccountSettings/Admin");
const store_1 = require("../store");
function AccountSettings() {
    const env = (0, store_1.useStore)((state) => state.env);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [accountName, setAccountName] = (0, react_1.useState)('');
    const [isAdmin, setIsAdmin] = (0, react_1.useState)(false);
    const [members, setMembers] = (0, react_1.useState)([]);
    const [invitedMembers, setInvitedMembers] = (0, react_1.useState)([]);
    const [pendingSuspendMember, setPendingSuspendMember] = (0, react_1.useState)(null);
    const [accountEditMode, setAccountEditMode] = (0, react_1.useState)(false);
    const getAccountInfo = (0, api_1.useGetAccountAPI)(env);
    const editAccountNameAPI = (0, api_1.useEditAccountNameAPI)(env);
    const formRef = (0, react_1.useRef)(null);
    const { setVisible, bindings } = (0, core_1.useModal)();
    const { setVisible: setInviteVisible, bindings: inviteBindings } = (0, core_1.useModal)();
    (0, react_1.useEffect)(() => {
        const getAccount = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getAccountInfo();
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const { account, users, invitedUsers } = yield res.json();
                setAccountName(account['name']);
                setIsAdmin(account['is_admin']);
                setMembers(users);
                setInvitedMembers(invitedUsers);
            }
        });
        if (!loaded) {
            setLoaded(true);
            getAccount();
        }
    }, [getAccountInfo, loaded, setLoaded]);
    const handleAccountNameEdit = (_) => {
        setAccountEditMode(true);
    };
    const handleAccountNameSave = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield editAccountNameAPI(target.account_name.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Account name updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setAccountEditMode(false);
            setAccountName(target.account_name.value);
        }
    });
    const onSuspendMember = (member) => {
        setVisible(true);
        setPendingSuspendMember(member);
    };
    const cancelSuspendMember = () => {
        setVisible(false);
        setPendingSuspendMember(null);
    };
    const confirmSuspendMember = () => __awaiter(this, void 0, void 0, function* () {
        if (!pendingSuspendMember) {
            setVisible(false);
            return;
        }
        const res = yield (0, api_1.apiFetch)(`/api/v1/users/${pendingSuspendMember.id}/suspend`, {
            method: 'POST'
        });
        setVisible(false);
        if (res.status === 200) {
            react_toastify_1.toast.success('Member suspended!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setMembers(members.filter((m) => m.id !== pendingSuspendMember.id));
        }
    });
    const onAddMember = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield (0, api_1.apiFetch)(`/api/v1/users/invite?env=${env}`, {
            method: 'POST',
            body: JSON.stringify({
                name: target.name.value,
                email: target.email.value
            })
        });
        if (res.status === 200) {
            react_toastify_1.toast.success('Member invited!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setInvitedMembers([...invitedMembers, yield res.json()]);
            setInviteVisible(false);
        }
        else {
            const errorResponse = yield res.json();
            react_toastify_1.toast.error(`Failed to invite member: ${errorResponse.error}`, { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
    });
    const handleSubmit = () => {
        if (formRef.current) {
            const submitButton = formRef.current.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        }
    };
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.AccountSettings}>
            <core_1.Modal {...bindings}>
                <core_1.Modal.Title>Suspend Member</core_1.Modal.Title>
                <core_1.Modal.Content>
                    <p>This action cannot be undone, are you sure?</p>
                </core_1.Modal.Content>
                <core_1.Modal.Action placeholder={null} passive onClick={() => cancelSuspendMember()} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Cancel
                </core_1.Modal.Action>
                <core_1.Modal.Action placeholder={null} onClick={() => confirmSuspendMember()} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Submit
                </core_1.Modal.Action>
            </core_1.Modal>
            <core_1.Modal {...inviteBindings}>
                <core_1.Modal.Title>Invite Member</core_1.Modal.Title>
                <core_1.Modal.Content>
                    <form ref={formRef} className="flex flex-col text-sm" onSubmit={onAddMember}>
                        <input name="name" className="border border-border-gray p-3" required placeholder="Name"/>
                        <input name="email" className="border border-border-gray p-3 mt-2 text-sm" required type="email" placeholder="Email"/>
                        <button type="submit" className="hidden"/>
                    </form>
                </core_1.Modal.Content>
                <core_1.Modal.Action placeholder={null} passive onClick={() => setInviteVisible(false)} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Cancel
                </core_1.Modal.Action>
                <core_1.Modal.Action placeholder={null} onClick={handleSubmit} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Submit
                </core_1.Modal.Action>
            </core_1.Modal>
            <div className="h-full mb-20">
                <h2 className="text-left text-3xl font-semibold tracking-tight text-white mb-12">Account Settings</h2>
                <div className="border border-border-gray rounded-md h-fit pt-6 pb-14">
                    <div>
                        <div className="mx-8 mt-8">
                            <div className="flex flex-col">
                                <label htmlFor="public_key" className="text-text-light-gray block text-sm font-semibold mb-2">
                                    Account Name
                                </label>
                                <div className="flex">
                                    {accountEditMode && (<form className="mt-2 w-full flex" onSubmit={handleAccountNameSave}>
                                            <input id="account_name" name="account_name" defaultValue={accountName} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none" required/>
                                            <button type="submit" className="border-border-blue bg-bg-dark-blue active:ring-border-blue flex h-11 rounded-md border ml-4 px-4 pt-3 text-sm font-semibold text-blue-500 shadow-sm hover:border-2 active:ring-2 active:ring-offset-2">
                                                Save
                                            </button>
                                        </form>)}
                                    {!accountEditMode && (<div className="flex w-full">
                                            <prism_1.Prism language="bash" colorScheme="dark" className="w-full">
                                                {accountName}
                                            </prism_1.Prism>
                                            <button onClick={handleAccountNameEdit} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                                Edit
                                            </button>
                                        </div>)}
                                </div>
                            </div>
                        </div>
                        <div className="mx-8 mt-8">
                            <div className="flex flex-col">
                                <label htmlFor="public_key" className="flex text-text-light-gray block text-sm font-semibold mb-2">
                                    Account Members
                                    <core_1.Tooltip text="Invite a new member" type="dark">
                                        <span className="bg-blue-500 cursor-pointer ml-2 text-white h-5 pb-0.5 w-5 flex items-center justify-center rounded-full" onClick={() => {
            setInviteVisible(true);
        }}>
                                            +
                                        </span>
                                    </core_1.Tooltip>
                                </label>
                                <div className="flex flex-col mt-2">
                                    <ul className="flex flex-col w-full space-y-4 text-white text-sm">
                                        {members
            .filter((m) => !m.suspended)
            .map((member) => (<li key={member.id} className={`flex w-full py-2 ${members.filter((m) => !m.suspended).length > 1 ? 'border-b border-border-gray' : ''} justify-between items-center`}>
                                                    <div className="flex space-x-12">
                                                        <span className="w-28">{member['name']}</span>
                                                        <core_1.Tooltip text={member['email']} type="dark">
                                                            <div className="w-48 overflow-hidden truncate">
                                                                <span className="">{member['email']}</span>
                                                            </div>
                                                        </core_1.Tooltip>
                                                    </div>
                                                    {!member.suspended && !member.currentUser && (<core_1.Tooltip text="Remove member" type="dark">
                                                            <span className="bg-red-500 cursor-pointer pb-0.5 text-white h-5 w-5 flex items-center justify-center rounded-full" onClick={() => {
                    onSuspendMember(member);
                }}>
                                                                x
                                                            </span>
                                                        </core_1.Tooltip>)}
                                                </li>))}
                                    </ul>
                                    {invitedMembers.filter((m) => !m.accepted).length > 0 && (<>
                                            <h3 className="mt-8 text-text-light-gray text-sm font-semibold mt-4 mb-2">Invited Members</h3>
                                            <ul className="flex flex-col w-full space-y-4 text-white text-sm">
                                                {invitedMembers
                .filter((m) => !m.accepted)
                .map((member) => (<li key={member.id} className="flex w-full py-2 border-b border-border-gray justify-between items-center">
                                                            <div className="flex space-x-12">
                                                                <span className="w-28">{member['name']}</span>
                                                                <core_1.Tooltip text={member['email']} type="dark">
                                                                    <div className="w-48 overflow-hidden truncate">
                                                                        <span className="">{member['email']}</span>
                                                                    </div>
                                                                </core_1.Tooltip>
                                                                <core_1.Tooltip text="The invite expires on this date" type="dark">
                                                                    <span>{(0, utils_1.formatDateToUSFormat)(member['expires_at'])}</span>
                                                                </core_1.Tooltip>
                                                            </div>
                                                            <CopyButton_1.default icontype="link" textPrompt="Copy Invite Link" dark text={`${window.location.host}/signup/${member.token}`}/>
                                                        </li>))}
                                            </ul>
                                        </>)}
                                    {members.filter((m) => !m.suspended).length === 0 && (<>
                                            <h3 className="mt-8 text-text-light-gray text-sm font-semibold mt-4 mb-2">Suspended Members</h3>
                                            <ul className="flex flex-col w-full space-y-4 text-white text-sm">
                                                {members
                .filter((m) => m.suspended)
                .map((member) => (<li key={member.id} className="flex w-full py-2 border-b border-border-gray justify-between items-center">
                                                            <div className="flex space-x-12 text-gray-500">
                                                                <span className="w-28">{member['name']}</span>
                                                                <core_1.Tooltip text={member['email']} type="dark">
                                                                    <div className="w-48 overflow-hidden truncate">
                                                                        <span className="">{member['email']}</span>
                                                                    </div>
                                                                </core_1.Tooltip>
                                                            </div>
                                                        </li>))}
                                            </ul>
                                        </>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {isAdmin && <Admin_1.Admin />}
            </div>
        </DashboardLayout_1.default>);
}
exports.default = AccountSettings;
//# sourceMappingURL=AccountSettings.js.map