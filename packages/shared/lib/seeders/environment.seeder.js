var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import environmentService from '../services/environment.service.js';
export function createEnvironmentSeed(accountId = 0, envName = 'test') {
    return __awaiter(this, void 0, void 0, function* () {
        const env = yield environmentService.createEnvironment(accountId, envName);
        if (!env) {
            throw new Error('Failed to create environment');
        }
        return env;
    });
}
//# sourceMappingURL=environment.seeder.js.map