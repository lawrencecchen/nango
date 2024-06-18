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
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_toastify_1 = require("react-toastify");
const react_1 = require("react");
const frontend_1 = __importStar(require("@nangohq/frontend"));
const utils_1 = require("../utils/utils");
function AuthLink() {
    const [serverErrorMessage, setServerErrorMessage] = (0, react_1.useState)('');
    const searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    const handleCreate = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        e.preventDefault();
        setServerErrorMessage('');
        // Required params.
        const integrationUniqueKey = searchParams.get('integration_unique_key');
        const connectionId = searchParams.get('connection_id');
        const publicKey = searchParams.get('public_key') || undefined;
        if (!integrationUniqueKey || !connectionId) {
            setServerErrorMessage('Missing Integration ID and/or User ID.');
            return;
        }
        if (!publicKey) {
            setServerErrorMessage('Missing public key.');
            return;
        }
        // Optional params.
        const host = searchParams.get('host') || (0, utils_1.baseUrl)();
        const websocketsPath = searchParams.get('websockets_path') || '/';
        const userScopes = ((_a = searchParams.get('selected_scopes')) === null || _a === void 0 ? void 0 : _a.split(',')) || []; // Slack only.
        const params = searchParams.get('params');
        const authorizationParams = searchParams.get('authorization_params');
        const username = searchParams.get('username');
        const password = searchParams.get('password');
        const apiKey = searchParams.get('api_key');
        const nango = new frontend_1.default({ host: host, websocketsPath: websocketsPath, publicKey: publicKey });
        let credentials = {};
        if (username && password) {
            credentials = {
                username,
                password
            };
        }
        if (apiKey) {
            credentials = {
                apiKey: apiKey
            };
        }
        nango
            .auth(integrationUniqueKey, connectionId, {
            user_scope: userScopes,
            params: params ? JSON.parse(params) : {},
            authorization_params: authorizationParams ? JSON.parse(authorizationParams) : {},
            credentials
        })
            .then(() => {
            react_toastify_1.toast.success('Connection created!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        })
            .catch((err) => {
            setServerErrorMessage(err instanceof frontend_1.AuthError ? `${err.type} error: ${err.message}` : 'unknown error');
        });
    });
    return (<div className="ml-4 mt-4">
            <button onClick={handleCreate} className="bg-white h-8 rounded-md hover:bg-gray-300 border px-3 pt-0.5 text-sm text-black">
                Authenticate
            </button>
            {serverErrorMessage && <p className="mt-6 text-sm text-red-600">{serverErrorMessage}</p>}
        </div>);
}
exports.default = AuthLink;
//# sourceMappingURL=AuthLink.js.map