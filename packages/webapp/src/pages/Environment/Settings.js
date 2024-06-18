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
exports.EnvironmentSettings = void 0;
const react_toastify_1 = require("react-toastify");
const prism_1 = require("@mantine/prism");
const react_1 = require("react");
const icons_1 = require("@geist-ui/icons");
const outline_1 = require("@heroicons/react/24/outline");
const core_1 = require("@geist-ui/core");
const api_1 = require("../../utils/api");
const IntegrationLogo_1 = __importDefault(require("../../components/ui/IntegrationLogo"));
const utils_1 = require("../../utils/utils");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const LeftNavBar_1 = require("../../components/LeftNavBar");
const SecretInput_1 = __importDefault(require("../../components/ui/input/SecretInput"));
const store_1 = require("../../store");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const useEnvironment_1 = require("../../hooks/useEnvironment");
const slack_connection_1 = require("../../utils/slack-connection");
const WebhookCheckboxes_1 = __importDefault(require("./WebhookCheckboxes"));
const EnvironmentSettings = () => {
    var _a;
    const env = (0, store_1.useStore)((state) => state.env);
    const [secretKey, setSecretKey] = (0, react_1.useState)('');
    const [secretKeyRotatable, setSecretKeyRotatable] = (0, react_1.useState)(true);
    const [hasPendingSecretKey, setHasPendingSecretKey] = (0, react_1.useState)(false);
    const [publicKey, setPublicKey] = (0, react_1.useState)('');
    const [publicKeyRotatable, setPublicKeyRotatable] = (0, react_1.useState)(true);
    const [hasPendingPublicKey, setHasPendingPublicKey] = (0, react_1.useState)(false);
    const [callbackUrl, setCallbackUrl] = (0, react_1.useState)('');
    const [hostUrl, setHostUrl] = (0, react_1.useState)('');
    const [webhookUrl, setWebhookUrl] = (0, react_1.useState)('');
    const [callbackEditMode, setCallbackEditMode] = (0, react_1.useState)(false);
    const [webhookEditMode, setWebhookEditMode] = (0, react_1.useState)(false);
    const [webhookUrlSecondary, setWebhookUrlSecondary] = (0, react_1.useState)('');
    const [webhookSecondaryEditMode, setWebhookSecondaryEditMode] = (0, react_1.useState)(false);
    const [slackIsConnected, setSlackIsConnected] = (0, react_1.useState)(false);
    const [slackIsConnecting, setSlackIsConnecting] = (0, react_1.useState)(false);
    const [slackConnectedChannel, setSlackConnectedChannel] = (0, react_1.useState)('');
    const [hmacKey, setHmacKey] = (0, react_1.useState)('');
    const [hmacEnabled, setHmacEnabled] = (0, react_1.useState)(false);
    const [accountUUID, setAccountUUID] = (0, react_1.useState)('');
    const [webhookCheckboxSettings, setWebhookCheckboxSettings] = (0, react_1.useState)({
        alwaysSendWebhook: false,
        sendAuthWebhook: false,
        sendRefreshFailedWebhook: false,
        sendSyncFailedWebhook: false
    });
    const [hmacEditMode, setHmacEditMode] = (0, react_1.useState)(false);
    const [envVariables, setEnvVariables] = (0, react_1.useState)([]);
    const editCallbackUrlAPI = (0, api_1.useEditCallbackUrlAPI)(env);
    const editWebhookUrlAPI = (0, api_1.useEditWebhookUrlAPI)(env);
    const editWebhookSecondaryUrlAPI = (0, api_1.useEditWebhookSecondaryUrlAPI)(env);
    const editHmacEnabled = (0, api_1.useEditHmacEnabledAPI)(env);
    const editHmacKey = (0, api_1.useEditHmacKeyAPI)(env);
    const editEnvVariables = (0, api_1.useEditEnvVariablesAPI)(env);
    const { setVisible, bindings } = (0, core_1.useModal)();
    const { setVisible: setSecretVisible, bindings: secretBindings } = (0, core_1.useModal)();
    const { environmentAndAccount, mutate } = (0, useEnvironment_1.useEnvironment)(env);
    (0, react_1.useEffect)(() => {
        setEnvVariables(envVariables.filter((env) => env.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [env]);
    (0, react_1.useEffect)(() => {
        if (!environmentAndAccount) {
            return;
        }
        const { environment, host, uuid, env_variables, slack_notifications_channel, webhook_settings } = environmentAndAccount;
        setSecretKey(environment.pending_secret_key || environment.secret_key);
        setSecretKeyRotatable(environment.secret_key_rotatable !== false);
        setHasPendingSecretKey(Boolean(environment.pending_secret_key));
        setPublicKey(environment.pending_public_key || environment.public_key);
        setPublicKeyRotatable(environment.public_key_rotatable !== false);
        setHasPendingPublicKey(Boolean(environment.pending_public_key));
        setCallbackUrl(environment.callback_url || (0, utils_1.defaultCallback)());
        if (webhook_settings) {
            setWebhookCheckboxSettings({
                alwaysSendWebhook: webhook_settings.on_sync_completion_always,
                sendAuthWebhook: webhook_settings.on_auth_creation,
                sendRefreshFailedWebhook: webhook_settings.on_auth_refresh_error,
                sendSyncFailedWebhook: webhook_settings.on_sync_error
            });
            setWebhookUrl(webhook_settings.primary_url);
            setWebhookUrlSecondary(webhook_settings.secondary_url);
        }
        setHostUrl(host);
        setAccountUUID(uuid);
        setHmacEnabled(environment.hmac_enabled);
        setHmacKey(environment.hmac_key || '');
        setSlackIsConnected(environment.slack_notifications);
        setSlackConnectedChannel(slack_notifications_channel);
        setEnvVariables(env_variables);
    }, [environmentAndAccount]);
    const handleCallbackSave = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield editCallbackUrlAPI(target.callback_url.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Callback URL updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setCallbackEditMode(false);
            setCallbackUrl(target.callback_url.value || (0, utils_1.defaultCallback)());
            void mutate();
        }
    });
    const handleWebhookEditSave = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield editWebhookUrlAPI(target.webhook_url.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Wehook URL updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setWebhookEditMode(false);
            setWebhookUrl(target.webhook_url.value);
            void mutate();
        }
    });
    const handleWebhookSecondaryEditSave = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield editWebhookSecondaryUrlAPI(target.webhook_url_secondary.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Secondary Wehook URL updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setWebhookSecondaryEditMode(false);
            setWebhookUrlSecondary(target.webhook_url_secondary.value);
            void mutate();
        }
    });
    const handleCallbackEdit = () => {
        setCallbackEditMode(true);
    };
    const handleHmacEnabled = (checked) => __awaiter(void 0, void 0, void 0, function* () {
        if (!hmacKey && checked) {
            react_toastify_1.toast.error('Cannot enable HMAC without an HMAC key.', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else {
            setHmacEnabled(checked);
            editHmacEnabled(checked).then(() => {
                react_toastify_1.toast.success(checked ? 'HMAC enabled.' : 'HMAC disabled.', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                void mutate();
            });
        }
    });
    const handleHmacSave = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const target = e.target;
        const res = yield editHmacKey(target.hmac_key.value);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('HMAC key updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setHmacEditMode(false);
            setHmacKey(target.hmac_key.value);
            void mutate();
        }
        setHmacEditMode(false);
    });
    const handleEnvVariablesSave = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const formData = new FormData(e.target);
        const entries = Array.from(formData.entries());
        const envVariablesArray = entries.reduce((acc, [key, value]) => {
            // we use the index to match on the name and value
            // but strip everything before the dash to remove the dynamic aspect
            // to the name. The dynamic aspect is needed to make sure the values
            // show correctly when reloading environments
            const strippedKey = key.split('-')[1];
            const match = strippedKey.match(/^env_var_(name|value)_(\d+)$/);
            if (match) {
                const type = match[1];
                const index = parseInt(match[2], 10);
                if (!acc[index]) {
                    acc[index] = {};
                }
                if (type === 'name') {
                    acc[index].name = value;
                }
                else if (type === 'value') {
                    acc[index].value = value;
                }
            }
            return acc;
        }, []);
        const res = yield editEnvVariables(envVariablesArray);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Environment variables updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            void mutate();
        }
    });
    const handleAddEnvVariable = () => {
        setEnvVariables([...envVariables, { name: '', value: '' }]);
    };
    const handleRemoveEnvVariable = (index) => __awaiter(void 0, void 0, void 0, function* () {
        setEnvVariables(envVariables.filter((_, i) => i !== index));
        const strippedEnvVariables = envVariables.filter((_, i) => i !== index).filter((envVariable) => envVariable.name && envVariable.value);
        const res = yield editEnvVariables(strippedEnvVariables);
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            react_toastify_1.toast.success('Environment variables updated!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            void mutate();
        }
    });
    const handleActivatePublicKey = () => __awaiter(void 0, void 0, void 0, function* () {
        setVisible(true);
    });
    const handleActivateSecretKey = () => __awaiter(void 0, void 0, void 0, function* () {
        setSecretVisible(true);
    });
    const onRotateKey = (publicKey = true) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, api_1.apiFetch)(`/api/v1/environment/rotate-key?env=${env}`, {
            method: 'POST',
            body: JSON.stringify({
                type: publicKey ? 'public' : 'secret'
            })
        });
        if (res.status === 200) {
            const key = (yield res.json())['key'];
            if (publicKey) {
                setPublicKey(key);
                setHasPendingPublicKey(true);
                react_toastify_1.toast.success('New public key generated', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            }
            else {
                setSecretKey(key);
                setHasPendingSecretKey(true);
                react_toastify_1.toast.success('New secret key generated', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            }
            void mutate();
        }
    });
    const onRevertKey = (publicKey = true) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, api_1.apiFetch)(`/api/v1/environment/revert-key?env=${env}`, {
            method: 'POST',
            body: JSON.stringify({
                type: publicKey ? 'public' : 'secret'
            })
        });
        if (res.status === 200) {
            const key = (yield res.json())['key'];
            if (publicKey) {
                setPublicKey(key);
                setHasPendingPublicKey(false);
                react_toastify_1.toast.success('Public key reverted', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            }
            else {
                setSecretKey(key);
                setHasPendingSecretKey(false);
                react_toastify_1.toast.success('Secret key reverted', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            }
            void mutate();
        }
    });
    const onActivateKey = (publicKey = true) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, api_1.apiFetch)(`/api/v1/environment/activate-key?env=${env}`, {
            method: 'POST',
            body: JSON.stringify({
                type: publicKey ? 'public' : 'secret'
            })
        });
        if (res.status === 200) {
            if (publicKey) {
                react_toastify_1.toast.success('New public key activated', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                setVisible(false);
                setHasPendingPublicKey(false);
            }
            else {
                react_toastify_1.toast.success('New secret key activated', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
                setSecretVisible(false);
                setHasPendingSecretKey(false);
            }
            void mutate();
        }
    });
    const updateSlackNotifications = (enabled) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, api_1.apiFetch)(`/api/v1/environment/slack-notifications-enabled?env=${env}`, {
            method: 'POST',
            body: JSON.stringify({
                slack_notifications: enabled
            })
        });
    });
    const disconnectSlack = () => __awaiter(void 0, void 0, void 0, function* () {
        yield updateSlackNotifications(false);
        const res = yield (0, api_1.apiFetch)(`/api/v1/connection/admin/account-${accountUUID}-${env}?env=${env}`, {
            method: 'DELETE'
        });
        if (res.status !== 204) {
            react_toastify_1.toast.error('There was a problem when disconnecting Slack', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else {
            react_toastify_1.toast.success('Slack was disconnected successfully.', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setSlackIsConnected(false);
            void mutate();
        }
    });
    const createSlackConnection = () => __awaiter(void 0, void 0, void 0, function* () {
        setSlackIsConnecting(true);
        const onFinish = () => {
            setSlackIsConnected(true);
            react_toastify_1.toast.success('Slack connection created!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            void mutate();
            setSlackIsConnecting(false);
        };
        const onFailure = () => {
            react_toastify_1.toast.error('Something went wrong during the lookup for the Slack connect', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            setSlackIsConnecting(false);
        };
        yield (0, slack_connection_1.connectSlack)({ accountUUID, env, hostUrl, onFinish, onFailure });
    });
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.EnvironmentSettings}>
            <core_1.Modal {...bindings} wrapClassName="!w-max overflow-visible">
                <div className="flex justify-between">
                    <div className="flex h-full">
                        <span className="flex bg-red-200 w-10 h-10 rounded-full items-center justify-center">
                            <icons_1.AlertTriangle className="stroke-red-600"/>
                        </span>
                    </div>
                    <div>
                        <core_1.Modal.Title className="text-lg">Activate new public key?</core_1.Modal.Title>
                        <core_1.Modal.Content>
                            <p>
                                Make sure your code uses the new public key before activating. All authorization attempts with the previous public key will fail
                                when the new key is activated.
                            </p>
                        </core_1.Modal.Content>
                    </div>
                </div>
                <core_1.Modal.Action placeholder={null} passive className="!text-lg" onClick={() => setVisible(false)} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Cancel
                </core_1.Modal.Action>
                <core_1.Modal.Action placeholder={null} className="!bg-red-500 !text-white !text-lg" onClick={() => onActivateKey()} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Activate
                </core_1.Modal.Action>
            </core_1.Modal>
            <core_1.Modal {...secretBindings} wrapClassName="!w-max overflow-visible">
                <div className="flex justify-between">
                    <div className="flex h-full">
                        <span className="flex bg-red-200 w-10 h-10 rounded-full items-center justify-center">
                            <icons_1.AlertTriangle className="stroke-red-600"/>
                        </span>
                    </div>
                    <div>
                        <core_1.Modal.Title className="text-lg">Activate new secret key?</core_1.Modal.Title>
                        <core_1.Modal.Content>
                            <p>
                                Make sure your code uses the new secret key before activating. All requests made with the previous secret key will fail as soon
                                as the new key is activated.
                            </p>
                        </core_1.Modal.Content>
                    </div>
                </div>
                <core_1.Modal.Action placeholder={null} passive className="!text-lg" onClick={() => setSecretVisible(false)} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Cancel
                </core_1.Modal.Action>
                <core_1.Modal.Action placeholder={null} className="!bg-red-500 !text-white !text-lg" onClick={() => onActivateKey(false)} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    Activate
                </core_1.Modal.Action>
            </core_1.Modal>
            {secretKey && (<div className="">
                    <h2 className="text-left text-3xl font-semibold tracking-tight text-white mb-12">Environment Settings</h2>
                    <div className="border border-border-gray rounded-md h-fit pt-6 pb-14">
                        <div>
                            <div className="mx-8 mt-8">
                                <div className="flex">
                                    <label htmlFor="public_key" className="text-text-light-gray block text-sm font-semibold mb-2">
                                        Public Key
                                    </label>
                                    <core_1.Tooltip text={<>
                                                <div className="flex text-black text-sm">
                                                    {`Used by the`}
                                                    <a href="https://docs.nango.dev/reference/sdks/frontend" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                        Frontend SDK
                                                    </a>
                                                    {'.'}
                                                </div>
                                            </>}>
                                        <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                    </core_1.Tooltip>
                                </div>
                                <div className="flex">
                                    <prism_1.Prism className="w-full" language="bash" colorScheme="dark">
                                        {publicKey}
                                    </prism_1.Prism>
                                    {publicKeyRotatable && (<>
                                            <button onClick={() => (hasPendingPublicKey ? onRevertKey() : onRotateKey())} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                                {hasPendingPublicKey ? 'Revert' : 'Rotate'}
                                            </button>
                                            <button onClick={handleActivatePublicKey} className={`${hasPendingPublicKey ? 'hover:bg-hover-gray bg-gray-800' : 'opacity-50'} text-red-500 flex h-11 rounded-md ml-2 px-4 pt-3 text-sm`} disabled={!hasPendingPublicKey}>
                                                Activate
                                            </button>
                                        </>)}
                                </div>
                                {hasPendingPublicKey && (<div className=" text-red-500 text-sm">
                                        Click &apos;Activate&apos; to use this new key. Until then, Nango expects the old key. After activation the old key
                                        won&apos;t work.
                                    </div>)}
                            </div>
                        </div>
                        <div>
                            <div className="mx-8 mt-8">
                                <div className="flex">
                                    <label htmlFor="secret_key" className="text-text-light-gray block text-sm font-semibold mb-2">
                                        Secret Key
                                    </label>
                                    <core_1.Tooltip text={<>
                                                <div className="flex text-black text-sm">
                                                    {`Used by the `}
                                                    <a href="https://docs.nango.dev/reference/cli" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                        CLI
                                                    </a>
                                                    {`, `}
                                                    <a href="https://docs.nango.dev/reference/sdks/node" target="_blank" rel="noreferrer" className="text-text-blue ml-1 mr-1">
                                                        Backend SDKs
                                                    </a>
                                                    {` and `}
                                                    <a href="https://docs.nango.dev/reference/api/authentication" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                        REST API
                                                    </a>
                                                    {'.'}
                                                </div>
                                            </>}>
                                        <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                    </core_1.Tooltip>
                                </div>
                                <div className="flex">
                                    <SecretInput_1.default additionalclass="w-full h-11" tall disabled copy={true} optionalvalue={secretKey} setoptionalvalue={setSecretKey}/>
                                    {secretKeyRotatable && (<>
                                            <button onClick={() => (hasPendingSecretKey ? onRevertKey(false) : onRotateKey(false))} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                                {hasPendingSecretKey ? 'Revert' : 'Rotate'}
                                            </button>
                                            <button onClick={handleActivateSecretKey} className={`${hasPendingSecretKey ? 'hover:bg-hover-gray bg-gray-800' : 'opacity-50'} text-red-500 flex h-11 rounded-md ml-2 px-4 pt-3 text-sm`} disabled={!hasPendingSecretKey}>
                                                Activate
                                            </button>
                                        </>)}
                                </div>
                                {hasPendingSecretKey && (<div className=" text-red-500 text-sm">
                                        Click &apos;Activate&apos; to use this new key. Until then, Nango expects the old key. After activation the old key
                                        won&apos;t work.
                                    </div>)}
                            </div>
                        </div>
                        {!(0, utils_1.isHosted)() && (<div className="flex items-center justify-between mx-8 mt-8">
                                <div>
                                    <label htmlFor="slack_alerts" className="flex text-text-light-gray items-center block text-sm font-semibold mb-2">
                                        Slack Alerts
                                        <core_1.Tooltip text={<div className="flex text-black text-sm">
                                                    {slackIsConnected
                        ? 'Stop receiving Slack alerts to a public channel of your choice when a syncs or actions fail.'
                        : 'Receive Slack alerts to a public channel of your choice when a syncs or actions fail.'}
                                                </div>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </label>
                                </div>
                                <div className="">
                                    <Button_1.default disabled={slackIsConnecting} className="items-center" variant="primary" onClick={slackIsConnected ? disconnectSlack : createSlackConnection}>
                                        <IntegrationLogo_1.default provider="slack" height={5} width={6} classNames=""/>
                                        {slackIsConnected ? `Disconnect ${slackConnectedChannel}` : 'Connect'}
                                    </Button_1.default>
                                </div>
                            </div>)}
                        <div>
                            <div className="mx-8 mt-8">
                                <div className="flex text-white  mb-2">
                                    <div className="flex">
                                        <label htmlFor="callback_url" className="text-text-light-gray block text-sm font-semibold mb-2">
                                            Callback URL
                                        </label>
                                        <core_1.Tooltip text={<>
                                                    <div className="flex text-black text-sm">
                                                        {`To register with external OAuth apps (cf. `}
                                                        <a href="https://docs.nango.dev/integrate/guides/authorize-an-api#use-a-custom-callback-url" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                            custom callback URL docs
                                                        </a>
                                                        {`).`}
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                </div>
                                {callbackEditMode && (<form className="mt-2" onSubmit={handleCallbackSave}>
                                        <div className="flex">
                                            <input id="callback_url" name="callback_url" autoComplete="new-password" type="url" defaultValue={callbackUrl} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none"/>

                                            <button type="submit" className="border-border-blue bg-bg-dark-blue active:ring-border-blue flex h-11 rounded-md border ml-4 px-4 pt-3 text-sm font-semibold text-blue-500 shadow-sm hover:border-2 active:ring-2 active:ring-offset-2">
                                                Save
                                            </button>
                                        </div>
                                        <p className="mt-2 text-sm text-red-700">
                                            {(0, utils_1.isCloud)() ? (<>
                                                    Customizing the callback URL requires that you set up a 308 redirect from the custom callback URL to
                                                    https://api.nango.dev/oauth/callback.
                                                </>) : (<>
                                                    Customizing the callback URL requires that you set up a redirect from the custom callback URL to{' '}
                                                    {(0, utils_1.defaultCallback)()}.
                                                </>)}
                                        </p>
                                    </form>)}
                                {!callbackEditMode && (<div className="flex">
                                        <prism_1.Prism language="bash" colorScheme="dark" className="w-full">
                                            {callbackUrl}
                                        </prism_1.Prism>
                                        <button onClick={handleCallbackEdit} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                            Edit
                                        </button>
                                    </div>)}
                            </div>
                        </div>
                        <div>
                            <div className="mx-8 mt-8">
                                <div className="flex">
                                    <label htmlFor="webhook_url" className="text-text-light-gray block text-sm font-semibold mb-2">
                                        Webhook URL
                                    </label>
                                    <core_1.Tooltip text={<>
                                                <div className="flex text-black text-sm">
                                                    {`Be notified when new data is available from Nango (cf. `}
                                                    <a href="https://docs.nango.dev/integrate/guides/sync-data-from-an-api#listen-for-webhooks-from-nango" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                        webhook docs
                                                    </a>
                                                    {`).`}
                                                </div>
                                            </>}>
                                        <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                    </core_1.Tooltip>
                                </div>
                                {webhookEditMode && (<form className="mt-2" onSubmit={handleWebhookEditSave}>
                                        <div className="flex">
                                            <input id="webhook_url" name="webhook_url" autoComplete="new-password" type="url" defaultValue={webhookUrl} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none"/>

                                            <button type="submit" className="border-border-blue bg-bg-dark-blue active:ring-border-blue flex h-11 rounded-md border ml-4 px-4 pt-3 text-sm font-semibold text-blue-500 shadow-sm hover:border-2 active:ring-2 active:ring-offset-2">
                                                Save
                                            </button>
                                        </div>
                                    </form>)}
                                {!webhookEditMode && (<div className="flex">
                                        <prism_1.Prism language="bash" colorScheme="dark" className="w-full">
                                            {webhookUrl || '\u0000'}
                                        </prism_1.Prism>
                                        <button onClick={() => setWebhookEditMode(!webhookEditMode)} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                            Edit
                                        </button>
                                    </div>)}
                            </div>
                        </div>
                        <div>
                            {!((_a = environmentAndAccount === null || environmentAndAccount === void 0 ? void 0 : environmentAndAccount.webhook_settings) === null || _a === void 0 ? void 0 : _a.secondary_url) && !webhookSecondaryEditMode ? (<button onClick={() => setWebhookSecondaryEditMode(true)} className="mx-8 mt-4 hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md px-4 pt-3 text-sm" type="button">
                                    Add Secondary Webhook URL
                                </button>) : (<>
                                    <div className="mx-8 mt-8">
                                        <div className="flex">
                                            <label htmlFor="webhook_url" className="text-text-light-gray block text-sm font-semibold mb-2">
                                                Secondary Webhook URL
                                            </label>
                                            <core_1.Tooltip text={<>
                                                        <div className="flex text-black text-sm">
                                                            {`Be notified when new data is available from Nango (cf. `}
                                                            <a href="https://docs.nango.dev/integrate/guides/sync-data-from-an-api#listen-for-webhooks-from-nango" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                                webhook docs
                                                            </a>
                                                            {`).`}
                                                        </div>
                                                    </>}>
                                                <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                            </core_1.Tooltip>
                                        </div>
                                        {webhookSecondaryEditMode && (<form className="mt-2" onSubmit={handleWebhookSecondaryEditSave}>
                                                <div className="flex">
                                                    <input id="webhook_url_secondary" name="webhook_url_secondary" autoComplete="new-password" type="url" defaultValue={webhookUrlSecondary} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none"/>

                                                    <button type="submit" className="border-border-blue bg-bg-dark-blue active:ring-border-blue flex h-11 rounded-md border ml-4 px-4 pt-3 text-sm font-semibold text-blue-500 shadow-sm hover:border-2 active:ring-2 active:ring-offset-2">
                                                        Save
                                                    </button>
                                                </div>
                                            </form>)}
                                        {!webhookSecondaryEditMode && (<div className="flex">
                                                <prism_1.Prism language="bash" colorScheme="dark" className="w-full">
                                                    {webhookUrlSecondary || '\u0000'}
                                                </prism_1.Prism>
                                                <button onClick={() => setWebhookSecondaryEditMode(!webhookSecondaryEditMode)} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                                    Edit
                                                </button>
                                            </div>)}
                                    </div>
                                </>)}
                        </div>
                        <WebhookCheckboxes_1.default mutate={mutate} env={env} checkboxState={webhookCheckboxSettings} setCheckboxState={setWebhookCheckboxSettings}/>
                        <div>
                            <div className="mx-8 mt-8 relative">
                                <div className="flex mb-2">
                                    <div className="flex text-white mb-2">
                                        <div className="flex">
                                            <label htmlFor="hmac key" className="text-text-light-gray block text-sm font-semibold">
                                                HMAC Key
                                            </label>
                                            <core_1.Tooltip text={<>
                                                        <div className="flex text-black text-sm">
                                                            {`To secure the Frontend SDK calls with`}
                                                            <a href="https://docs.nango.dev/integrate/guides/authorize-an-api#secure-the-frontend-sdk" target="_blank" rel="noreferrer" className="text-text-blue ml-1">
                                                                HMAC
                                                            </a>
                                                            {`.`}
                                                        </div>
                                                    </>}>
                                                <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                            </core_1.Tooltip>
                                        </div>
                                    </div>
                                </div>
                                {!hmacEditMode && (<div className="flex">
                                        <SecretInput_1.default disabled optionalvalue={hmacKey} setoptionalvalue={setHmacKey} additionalclass="w-full" tall/>
                                        <button onClick={() => setHmacEditMode(!hmacEditMode)} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md ml-4 px-4 pt-3 text-sm">
                                            Edit
                                        </button>
                                    </div>)}
                                {hmacEditMode && (<form className="mt-2" onSubmit={handleHmacSave}>
                                        <div className="flex">
                                            <input id="hmac_key" name="hmac_key" autoComplete="new-password" type="text" value={hmacKey || ''} onChange={(event) => setHmacKey(event.target.value)} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none"/>
                                            <button type="submit" className="border-border-blue bg-bg-dark-blue active:ring-border-blue flex h-11 rounded-md border ml-4 px-4 pt-3 text-sm font-semibold text-blue-500 shadow-sm hover:border-2 active:ring-2 active:ring-offset-2">
                                                Save
                                            </button>
                                        </div>
                                    </form>)}
                            </div>
                        </div>
                        <div>
                            <div className="mx-8 mt-8">
                                <div className="flex items-center mb-2">
                                    <label htmlFor="hmac_enabled" className="text-text-light-gray text-sm font-semibold">
                                        HMAC Enabled
                                    </label>
                                    <input type="checkbox" className="flex ml-3 bg-black" checked={hmacEnabled} onChange={(event) => handleHmacEnabled(event.target.checked)}/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="mx-8 mt-8">
                                <div className="flex items-center mb-2">
                                    <label htmlFor="email" className="text-text-light-gray text-sm font-semibold">
                                        Environment Variables
                                    </label>
                                    <core_1.Tooltip text={<div className="flex text-black text-sm">Set environment variables to be used inside sync and action scripts.</div>}>
                                        <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                    </core_1.Tooltip>
                                </div>
                                <form className="mt-2" onSubmit={handleEnvVariablesSave}>
                                    {envVariables.map((envVar, index) => (<div key={envVar.id || `${envVar.name}_${index}`} className="flex items-center mt-2">
                                            <input id={`env_var_name_${envVar.id || index}`} name={`${envVar.id || index}-env_var_name_${index}`} defaultValue={envVar.name} autoComplete="new-password" required type="text" className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none mr-3"/>
                                            <input id={`env_var_value_${envVar.id || index}`} name={`${envVar.id || index}-env_var_value_${index}`} defaultValue={envVar.value} required autoComplete="new-password" type="password" onMouseEnter={(e) => (e.currentTarget.type = 'text')} onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                        e.currentTarget.type = 'password';
                    }
                }} onFocus={(e) => (e.currentTarget.type = 'text')} onBlur={(e) => (e.currentTarget.type = 'password')} className="border-border-gray bg-bg-black text-text-light-gray focus:ring-blue block h-11 w-full appearance-none rounded-md border text-base placeholder-gray-600 shadow-sm focus:border-blue-500 focus:outline-none"/>
                                            <button onClick={() => handleRemoveEnvVariable(index)} className="flex hover:bg-hover-gray text-white h-11 ml-4 px-4 pt-3 text-sm" type="button">
                                                <outline_1.TrashIcon className="flex h-5 w-5 text-white"/>
                                            </button>
                                        </div>))}
                                    <div className="flex justify-end mt-4">
                                        <button onClick={handleAddEnvVariable} className="hover:bg-hover-gray bg-gray-800 text-white flex h-11 rounded-md px-4 pt-3 text-sm mr-4" type="button">
                                            Add Environment Variable
                                        </button>
                                        <button type="submit" className="hover:bg-gray-200 bg-white text-gray-700 flex h-11 rounded-md px-4 pt-3 text-sm">
                                            Save Environment Variable
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>)}
        </DashboardLayout_1.default>);
};
exports.EnvironmentSettings = EnvironmentSettings;
//# sourceMappingURL=Settings.js.map