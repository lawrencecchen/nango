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
const core_1 = require("@geist-ui/core");
const PrismPlus_1 = __importDefault(require("../../components/ui/prism/PrismPlus"));
const types_1 = require("../../types");
const utils_1 = require("../../utils/utils");
const SecretInput_1 = __importDefault(require("../../components/ui/input/SecretInput"));
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const TagsInput_1 = __importDefault(require("../../components/ui/input/TagsInput"));
function Authorization(props) {
    var _a, _b, _c, _d;
    const { connection, forceRefresh, loaded } = props;
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const handleForceRefresh = () => __awaiter(this, void 0, void 0, function* () {
        setRefreshing(true);
        yield forceRefresh();
        setRefreshing(false);
    });
    if (!loaded)
        return <core_1.Loading spaceRatio={2.5} className="top-24"/>;
    return (<div className="mx-auto space-y-12 text-sm w-[976px]">
            <div className="flex">
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-1">Connection ID</span>
                    <div className="flex items-center gap-2">
                        <span className="text-white break-all">{connection.connection_id}</span>
                        <CopyButton_1.default text={connection.connection_id} dark/>
                    </div>
                </div>
                {connection.created_at && (<div className="flex flex-col w-1/2">
                        <span className="text-gray-400 text-xs uppercase mb-1">Creation Date</span>
                        <span className="text-white">{(0, utils_1.formatDateToShortUSFormat)(connection.created_at.toString())}</span>
                    </div>)}
            </div>
            <div className="flex">
                <div className="flex flex-col w-1/2">
                    <span className="text-gray-400 text-xs uppercase mb-2">Auth Type</span>
                    <span className="text-white">{connection.credentials.type || 'None'}</span>
                </div>
                {connection.credentials && connection.credentials.type === types_1.AuthModes.ApiKey && 'apiKey' in connection.credentials && (<div className="flex flex-col w-1/2">
                        <span className="text-gray-400 text-xs uppercase mb-1">{connection.credentials.type}</span>
                        <SecretInput_1.default disabled defaultValue={connection.credentials.apiKey} copy={true}/>
                    </div>)}
                {'expires_at' in connection.credentials && connection.credentials.expires_at && (<div className="flex flex-col w-1/2">
                        <span className="text-gray-400 text-xs uppercase mb-1">Access Token Expiration</span>
                        <span className="text-white">{(0, utils_1.formatDateToShortUSFormat)(connection.credentials.expires_at.toString())}</span>
                    </div>)}
            </div>
            {connection.credentials && connection.credentials.type === types_1.AuthModes.Basic && 'password' in connection.credentials && (<div className="flex">
                    {(connection === null || connection === void 0 ? void 0 : connection.credentials.username) && (<div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-2">Username</span>
                            <span className="text-white">{connection === null || connection === void 0 ? void 0 : connection.credentials.username}</span>
                        </div>)}
                    {(connection === null || connection === void 0 ? void 0 : connection.credentials.password) && (<div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">Password</span>
                            <SecretInput_1.default disabled defaultValue={(_a = connection === null || connection === void 0 ? void 0 : connection.credentials) === null || _a === void 0 ? void 0 : _a.password} copy={true}/>
                        </div>)}
                </div>)}
            {connection.credentials && 'config_override' in connection.credentials && (<>
                    {((_b = connection.credentials.config_override) === null || _b === void 0 ? void 0 : _b.client_id) && (<div className="flex flex-col">
                            <span className="text-gray-400 text-xs uppercase mb-1">Client ID Override</span>
                            <SecretInput_1.default disabled value={connection.credentials.config_override.client_id} copy={true}/>
                        </div>)}
                    {((_c = connection.credentials.config_override) === null || _c === void 0 ? void 0 : _c.client_secret) && (<div className="flex flex-col">
                            <span className="text-gray-400 text-xs uppercase mb-1">Client Secret Override</span>
                            <SecretInput_1.default disabled value={connection.credentials.config_override.client_secret} copy={true}/>
                        </div>)}
                </>)}
            {(connection === null || connection === void 0 ? void 0 : connection.credentials) && 'client_id' in connection.credentials && 'client_secret' in connection.credentials && (<>
                    {connection.credentials.client_id && (<div className="flex flex-col">
                            <span className="text-gray-400 text-xs uppercase mb-1">Client ID</span>
                            <SecretInput_1.default disabled value={connection.credentials.client_id} copy={true}/>
                        </div>)}
                    {connection.credentials.client_secret && (<div className="flex flex-col">
                            <span className="text-gray-400 text-xs uppercase mb-1">Client Secret</span>
                            <SecretInput_1.default disabled value={connection.credentials.client_secret} copy={true}/>
                        </div>)}
                </>)}
            {((_d = connection.connection_config) === null || _d === void 0 ? void 0 : _d.oauth_scopes_override) && (<div className="mt-8">
                    <span className="text-gray-400 text-xs uppercase mb-1">Scopes Override</span>
                    <TagsInput_1.default id="scopes" name="scopes" readOnly type="text" defaultValue={Array.isArray(connection.connection_config.oauth_scopes_override)
                ? connection.connection_config.oauth_scopes_override.join(',')
                : connection.connection_config.oauth_scopes_override} minLength={1}/>
                </div>)}
            {connection.credentials && 'token' in connection.credentials && (<div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase mb-1">Token</span>
                    <SecretInput_1.default disabled value={refreshing ? 'Refreshing...' : connection.credentials.token} copy={true} refresh={handleForceRefresh}/>
                </div>)}
            {(connection.credentials.type === types_1.AuthModes.OAuth2 || connection.credentials.type === types_1.AuthModes.App) && connection.credentials.access_token && (<div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase mb-1">Access Token</span>
                    <SecretInput_1.default disabled value={refreshing ? 'Refreshing...' : connection.credentials.access_token} copy={true} refresh={handleForceRefresh}/>
                </div>)}
            {connection.credentials.type === types_1.AuthModes.OAuth1 && connection.credentials.oauth_token && (<div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase mb-1">OAuth Token</span>
                    <SecretInput_1.default disabled defaultValue={connection.credentials.oauth_token} copy={true}/>
                </div>)}
            {connection.credentials.type === types_1.AuthModes.OAuth1 && connection.credentials.oauth_token_secret && (<div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase mb-1">OAuth Token Secret</span>
                    <SecretInput_1.default disabled defaultValue={connection.credentials.oauth_token_secret} copy={true}/>
                </div>)}
            {connection.credentials.type === types_1.AuthModes.OAuth2 && connection.credentials.refresh_token && (<div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase mb-1">Refresh Token</span>
                    <SecretInput_1.default disabled value={refreshing ? 'Refreshing...' : connection.credentials.refresh_token} copy={true}/>
                </div>)}
            <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase mb-2">Connection Configuration</span>
                <prism_1.Prism language="json" colorScheme="dark">
                    {JSON.stringify(connection.connection_config, null, 4) || '{}'}
                </prism_1.Prism>
            </div>
            <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase mb-2">Connection Metadata</span>
                <prism_1.Prism language="json" colorScheme="dark">
                    {JSON.stringify(connection.metadata, null, 4) || '{}'}
                </prism_1.Prism>
            </div>
            {(connection.credentials.type === types_1.AuthModes.OAuth1 ||
            connection.credentials.type === types_1.AuthModes.OAuth2 ||
            connection.credentials.type === types_1.AuthModes.App ||
            connection.credentials.type === types_1.AuthModes.Custom) && (<div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase mb-2">Raw Token Response</span>
                    <PrismPlus_1.default language="json" colorScheme="dark">
                        {JSON.stringify(connection.credentials.raw, null, 4) || '{}'}
                    </PrismPlus_1.default>
                </div>)}
        </div>);
}
exports.default = Authorization;
//# sourceMappingURL=Authorization.js.map