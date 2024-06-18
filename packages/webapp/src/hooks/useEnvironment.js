"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnvironment = void 0;
const swr_1 = __importDefault(require("swr"));
const api_1 = require("../utils/api");
function useEnvironment(env) {
    const { data, error, mutate } = (0, swr_1.default)(`/api/v1/environment?env=${env}`, api_1.swrFetcher, {});
    const loading = !data && !error;
    return {
        loading,
        error,
        environmentAndAccount: data === null || data === void 0 ? void 0 : data.environmentAndAccount,
        mutate
    };
}
exports.useEnvironment = useEnvironment;
//# sourceMappingURL=useEnvironment.js.map