"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUser = void 0;
const swr_1 = __importDefault(require("swr"));
const api_1 = require("../utils/api");
function useUser(enabled = true) {
    const { data, error, mutate } = (0, swr_1.default)(enabled ? '/api/v1/user' : null, api_1.swrFetcher);
    const loading = !data && !error;
    return {
        loading,
        user: data === null || data === void 0 ? void 0 : data.user,
        mutate
    };
}
exports.useUser = useUser;
//# sourceMappingURL=useUser.js.map