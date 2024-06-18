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
exports.updateSlackNotifications = exports.connectSlack = void 0;
const frontend_1 = __importDefault(require("@nangohq/frontend"));
const api_1 = require("./api");
const connectSlack = ({ accountUUID, env, hostUrl, onFinish, onFailure }) => __awaiter(void 0, void 0, void 0, function* () {
    const connectionId = `account-${accountUUID}-${env}`;
    const res = yield (0, api_1.apiFetch)(`/api/v1/environment/admin-auth?connection_id=${connectionId}&env=${env}`, {
        method: 'GET'
    });
    if (res.status !== 200) {
        onFailure();
        return;
    }
    const authResponse = yield res.json();
    const { hmac_digest: hmacDigest, public_key: publicKey, integration_key: integrationKey } = authResponse;
    const nango = new frontend_1.default({ host: hostUrl, publicKey });
    nango
        .auth(integrationKey, connectionId, {
        user_scope: [],
        params: {},
        hmac: hmacDigest,
        detectClosedAuthWindow: true
    })
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, exports.updateSlackNotifications)(env, true);
        onFinish();
    }))
        .catch((error) => {
        console.error(error);
        onFailure();
    });
});
exports.connectSlack = connectSlack;
const updateSlackNotifications = (env, enabled) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, api_1.apiFetch)(`/api/v1/environment/slack-notifications-enabled?env=${env}`, {
        method: 'POST',
        body: JSON.stringify({
            slack_notifications: enabled
        })
    });
});
exports.updateSlackNotifications = updateSlackNotifications;
//# sourceMappingURL=slack-connection.js.map