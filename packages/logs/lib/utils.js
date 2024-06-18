var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getLogger } from '@nangohq/utils';
import { createKVStore } from '@nangohq/kvstore';
export const logger = getLogger('elasticsearch');
export const isCli = process.argv.find((value) => value.includes('/bin/nango') || value.includes('cli/dist/index'));
let kvstore;
export function getKVStore() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!kvstore) {
            kvstore = yield createKVStore();
        }
        return kvstore;
    });
}
//# sourceMappingURL=utils.js.map