"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useListIntegration = void 0;
const swr_1 = __importDefault(require("swr"));
const api_1 = require("../utils/api");
function useListIntegration(env) {
    const { data, error, mutate } = (0, swr_1.default)(`/api/v1/integration?env=${env}`, api_1.swrFetcher);
    const loading = !data && !error;
    return {
        loading,
        error,
        list: data,
        mutate
    };
}
exports.useListIntegration = useListIntegration;
//# sourceMappingURL=useIntegration.js.map