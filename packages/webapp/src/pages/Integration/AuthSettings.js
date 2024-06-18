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
const react_toastify_1 = require("react-toastify");
const icons_1 = require("@geist-ui/icons");
const outline_1 = require("@heroicons/react/24/outline");
const core_1 = require("@geist-ui/core");
const swr_1 = require("swr");
const types_1 = require("../../types");
const api_1 = require("../../utils/api");
const Info_1 = __importDefault(require("../../components/ui/Info"));
const ActionModal_1 = __importDefault(require("../../components/ui/ActionModal"));
const SecretInput_1 = __importDefault(require("../../components/ui/input/SecretInput"));
const SecretTextArea_1 = __importDefault(require("../../components/ui/input/SecretTextArea"));
const utils_1 = require("../../utils/utils");
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const TagsInput_1 = __importDefault(require("../../components/ui/input/TagsInput"));
const store_1 = require("../../store");
function AuthSettings(props) {
    var _a, _b, _c;
    const { mutate } = (0, swr_1.useSWRConfig)();
    const { integration, environment } = props;
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    const [modalTitle, setModalTitle] = (0, react_1.useState)('');
    const [modalContent, setModalContent] = (0, react_1.useState)('');
    const [modalAction, setModalAction] = (0, react_1.useState)(null);
    const [modalShowSpinner, setModalShowSpinner] = (0, react_1.useState)(false);
    const [modalTitleColor, setModalTitleColor] = (0, react_1.useState)('text-white');
    const [showEditIntegrationIdMenu, setShowEditIntegrationIdMenu] = (0, react_1.useState)(false);
    const [integrationIdEdit, setIntegrationIdEdit] = (0, react_1.useState)('');
    const [integrationId, setIntegrationId] = (0, react_1.useState)((integration === null || integration === void 0 ? void 0 : integration.unique_key) || '');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const env = (0, store_1.useStore)((state) => state.env);
    const { setVisible, bindings } = (0, core_1.useModal)();
    const editIntegrationAPI = (0, api_1.useEditIntegrationAPI)(env);
    const editIntegrationNameAPI = (0, api_1.useEditIntegrationNameAPI)(env);
    const createIntegrationAPI = (0, api_1.useCreateIntegrationAPI)(env);
    const deleteIntegrationAPI = (0, api_1.useDeleteIntegrationAPI)(env);
    const onDelete = () => __awaiter(this, void 0, void 0, function* () {
        if (!integration)
            return;
        setModalShowSpinner(true);
        const res = yield deleteIntegrationAPI(integrationId);
        if ((res === null || res === void 0 ? void 0 : res.status) === 204) {
            react_toastify_1.toast.success('Integration deleted!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            clearCache();
            navigate(`/${env}/integrations`, { replace: true });
        }
        setModalShowSpinner(false);
        setVisible(false);
    });
    const deleteButtonClicked = () => __awaiter(this, void 0, void 0, function* () {
        setModalTitle('Delete integration?');
        setModalTitleColor('text-pink-600');
        setModalContent('Are you sure you want to delete this integration?');
        setModalAction(() => () => onDelete());
        setVisible(true);
    });
    const clearCache = () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/v1/integration'), undefined);
    };
    const handleSave = (e) => __awaiter(this, void 0, void 0, function* () {
        var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
        e.preventDefault();
        setServerErrorMessage('');
        if (integrationId) {
            if (!integration) {
                return;
            }
            const target = e.target;
            const client_secret = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App ? (_d = target.private_key) === null || _d === void 0 ? void 0 : _d.value : (_e = target.client_secret) === null || _e === void 0 ? void 0 : _e.value;
            const client_id = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App ? (_f = target.app_id) === null || _f === void 0 ? void 0 : _f.value : (_g = target.client_id) === null || _g === void 0 ? void 0 : _g.value;
            const private_key = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App || types_1.AuthModes.Custom ? (_h = target.private_key) === null || _h === void 0 ? void 0 : _h.value : (_j = target.client_secret) === null || _j === void 0 ? void 0 : _j.value;
            const appId = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App || types_1.AuthModes.Custom ? (_k = target.app_id) === null || _k === void 0 ? void 0 : _k.value : (_l = target.client_id) === null || _l === void 0 ? void 0 : _l.value;
            let custom = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom ? { app_id: appId, private_key } : undefined;
            if ((_m = target.incoming_webhook_secret) === null || _m === void 0 ? void 0 : _m.value) {
                custom = { webhookSecret: target.incoming_webhook_secret.value };
            }
            const res = yield editIntegrationAPI(integration.provider, integration.auth_mode, integrationId, client_id, client_secret, (_o = target.scopes) === null || _o === void 0 ? void 0 : _o.value, (_p = target.app_link) === null || _p === void 0 ? void 0 : _p.value, custom);
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                react_toastify_1.toast.success('Integration updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                clearCache();
            }
        }
        else {
            const target = e.target;
            const [provider] = target.provider.value.split('|');
            const client_secret = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App ? (_q = target.private_key) === null || _q === void 0 ? void 0 : _q.value : (_r = target.client_secret) === null || _r === void 0 ? void 0 : _r.value;
            const client_id = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App ? (_s = target.app_id) === null || _s === void 0 ? void 0 : _s.value : (_t = target.client_id) === null || _t === void 0 ? void 0 : _t.value;
            const private_key = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App || types_1.AuthModes.Custom ? (_u = target.private_key) === null || _u === void 0 ? void 0 : _u.value : (_v = target.client_secret) === null || _v === void 0 ? void 0 : _v.value;
            const appId = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App || types_1.AuthModes.Custom ? (_w = target.app_id) === null || _w === void 0 ? void 0 : _w.value : (_x = target.client_id) === null || _x === void 0 ? void 0 : _x.value;
            const custom = (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom ? { app_id: appId, private_key } : undefined;
            const res = yield createIntegrationAPI(provider, integration === null || integration === void 0 ? void 0 : integration.auth_mode, (_y = target.unique_key) === null || _y === void 0 ? void 0 : _y.value, client_id, client_secret, (_z = target.scopes) === null || _z === void 0 ? void 0 : _z.value, (_0 = target.app_link) === null || _0 === void 0 ? void 0 : _0.value, custom);
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                react_toastify_1.toast.success('Integration created!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                clearCache();
                navigate(`/${env}/integrations`, { replace: true });
            }
            else if (res != null) {
                const payload = yield res.json();
                react_toastify_1.toast.error(payload.type === 'duplicate_provider_config' ? 'Unique Key already exists.' : payload.error, {
                    position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
                });
            }
        }
    });
    const editIntegrationID = () => {
        setShowEditIntegrationIdMenu(true);
        setIntegrationIdEdit(integrationId);
        setIsTyping(false);
    };
    const onSaveIntegrationID = () => __awaiter(this, void 0, void 0, function* () {
        setShowEditIntegrationIdMenu(false);
        setIntegrationIdEdit('');
        setIsTyping(false);
        if (!integration) {
            return;
        }
        const res = yield editIntegrationNameAPI(integrationId, integrationIdEdit);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Integration ID updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setIntegrationId(integrationIdEdit);
            navigate(`/${env}/integration/${integrationIdEdit}`, { replace: true });
            clearCache();
        }
        else if (res != null) {
            const payload = yield res.json();
            react_toastify_1.toast.error(payload.error, {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
        }
    });
    const onCancelEditIntegrationID = () => {
        setShowEditIntegrationIdMenu(false);
        setIntegrationIdEdit('');
        setIsTyping(false);
    };
    return (<form className="mx-auto space-y-12 text-sm w-[976px]" onSubmit={handleSave} autoComplete="one-time-code">
            <ActionModal_1.default bindings={bindings} modalTitle={modalTitle} modalContent={modalContent} modalAction={modalAction} modalShowSpinner={modalShowSpinner} modalTitleColor={modalTitleColor} setVisible={setVisible}/>
            <input type="text" className="hidden" name="username" autoComplete="username"/>
            <input type="password" className="hidden" name="password" autoComplete="password"/>
            <div className="flex">
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">API Provider</span>
                    <span className="text-white">{integration === null || integration === void 0 ? void 0 : integration.provider}</span>
                </div>
                <div className="flex flex-col w-1/2 relative">
                    <span className="text-gray-400 text-xs uppercase mb-1">Integration ID</span>
                    {showEditIntegrationIdMenu ? (<div className="flex items-center">
                            <input value={integrationIdEdit} onChange={(e) => {
                setIntegrationIdEdit(e.target.value);
                setIsTyping(true);
            }} className="bg-active-gray w-full text-white rounded-md px-3 py-0.5 mt-0.5 focus:border-white" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onSaveIntegrationID();
                }
            }}/>
                            <outline_1.XCircleIcon className="flex ml-1 h-5 w-5 text-red-400 cursor-pointer hover:text-red-700" onClick={() => onCancelEditIntegrationID()}/>
                        </div>) : (<div className="flex text-white">
                            <span className="mr-2">{integrationId}</span>
                            {(integration === null || integration === void 0 ? void 0 : integration.connection_count) === 0 && (<outline_1.PencilSquareIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => editIntegrationID()}/>)}
                        </div>)}
                    {isTyping && integrationIdEdit && (<div className="flex items-center border border-border-gray bg-active-gray text-white rounded-md px-3 py-0.5 mt-0.5 cursor-pointer">
                            <outline_1.PencilSquareIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => onSaveIntegrationID()}/>
                            <span className="mt-0.5 cursor-pointer ml-1" onClick={() => onSaveIntegrationID()}>
                                Change the integration ID to: {integrationIdEdit}
                            </span>
                        </div>)}
                </div>
            </div>
            <div className="flex">
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">Creation Date</span>
                    <span className="text-white">{(0, utils_1.formatDateToShortUSFormat)(integration === null || integration === void 0 ? void 0 : integration.created_at)}</span>
                </div>
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">Auth Type</span>
                    <span className="text-white">{integration === null || integration === void 0 ? void 0 : integration.auth_mode}</span>
                </div>
            </div>
            {((integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.OAuth1 || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.OAuth2 || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom) && (<div className="flex">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs uppercase">Callback Url</span>
                        </div>
                        <span className="flex items-center gap-2">
                            <span className="text-white">{environment.callback_url || (0, utils_1.defaultCallback)()}</span>
                            <CopyButton_1.default text={environment.callback_url || (0, utils_1.defaultCallback)()} dark/>
                        </span>
                    </div>
                </div>)}
            {(integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App && environment.callback_url && (<div className="flex">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs uppercase">Setup URL</span>
                            <core_1.Tooltip type="dark" text={<>
                                        <div className="flex text-white text-sm">
                                            <p>{`Register this setup URL on the app settings page in the "Post Installation section". Check "Redirect on update" as well.`}</p>
                                        </div>
                                    </>}>
                                <icons_1.HelpCircle color="gray" className="h-3 ml-1"></icons_1.HelpCircle>
                            </core_1.Tooltip>
                        </div>
                        <span className="flex items-center gap-2">
                            <span className="text-white">{environment.callback_url.replace('oauth/callback', 'app-auth/connect')}</span>
                            <CopyButton_1.default text={environment.callback_url.replace('oauth/callback', 'app-auth/connect')} dark/>
                        </span>
                    </div>
                </div>)}
            {(integration === null || integration === void 0 ? void 0 : integration.unique_key) && (integration === null || integration === void 0 ? void 0 : integration.has_webhook) && (<>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs uppercase">Webhook Url</span>
                            <core_1.Tooltip type="dark" text={<>
                                        <div className="flex text-white text-sm">
                                            <p>{`Register this webhook URL on the developer portal of the Integration Provider to receive incoming webhooks.${(integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom ? ' Use this for github organizations that need app approvals.' : ''}`}</p>
                                        </div>
                                    </>}>
                                <icons_1.HelpCircle color="gray" className="h-3 ml-1"></icons_1.HelpCircle>
                            </core_1.Tooltip>
                        </div>
                        <div className="flex text-white items-center gap-2">
                            <span className="text-white">{`${environment.webhook_receive_url}/${integrationId}`}</span>
                            <CopyButton_1.default text={`${environment.webhook_receive_url}/${integrationId}`} dark/>
                        </div>
                    </div>
                    {((integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom) && (integration === null || integration === void 0 ? void 0 : integration.webhook_secret) && (<div className="flex flex-col">
                            <div className="flex items-center mb-1">
                                <span className="text-gray-400 text-xs uppercase">Webhook Secret</span>
                                <core_1.Tooltip type="dark" text={<>
                                            <div className="flex text-white text-sm">
                                                <p>{`Input this secret into the "Webhook secret (optional)" field in the Webhook section`}</p>
                                            </div>
                                        </>}>
                                    <icons_1.HelpCircle color="gray" className="h-3 ml-1"></icons_1.HelpCircle>
                                </core_1.Tooltip>
                            </div>
                            <div className="flex text-white items-center gap-2">
                                <span className="text-white">{integration === null || integration === void 0 ? void 0 : integration.webhook_secret}</span>
                                <CopyButton_1.default text={integration === null || integration === void 0 ? void 0 : integration.webhook_secret} dark/>
                            </div>
                        </div>)}
                    {integration.has_webhook_user_defined_secret && (<div className="flex flex-col w-full">
                            <div className="flex items-center mb-1">
                                <span className="text-gray-400 text-xs uppercase">Webhook Secret</span>
                                <core_1.Tooltip type="dark" text={<>
                                            <div className="flex text-white text-sm">
                                                <p>{`Obtain the Webhook Secret from on the developer portal of the Integration Provider.`}</p>
                                            </div>
                                        </>}>
                                    <icons_1.HelpCircle color="gray" className="h-3 ml-1"></icons_1.HelpCircle>
                                </core_1.Tooltip>
                            </div>
                            <div className="flex text-white w-full">
                                <SecretInput_1.default copy={true} id="incoming_webhook_secret" name="incoming_webhook_secret" autoComplete="one-time-code" defaultValue={integration ? (_a = integration.custom) === null || _a === void 0 ? void 0 : _a.webhookSecret : ''} additionalclass={`w-full`} required/>
                            </div>
                        </div>)}
                </>)}
            {((integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Basic || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.ApiKey) && (<Info_1.default size={20} color="blue">
                    The &quot;{integration === null || integration === void 0 ? void 0 : integration.provider}&quot; integration provider uses {(integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Basic ? 'basic auth' : 'API Keys'}{' '}
                    for authentication (
                    <a href="https://docs.nango.dev/integrate/guides/authorize-an-api" className="text-white underline hover:text-text-light-blue" rel="noreferrer" target="_blank">
                        docs
                    </a>
                    ).
                </Info_1.default>)}
            {((integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.App || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom) && (<>
                    <div className="flex">
                        <div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">App ID</span>
                            <div className="mt-1">
                                <input id="app_id" name="app_id" type="text" defaultValue={integration ? ((integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom ? (_b = integration.custom) === null || _b === void 0 ? void 0 : _b.app_id : integration.client_id) : ''} placeholder="Obtain the app id from the app page." autoComplete="new-password" required minLength={1} className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-5/6 appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"/>
                            </div>
                        </div>
                        <div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">App Public Link</span>
                            <div className="mt-1">
                                <input id="app_link" name="app_link" type="text" defaultValue={integration ? integration.app_link : ''} placeholder="Obtain the app public link from the app page." autoComplete="new-password" required minLength={1} className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-5/6 appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"/>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs">App Private Key</span>
                            <core_1.Tooltip type="dark" text={<>
                                        <div className="flex text-white text-sm">
                                            <p>{`Obtain the app private key from the app page by downloading the private key and pasting the entirety of its contents here.`}</p>
                                        </div>
                                    </>}>
                                <icons_1.HelpCircle color="gray" className="h-3 ml-1"></icons_1.HelpCircle>
                            </core_1.Tooltip>
                        </div>
                        <div className="flex text-white items-center">
                            <div className="mt-1 w-full">
                                <SecretTextArea_1.default copy={true} id="private_key" name="private_key" defaultValue={integration
                ? (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom
                    ? (_c = integration.custom) === null || _c === void 0 ? void 0 : _c.private_key
                    : integration.client_secret
                : ''} additionalclass={`w-full`} required/>
                            </div>
                        </div>
                    </div>
                </>)}
            {((integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.OAuth1 || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.OAuth2 || (integration === null || integration === void 0 ? void 0 : integration.auth_mode) === types_1.AuthModes.Custom) && (<>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs">Client ID</span>
                        </div>
                        <div className="flex text-white mt-1 items-center">
                            <div className="w-full relative">
                                <input id="client_id" name="client_id" type="text" defaultValue={integration ? integration.client_id : ''} autoComplete="one-time-code" placeholder="Find the Client ID on the developer portal of the external API provider." required minLength={1} className="border-border-gray bg-active-gray text-white focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-0.5 text-sm placeholder-gray-400 shadow-sm focus:outline-none"/>
                                <span className="absolute right-0.5 top-1 flex items-center">
                                    <CopyButton_1.default text={integration === null || integration === void 0 ? void 0 : integration.client_id} dark className="relative -ml-6"/>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                            <span className="text-gray-400 text-xs">Client Secret</span>
                        </div>
                        <div className="mt-1">
                            <SecretInput_1.default copy={true} id="client_secret" name="client_secret" autoComplete="one-time-code" placeholder="Find the Client Secret on the developer portal of the external API provider." defaultValue={integration ? integration.client_secret : ''} required/>
                        </div>
                    </div>
                    {(integration === null || integration === void 0 ? void 0 : integration.auth_mode) !== types_1.AuthModes.Custom && (<div className="flex flex-col">
                            <div className="flex items-center mb-1">
                                <span className="text-gray-400 text-xs">Scopes</span>
                            </div>
                            <div className="mt-1">
                                <TagsInput_1.default id="scopes" name="scopes" type="text" defaultValue={integration ? integration === null || integration === void 0 ? void 0 : integration.scopes : ''} minLength={1}/>
                            </div>
                        </div>)}
                </>)}
            <div className="pb-4">
                <div className="flex justify-between">
                    {(!integration || ((integration === null || integration === void 0 ? void 0 : integration.auth_mode) !== types_1.AuthModes.Basic && (integration === null || integration === void 0 ? void 0 : integration.auth_mode) !== types_1.AuthModes.ApiKey)) && (<button type="submit" className="bg-white mt-4 h-8 rounded-md hover:bg-gray-300 border px-3 pt-0.5 text-sm text-black">
                            Save
                        </button>)}
                    {integration && (<button type="button" className="mt-4 flex h-8 rounded-md bg-pink-600 bg-opacity-20 border border-pink-600 pl-3 pr-3 pt-1.5 text-sm text-pink-600" onClick={deleteButtonClicked}>
                            <p>Delete</p>
                        </button>)}
                </div>
                {serverErrorMessage && <p className="mt-6 text-sm text-red-600">{serverErrorMessage}</p>}
            </div>
        </form>);
}
exports.default = AuthSettings;
//# sourceMappingURL=AuthSettings.js.map