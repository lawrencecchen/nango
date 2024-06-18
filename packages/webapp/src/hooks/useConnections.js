"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConnections = void 0;
const swr_1 = __importDefault(require("swr"));
const api_1 = require("../utils/api");
function useConnections(env) {
    var _a, _b;
    const { data, error, mutate } = (0, swr_1.default)(`/api/v1/connection?env=${env}`, api_1.swrFetcher, {
        refreshInterval: 10000,
        keepPreviousData: false
    });
    const loading = !data && !error;
    const errorNotifications = data && data.connections ? (_b = (_a = data === null || data === void 0 ? void 0 : data.connections) === null || _a === void 0 ? void 0 : _a.filter((connection) => connection.active_logs)) === null || _b === void 0 ? void 0 : _b.length : 0;
    return {
        loading,
        error,
        data,
        mutate,
        errorNotifications
    };
}
exports.useConnections = useConnections;
//# sourceMappingURL=useConnections.js.map