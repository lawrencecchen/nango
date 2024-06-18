"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMeta = void 0;
const swr_1 = __importDefault(require("swr"));
const api_1 = require("../utils/api");
function useMeta() {
    const { data, error } = (0, swr_1.default)('/api/v1/meta', api_1.swrFetcher);
    const loading = !data && !error;
    return {
        loading,
        error,
        meta: data
    };
}
exports.useMeta = useMeta;
//# sourceMappingURL=useMeta.js.map