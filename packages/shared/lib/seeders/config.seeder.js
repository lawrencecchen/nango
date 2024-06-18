var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import configService from '../services/config.service.js';
export const createConfigSeeds = (env) => __awaiter(void 0, void 0, void 0, function* () {
    yield configService.createProviderConfig({
        unique_key: Math.random().toString(36).substring(7),
        provider: 'google',
        environment_id: env.id
    });
    yield configService.createProviderConfig({
        unique_key: Math.random().toString(36).substring(7),
        provider: 'google',
        environment_id: env.id
    });
    yield configService.createProviderConfig({
        unique_key: Math.random().toString(36).substring(7),
        provider: 'google',
        environment_id: env.id
    });
    yield configService.createProviderConfig({
        unique_key: Math.random().toString(36).substring(7),
        provider: 'notion',
        environment_id: env.id
    });
});
export const createConfigSeed = (env, unique_key, provider) => __awaiter(void 0, void 0, void 0, function* () {
    yield configService.createProviderConfig({
        unique_key,
        provider,
        environment_id: env.id
    });
});
//# sourceMappingURL=config.seeder.js.map