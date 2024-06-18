var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { configService } from '@nangohq/shared';
class ProviderController {
    /**
     * Webapp
     */
    listProviders(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let templates = (_a = configService.templates) !== null && _a !== void 0 ? _a : {};
                const query = req.query['query'];
                if (query) {
                    templates = Object.fromEntries(Object.entries(templates).filter((entry) => {
                        return entry[0].toLowerCase().includes(query.toLowerCase());
                    }));
                }
                res.status(200).send({
                    providers: templates
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProvider(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const providerKey = req.params['provider'];
                res.status(200).send({
                    provider: (_a = configService.templates) === null || _a === void 0 ? void 0 : _a[providerKey]
                });
            }
            catch (err) {
                next(err);
            }
        });
    }
}
export default new ProviderController();
//# sourceMappingURL=provider.controller.js.map