var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { seedUser } from './user.seeder.js';
import { createEnvironmentSeed } from './environment.seeder.js';
import { createAccount } from './account.seeder.js';
export function seedAccountEnvAndUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const account = yield createAccount();
        const env = yield createEnvironmentSeed(account.id, 'dev');
        const user = yield seedUser(account.id);
        return { account, env, user };
    });
}
//# sourceMappingURL=global.seeder.js.map