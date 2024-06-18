var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
export class RenderAPI {
    constructor(apiKey) {
        this.httpClient = axios.create({
            baseURL: 'https://api.render.com/v1',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json'
            }
        });
    }
    getServices(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.httpClient.get('/services', { params });
        });
    }
    createService(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.httpClient.post('/services', data);
        });
    }
    suspendService(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.httpClient.post(`/services/${params.serviceId}/suspend`, {});
        });
    }
    resumeService(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.httpClient.post(`/services/${params.serviceId}/resume`, {});
        });
    }
}
//# sourceMappingURL=render.api.js.map