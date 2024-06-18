"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const react_1 = require("react");
const swr_1 = require("swr");
const frontend_1 = __importStar(require("@nangohq/frontend"));
const prism_1 = require("@mantine/prism");
const icons_1 = require("@geist-ui/icons");
const core_1 = require("@geist-ui/core");
const useSet_1 = __importDefault(require("../../hooks/useSet"));
const utils_1 = require("../../utils/utils");
const api_1 = require("../../utils/api");
const analytics_1 = require("../../utils/analytics");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const TagsInput_1 = __importDefault(require("../../components/ui/input/TagsInput"));
const LeftNavBar_1 = require("../../components/LeftNavBar");
const SecretInput_1 = __importDefault(require("../../components/ui/input/SecretInput"));
const SecretTextArea_1 = __importDefault(require("../../components/ui/input/SecretTextArea"));
const store_1 = require("../../store");
const useEnvironment_1 = require("../../hooks/useEnvironment");
function IntegrationCreate() {
    var _a;
    const { mutate } = (0, swr_1.useSWRConfig)();
    const env = (0, store_1.useStore)((state) => state.env);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const [integrations, setIntegrations] = (0, react_1.useState)(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [integration, setIntegration] = (0, react_1.useState)(null);
    const [connectionId, setConnectionId] = (0, react_1.useState)('test-connection-id');
    const [authMode, setAuthMode] = (0, react_1.useState)('OAUTH2');
    const [connectionConfigParams, setConnectionConfigParams] = (0, react_1.useState)(null);
    const [authorizationParams, setAuthorizationParams] = (0, react_1.useState)(null);
    const [authorizationParamsError, setAuthorizationParamsError] = (0, react_1.useState)(false);
    const [selectedScopes, addToScopesSet, removeFromSelectedSet] = (0, useSet_1.default)();
    const [oauthSelectedScopes, oauthAddToScopesSet, oauthRemoveFromSelectedSet] = (0, useSet_1.default)();
    const [publicKey, setPublicKey] = (0, react_1.useState)('');
    const [hostUrl, setHostUrl] = (0, react_1.useState)('');
    const [websocketsPath, setWebsocketsPath] = (0, react_1.useState)('');
    const [isHmacEnabled, setIsHmacEnabled] = (0, react_1.useState)(false);
    const [hmacDigest, setHmacDigest] = (0, react_1.useState)('');
    const getIntegrationListAPI = (0, api_1.useGetIntegrationListAPI)(env);
    const [apiKey, setApiKey] = (0, react_1.useState)('');
    const [apiAuthUsername, setApiAuthUsername] = (0, react_1.useState)('');
    const [apiAuthPassword, setApiAuthPassword] = (0, react_1.useState)('');
    const [oAuthClientId, setOAuthClientId] = (0, react_1.useState)('');
    const [oAuthClientSecret, setOAuthClientSecret] = (0, react_1.useState)('');
    const [privateKeyId, setPrivateKeyId] = (0, react_1.useState)('');
    const [privateKey, setPrivateKey] = (0, react_1.useState)('');
    const [issuerId, setIssuerId] = (0, react_1.useState)('');
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const getHmacAPI = (0, api_1.useGetHmacAPI)(env);
    const { providerConfigKey } = (0, react_router_dom_1.useParams)();
    const { environmentAndAccount } = (0, useEnvironment_1.useEnvironment)(env);
    (0, react_1.useEffect)(() => {
        setLoaded(false);
    }, [env]);
    (0, react_1.useEffect)(() => {
        const getHmac = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getHmacAPI(integration === null || integration === void 0 ? void 0 : integration.uniqueKey, connectionId);
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const hmacDigest = (yield res.json())['hmac_digest'];
                setHmacDigest(hmacDigest);
            }
        });
        if (isHmacEnabled && (integration === null || integration === void 0 ? void 0 : integration.uniqueKey) && connectionId) {
            void getHmac();
        }
    }, [isHmacEnabled, integration === null || integration === void 0 ? void 0 : integration.uniqueKey, connectionId]);
    (0, react_1.useEffect)(() => {
        const getIntegrations = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getIntegrationListAPI();
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const data = yield res.json();
                setIntegrations(data['integrations']);
                if (data['integrations'] && data['integrations'].length > 0) {
                    const defaultIntegration = providerConfigKey
                        ? data['integrations'].find((i) => i.uniqueKey === providerConfigKey)
                        : data['integrations'][0];
                    setIntegration(defaultIntegration);
                    setUpConnectionConfigParams(defaultIntegration);
                    setAuthMode(defaultIntegration.authMode);
                }
            }
        });
        if (environmentAndAccount) {
            const { environment, host } = environmentAndAccount;
            setPublicKey(environment.public_key);
            setHostUrl(host || (0, utils_1.baseUrl)());
            setWebsocketsPath(environment.websockets_path || '');
            setIsHmacEnabled(Boolean(environment.hmac_key));
        }
        if (!loaded) {
            setLoaded(true);
            void getIntegrations();
        }
    }, [loaded, setLoaded, setIntegrations, setIntegration, getIntegrationListAPI, environmentAndAccount, setPublicKey, providerConfigKey]);
    const handleCreate = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setServerErrorMessage('');
        const target = e.target;
        const nango = new frontend_1.default({ host: hostUrl, websocketsPath, publicKey });
        let credentials = {};
        let params = connectionConfigParams || {};
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        Object.keys(params).forEach((key) => params[key] === '' && delete params[key]);
        if (authMode === 'BASIC') {
            credentials = {
                username: apiAuthUsername,
                password: apiAuthPassword
            };
        }
        if (authMode === 'API_KEY') {
            credentials = {
                apiKey
            };
        }
        if (authMode === 'APP_STORE') {
            credentials = {
                privateKeyId,
                issuerId,
                privateKey
            };
        }
        if (authMode === 'OAUTH2') {
            credentials = {
                oauth_client_id_override: oAuthClientId,
                oauth_client_secret_override: oAuthClientSecret
            };
            if (oauthSelectedScopes.length > 0) {
                params = Object.assign(Object.assign({}, params), { oauth_scopes_override: oauthSelectedScopes.join(',') });
            }
        }
        if (authMode === 'OAUTH2_CC') {
            credentials = {
                client_id: oAuthClientId,
                client_secret: oAuthClientSecret
            };
        }
        nango[authMode === 'NONE' ? 'create' : 'auth'](target.integration_unique_key.value, target.connection_id.value, {
            user_scope: selectedScopes || [],
            params,
            authorization_params: authorizationParams || {},
            hmac: hmacDigest || '',
            credentials
        })
            .then(() => {
            react_toastify_1.toast.success('Connection created!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            analyticsTrack('web:connection_created', { provider: (integration === null || integration === void 0 ? void 0 : integration.provider) || 'unknown' });
            void mutate((key) => typeof key === 'string' && key.startsWith('/api/v1/connection'), undefined);
            navigate(`/${env}/connections`, { replace: true });
        })
            .catch((err) => {
            setServerErrorMessage(err instanceof frontend_1.AuthError ? `${err.type} error: ${err.message}` : 'unknown error');
        });
    });
    const setUpConnectionConfigParams = (integration) => {
        if (integration == null) {
            return;
        }
        if (integration.connectionConfigParams == null || integration.connectionConfigParams.length === 0) {
            setConnectionConfigParams(null);
            return;
        }
        const params = {};
        for (const key of Object.keys(integration.connectionConfigParams)) {
            params[key] = '';
        }
        setConnectionConfigParams(params);
    };
    const handleIntegrationUniqueKeyChange = (e) => {
        const integration = integrations === null || integrations === void 0 ? void 0 : integrations.find((i) => i.uniqueKey === e.target.value);
        if (integration != null) {
            setIntegration(integration);
            setUpConnectionConfigParams(integration);
            setAuthMode(integration.authMode);
        }
    };
    const handleConnectionIdChange = (e) => {
        setConnectionId(e.target.value);
    };
    const handleConnectionConfigParamsChange = (e) => {
        const params = connectionConfigParams ? Object.assign({}, connectionConfigParams) : {}; // Copy object to update UI.
        params[e.target.name.replace('connection-config-', '')] = e.target.value;
        setConnectionConfigParams(params);
    };
    const handleAuthorizationParamsChange = (e) => {
        try {
            setAuthorizationParams(JSON.parse(e.target.value));
            setAuthorizationParamsError(false);
        }
        catch (_a) {
            setAuthorizationParams(null);
            setAuthorizationParamsError(true);
        }
    };
    const snippet = () => {
        const args = [];
        if ((0, utils_1.isStaging)() || (0, utils_1.isHosted)()) {
            args.push(`host: '${hostUrl}'`);
            if (websocketsPath && websocketsPath !== '/') {
                args.push(`websocketsPath: '${websocketsPath}'`);
            }
        }
        if (publicKey) {
            args.push(`publicKey: '${publicKey}'`);
        }
        const argsStr = args.length > 0 ? `{ ${args.join(', ')} }` : '';
        let connectionConfigParamsStr = '';
        // Iterate of connection config params and create a string.
        if (connectionConfigParams != null && Object.keys(connectionConfigParams).length >= 0) {
            connectionConfigParamsStr = 'params: { ';
            let hasAnyValue = false;
            for (const [key, value] of Object.entries(connectionConfigParams)) {
                if (value !== '') {
                    connectionConfigParamsStr += `${key}: '${value}', `;
                    hasAnyValue = true;
                }
            }
            connectionConfigParamsStr = connectionConfigParamsStr.slice(0, -2);
            connectionConfigParamsStr += ' }';
            if (!hasAnyValue) {
                connectionConfigParamsStr = '';
            }
        }
        if (authMode === 'OAUTH2' && oauthSelectedScopes.length > 0) {
            if (connectionConfigParamsStr) {
                connectionConfigParamsStr += ', ';
            }
            else {
                connectionConfigParamsStr = 'params: { ';
            }
            connectionConfigParamsStr += `oauth_scopes_override: '${oauthSelectedScopes.join(',')}', `;
            connectionConfigParamsStr = connectionConfigParamsStr.slice(0, -2);
            connectionConfigParamsStr += ' }';
        }
        let authorizationParamsStr = '';
        // Iterate of authorization params and create a string.
        if (authorizationParams != null && Object.keys(authorizationParams).length >= 0 && Object.keys(authorizationParams)[0]) {
            authorizationParamsStr = 'authorization_params: { ';
            for (const [key, value] of Object.entries(authorizationParams)) {
                authorizationParamsStr += `${key}: '${value}', `;
            }
            authorizationParamsStr = authorizationParamsStr.slice(0, -2);
            authorizationParamsStr += ' }';
        }
        let hmacKeyStr = '';
        if (hmacDigest) {
            hmacKeyStr = `hmac: '${hmacDigest}'`;
        }
        let userScopesStr = '';
        if (selectedScopes != null && selectedScopes.length > 0) {
            userScopesStr = 'user_scope: [ ';
            for (const scope of selectedScopes) {
                userScopesStr += `'${scope}', `;
            }
            userScopesStr = userScopesStr.slice(0, -2);
            userScopesStr += ' ]';
        }
        let apiAuthString = '';
        if ((integration === null || integration === void 0 ? void 0 : integration.authMode) === 'API_KEY') {
            apiAuthString = `
    credentials: {
      apiKey: '${apiKey}'
    }
  `;
        }
        if ((integration === null || integration === void 0 ? void 0 : integration.authMode) === 'BASIC') {
            apiAuthString = `
    credentials: {
      username: '${apiAuthUsername}',
      password: '${apiAuthPassword}'
    }
  `;
        }
        let appStoreAuthString = '';
        if ((integration === null || integration === void 0 ? void 0 : integration.authMode) === 'APP_STORE') {
            appStoreAuthString = `
    credentials: {
        privateKeyId: '${privateKeyId}',
        issuerId: '${issuerId}',
        privateKey: '${privateKey}'
    }
  `;
        }
        let oauthCredentialsString = '';
        if ((integration === null || integration === void 0 ? void 0 : integration.authMode) === 'OAUTH2' && oAuthClientId && oAuthClientSecret) {
            oauthCredentialsString = `
    credentials: {
        oauth_client_id_override: '${oAuthClientId}',
        oauth_client_secret_override: '${oAuthClientSecret}'
    }
  `;
        }
        let oauth2ClientCredentialsString = '';
        if ((integration === null || integration === void 0 ? void 0 : integration.authMode) === 'OAUTH2_CC') {
            if (oAuthClientId && oAuthClientSecret) {
                oauth2ClientCredentialsString = `
    credentials: {
        client_id: '${oAuthClientId}',
        client_secret: '${oAuthClientSecret}'
    }
  `;
            }
            if (oAuthClientId && !oAuthClientSecret) {
                oauth2ClientCredentialsString = `
    credentials: {
        client_id: '${oAuthClientId}'
    }
  `;
            }
            if (!oAuthClientId && oAuthClientSecret) {
                oauth2ClientCredentialsString = `
    credentials: {
        client_secret: '${oAuthClientSecret}'
    }
  `;
            }
        }
        const connectionConfigStr = !connectionConfigParamsStr &&
            !authorizationParamsStr &&
            !userScopesStr &&
            !hmacKeyStr &&
            !apiAuthString &&
            !appStoreAuthString &&
            !oauthCredentialsString &&
            !oauth2ClientCredentialsString
            ? ''
            : ', { ' +
                [
                    connectionConfigParamsStr,
                    authorizationParamsStr,
                    hmacKeyStr,
                    userScopesStr,
                    apiAuthString,
                    appStoreAuthString,
                    oauthCredentialsString,
                    oauth2ClientCredentialsString
                ]
                    .filter(Boolean)
                    .join(', ') +
                '}';
        return `import Nango from '@nangohq/frontend';

const nango = new Nango(${argsStr});

nango.${(integration === null || integration === void 0 ? void 0 : integration.authMode) === 'NONE' ? 'create' : 'auth'}('${integration === null || integration === void 0 ? void 0 : integration.uniqueKey}', '${connectionId}'${connectionConfigStr})
  .then((result: { providerConfigKey: string; connectionId: string }) => {
    // do something
  }).catch((err: { message: string; type: string }) => {
    // handle error
  });`;
    };
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Connections}>
            {integrations && !!integrations.length && publicKey && hostUrl && (<div className="pb-40">
                    <h2 className="text-left text-3xl font-semibold tracking-tight text-white mb-12">Add New Connection</h2>
                    <div className="h-fit border border-border-gray rounded-md text-white text-sm py-14 px-8">
                        <form className="space-y-6" onSubmit={handleCreate}>
                            <div>
                                <div>
                                    <div className="flex">
                                        <label htmlFor="integration_unique_key" className="text-text-light-gray block text-sm font-semibold">
                                            Integration Unique Key
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <select id="integration_unique_key" name="integration_unique_key" className="border-border-gray bg-active-gray text-text-light-gray focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-1 text-sm placeholder-gray-400 shadow-sm focus:outline-none" onChange={handleIntegrationUniqueKeyChange} defaultValue={integration === null || integration === void 0 ? void 0 : integration.uniqueKey}>
                                            {integrations.map((integration) => (<option key={integration.uniqueKey}>{integration.uniqueKey}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex mt-6">
                                        <label htmlFor="connection_id" className="text-text-light-gray block text-sm font-semibold">
                                            Connection ID
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p>{`The ID you will use to retrieve the connection (most often the user ID).`}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                    <div className="mt-1">
                                        <input id="connection_id" name="connection_id" type="text" defaultValue={connectionId} autoComplete="new-password" required className="border-border-gray bg-active-gray text-text-light-gray focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-1 text-sm placeholder-gray-400 shadow-sm focus:outline-none" onChange={handleConnectionIdChange}/>
                                    </div>
                                </div>
                            </div>
                            {(integration === null || integration === void 0 ? void 0 : integration.provider) === 'slack' && (<div>
                                    <div className="flex mt-6">
                                        <label htmlFor="user_scopes" className="text-text-light-gray block text-sm font-semibold">
                                            User Scopes (Slack Only)
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <TagsInput_1.default id="scopes" name="user_scopes" type="text" defaultValue={''} onChange={() => null} selectedScopes={selectedScopes} addToScopesSet={addToScopesSet} removeFromSelectedSet={removeFromSelectedSet} minLength={1}/>
                                    </div>
                                </div>)}

                            {authMode === 'OAUTH2_CC' && (<>
                                    <div className="flex flex-col">
                                        <div className="flex items-center mb-1">
                                            <span className="text-gray-400 text-xs">Client ID</span>
                                        </div>
                                        <div className="flex text-white mt-1 items-center">
                                            <div className="w-full relative">
                                                <SecretInput_1.default copy={true} id="oauth_client_id" name="oauth_client_id" placeholder="Find the Client ID on the developer portal of the external API provider." optionalvalue={oAuthClientId} setoptionalvalue={setOAuthClientId}/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center mb-1">
                                            <span className="text-gray-400 text-xs">Client Secret</span>
                                        </div>
                                        <div className="mt-1">
                                            <SecretInput_1.default copy={true} id="client_secret" name="client_secret" autoComplete="one-time-code" placeholder="Find the Client Secret on the developer portal of the external API provider." required optionalvalue={oAuthClientSecret} setoptionalvalue={setOAuthClientSecret}/>
                                        </div>
                                    </div>
                                </>)}

                            {(integration === null || integration === void 0 ? void 0 : integration.provider) === 'netsuite' && (<div>
                                    <div className="flex mt-6">
                                        <label htmlFor="user_scopes" className="text-text-light-gray block text-sm font-semibold">
                                            OAuth Credentials Override
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <SecretInput_1.default copy={true} id="oauth_client_id" name="oauth_client_id" placeholder="OAuth Client ID Override" optionalvalue={oAuthClientId} setoptionalvalue={setOAuthClientId}/>
                                    </div>
                                    <div className="mt-8">
                                        <SecretInput_1.default copy={true} id="oauth_client_secret" name="oauth_client_secret" placeholder="OAuth Client Secret Override" optionalvalue={oAuthClientSecret} setoptionalvalue={setOAuthClientSecret}/>
                                    </div>
                                    <div className="flex mt-6">
                                        <label htmlFor="oauth_scopes" className="text-text-light-gray block text-sm font-semibold">
                                            OAuth Scope Override
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <TagsInput_1.default id="scopes" name="oauth_scopes" type="text" defaultValue={''} onChange={() => null} selectedScopes={oauthSelectedScopes} addToScopesSet={oauthAddToScopesSet} removeFromSelectedSet={oauthRemoveFromSelectedSet} minLength={1}/>
                                    </div>
                                </div>)}

                            {(_a = integration === null || integration === void 0 ? void 0 : integration.connectionConfigParams) === null || _a === void 0 ? void 0 : _a.map((paramName) => (<div key={paramName}>
                                    <div className="flex mt-6">
                                        <label htmlFor="extra_configuration" className="text-text-light-gray block text-sm font-semibold">
                                            Extra Configuration: {paramName}
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p className="ml-1">{`Some integrations require extra configuration (cf.`}</p>
                                                        <a href="https://docs.nango.dev/integrate/guides/authorize-an-api#apis-requiring-connection-specific-configuration-for-authorization" target="_blank" rel="noreferrer" className="text-text-blue hover:text-text-light-blue ml-1">
                                                            docs
                                                        </a>
                                                        <p>{`).`}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                    <div className="mt-1">
                                        <input id={`connection-config-${paramName}`} name={`connection-config-${paramName}`} type="text" required autoComplete="new-password" className="border-border-gray bg-active-gray text-text-light-gray focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-1 text-sm placeholder-gray-400 shadow-sm focus:outline-none" onChange={handleConnectionConfigParamsChange}/>
                                    </div>
                                </div>))}

                            {(authMode === 'API_KEY' || authMode === 'BASIC') && (<div>
                                    <div>
                                        <label htmlFor="email" className="text-text-light-gray block text-sm font-semibold">
                                            Auth Type
                                        </label>
                                        <p className="mt-3 mb-5">{authMode}</p>
                                    </div>

                                    {authMode === 'BASIC' && (<div>
                                            <div className="flex mt-6">
                                                <label htmlFor="username" className="text-text-light-gray block text-sm font-semibold">
                                                    Username
                                                </label>
                                            </div>

                                            <div className="mt-1">
                                                <SecretInput_1.default copy={true} id="username" name="username" optionalvalue={apiAuthUsername} setoptionalvalue={setApiAuthUsername}/>
                                            </div>

                                            <div className="flex mt-6">
                                                <label htmlFor="password" className="text-text-light-gray block text-sm font-semibold">
                                                    Password
                                                </label>
                                            </div>

                                            <div className="mt-1">
                                                <SecretInput_1.default copy={true} id="password" name="password" optionalvalue={apiAuthPassword} setoptionalvalue={setApiAuthPassword}/>
                                            </div>
                                        </div>)}
                                    {authMode === 'API_KEY' && (<div>
                                            <div className="flex mt-6">
                                                <label htmlFor="connection_id" className="text-text-light-gray block text-sm font-semibold">
                                                    API Key
                                                </label>
                                                <core_1.Tooltip text={<>
                                                            <div className="flex text-black text-sm">
                                                                <p>{`The API key to authenticate requests`}</p>
                                                            </div>
                                                        </>}>
                                                    <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                                </core_1.Tooltip>
                                            </div>

                                            <div className="mt-1">
                                                <SecretInput_1.default copy={true} id="api_key" name="api_key" optionalvalue={apiKey} setoptionalvalue={setApiKey} required/>
                                            </div>
                                        </div>)}
                                </div>)}

                            {authMode === 'APP' && (<div>
                                    <div className="flex mt-6">
                                        <label htmlFor="optional_authorization_params" className="text-text-light-gray block text-sm font-semibold">
                                            Optional: Additional Authorization Params
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p>{`Add query parameters in the authorization URL, on a per-connection basis. Most integrations don't require this. This should be formatted as a JSON object, e.g. { "key" : "value" }. `}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                    <div className="mt-1">
                                        <input id="authorization_params" name="authorization_params" type="text" autoComplete="new-password" defaultValue="{ }" className={`${authorizationParamsError ? 'border-red-700' : 'border-border-gray'}  ${authorizationParamsError ? 'text-red-700' : 'text-text-light-gray'} focus:ring-white bg-active-gray block focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-1 text-sm placeholder-gray-400 shadow-sm focus:outline-none`} onChange={handleAuthorizationParamsChange}/>
                                    </div>
                                </div>)}

                            {authMode === 'APP_STORE' && (<div>
                                    <div className="flex mt-6">
                                        <label htmlFor="connection_id" className="text-text-light-gray block text-sm font-semibold">
                                            Private Key ID
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p>{`Obtained after creating an API Key.`}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                    <div className="mt-1">
                                        <input id="private_key_id" name="private_key_id" type="text" autoComplete="new-password" required className="border-border-gray bg-bg-black text-text-light-gray focus:border-white focus:ring-white block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-400 shadow-sm focus:outline-none" value={privateKeyId} onChange={(e) => setPrivateKeyId(e.target.value)}/>
                                    </div>
                                    <div className="flex mt-6">
                                        <label htmlFor="issuer_id" className="text-text-light-gray block text-sm font-semibold">
                                            Issuer ID
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p>{`is accessible in App Store Connect, under Users and Access, then Copy next to the ID`}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                    <div className="mt-1">
                                        <input id="issuer_id" name="issuer_id" type="text" autoComplete="new-password" required className="border-border-gray bg-bg-black text-text-light-gray focus:border-white focus:ring-white block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base placeholder-gray-400 shadow-sm focus:outline-none" value={issuerId} onChange={(e) => setIssuerId(e.target.value)}/>
                                    </div>
                                    <div className="flex mt-6">
                                        <label htmlFor="connection_id" className="text-text-light-gray block text-sm font-semibold">
                                            Private Key
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p>{`Obtained after creating an API Key. This value should be base64 encoded when passing to the auth call`}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>

                                    <div className="mt-1">
                                        <SecretTextArea_1.default copy={true} id="private_key" name="private_key" optionalvalue={privateKey} setoptionalvalue={(value) => setPrivateKey(value)} required/>
                                    </div>
                                </div>)}

                            {(authMode === 'OAUTH1' || authMode === 'OAUTH2') && (<div>
                                    <div className="flex mt-6">
                                        <label htmlFor="optional_authorization_params" className="text-text-light-gray block text-sm font-semibold">
                                            Optional: Additional Authorization Params
                                        </label>
                                        <core_1.Tooltip type="dark" text={<>
                                                    <div className="flex text-white text-sm">
                                                        <p>{`Add query parameters in the authorization URL, on a per-connection basis. Most integrations don't require this. This should be formatted as a JSON object, e.g. { "key" : "value" }. `}</p>
                                                    </div>
                                                </>}>
                                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                                        </core_1.Tooltip>
                                    </div>
                                    <div className="mt-1">
                                        <input id="authorization_params" name="authorization_params" type="text" autoComplete="new-password" defaultValue="{ }" className={`${authorizationParamsError ? 'border-red-700' : 'border-border-gray'}  ${authorizationParamsError ? 'text-red-700' : 'text-text-light-gray'} focus:ring-white bg-active-gray block focus:border-white focus:ring-white block w-full appearance-none rounded-md border px-3 py-1 text-sm placeholder-gray-400 shadow-sm focus:outline-none`} onChange={handleAuthorizationParamsChange}/>
                                    </div>
                                </div>)}

                            <div>
                                {serverErrorMessage && <p className="mt-6 text-sm text-red-600">{serverErrorMessage}</p>}
                                <div className="flex">
                                    <button type="submit" className="bg-white mt-4 h-8 rounded-md hover:bg-gray-300 border px-3 pt-0.5 text-sm text-black">
                                        {authMode === 'OAUTH1' || authMode === 'OAUTH2' ? <>Start OAuth Flow</> : <>Create Connection</>}
                                    </button>
                                    <label htmlFor="email" className="text-text-light-gray block text-sm pt-5 ml-4">
                                        or from your frontend:
                                    </label>
                                </div>
                                <div>
                                    <div className="mt-6">
                                        <prism_1.Prism className="transparent-code" language="typescript" colorScheme="dark">
                                            {snippet()}
                                        </prism_1.Prism>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>)}
            {integrations && !integrations.length && (<div className="mx-auto">
                    <div className="mx-16">
                        <h2 className="mt-16 text-left text-3xl font-semibold tracking-tight text-white mb-12">Add New Connection</h2>
                        <div className="text-sm w-largebox h-40">
                            <p className="text-white text-sm">
                                You have not created any Integrations yet. Please create an{' '}
                                <react_router_dom_1.Link to={`/${env}/integrations`} className="text-text-blue">
                                    Integration
                                </react_router_dom_1.Link>{' '}
                                first to create a Connection. Follow the{' '}
                                <a href="https://docs.nango.dev/integrate/guides/authorize-an-api" className="text-text-blue" target="_blank" rel="noreferrer">
                                    Authorize an API guide
                                </a>{' '}
                                for more instructions.
                            </p>
                        </div>
                    </div>
                </div>)}
        </DashboardLayout_1.default>);
}
exports.default = IntegrationCreate;
//# sourceMappingURL=Create.js.map