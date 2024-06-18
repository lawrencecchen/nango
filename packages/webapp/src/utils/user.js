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
exports.getUser = exports.useSignout = exports.useSignin = void 0;
const react_router_dom_1 = require("react-router-dom");
const swr_1 = require("swr");
const local_storage_1 = __importStar(require("../utils/local-storage"));
const api_1 = require("../utils/api");
const analytics_1 = require("./analytics");
function useSignin() {
    const analyticsIdentify = (0, analytics_1.useAnalyticsIdentify)();
    return (user) => {
        local_storage_1.default.setItem(local_storage_1.LocalStorageKeys.UserEmail, user.email);
        local_storage_1.default.setItem(local_storage_1.LocalStorageKeys.UserName, user.name);
        local_storage_1.default.setItem(local_storage_1.LocalStorageKeys.UserId, user.id);
        local_storage_1.default.setItem(local_storage_1.LocalStorageKeys.AccountId, user.accountId);
        analyticsIdentify(user);
    };
}
exports.useSignin = useSignin;
function useSignout() {
    const analyticsReset = (0, analytics_1.useAnalyticsReset)();
    const nav = (0, react_router_dom_1.useNavigate)();
    const { mutate } = (0, swr_1.useSWRConfig)();
    const logoutAPI = (0, api_1.useLogoutAPI)();
    return () => __awaiter(this, void 0, void 0, function* () {
        local_storage_1.default.clear();
        analyticsReset();
        yield logoutAPI(); // Destroy server session.
        yield mutate(() => true, undefined, { revalidate: false }); // clean all cache
        nav('/signin', { replace: true });
    });
}
exports.useSignout = useSignout;
function getUser() {
    const email = local_storage_1.default.getItem(local_storage_1.LocalStorageKeys.UserEmail);
    const name = local_storage_1.default.getItem(local_storage_1.LocalStorageKeys.UserName);
    const userId = local_storage_1.default.getItem(local_storage_1.LocalStorageKeys.UserId);
    const accountId = local_storage_1.default.getItem(local_storage_1.LocalStorageKeys.AccountId);
    if (email && name && userId && accountId) {
        return {
            id: userId,
            email: email,
            name: name,
            accountId: accountId
        };
    }
    else {
        return null;
    }
}
exports.getUser = getUser;
//# sourceMappingURL=user.js.map