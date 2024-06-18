var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function runAction(nango, input) {
    return __awaiter(this, void 0, void 0, function* () {
        const limit = (input === null || input === void 0 ? void 0 : input.limit) || 10;
        const response = yield nango.get({
            endpoint: '/api/1.0/workspaces',
            params: {
                opt_fields: 'is_organization',
                limit
            }
        });
        return response.data.data;
    });
}
//# sourceMappingURL=fetch-workspaces.js.map