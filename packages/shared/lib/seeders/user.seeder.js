var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { nanoid } from '@nangohq/utils';
import userService from '../services/user.service.js';
const promisePdkdf2 = promisify(crypto.pbkdf2);
export function seedUser(accountId) {
    return __awaiter(this, void 0, void 0, function* () {
        const uniqueId = nanoid();
        const salt = crypto.randomBytes(16).toString('base64');
        const hashedPassword = (yield promisePdkdf2(uniqueId, salt, 310000, 32, 'sha256')).toString('base64');
        const user = yield userService.createUser(`${uniqueId}@example.com`, uniqueId, hashedPassword, salt, accountId);
        if (!user) {
            throw new Error('Failed to create user');
        }
        return user;
    });
}
//# sourceMappingURL=user.seeder.js.map