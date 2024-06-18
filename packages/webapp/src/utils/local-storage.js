"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageKeys = void 0;
class LocalStorage {
    getItem(key) {
        const item = localStorage.getItem(key);
        if (item === null)
            return undefined;
        if (item === 'null')
            return null;
        if (item === 'undefined')
            return undefined;
        try {
            return JSON.parse(item);
        }
        catch (_a) {
            console.error('Failed to parse local storage', item);
        }
        return item;
    }
    setItem(key, value) {
        if (!value) {
            localStorage.removeItem(key);
        }
        else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }
    clear() {
        localStorage.clear();
    }
}
var LocalStorageKeys;
(function (LocalStorageKeys) {
    LocalStorageKeys["UserEmail"] = "nango_user_email";
    LocalStorageKeys["UserName"] = "nango_user_name";
    LocalStorageKeys["UserId"] = "nango_user_id";
    LocalStorageKeys["AccountId"] = "nango_account_id";
})(LocalStorageKeys = exports.LocalStorageKeys || (exports.LocalStorageKeys = {}));
const storage = new LocalStorage();
exports.default = storage;
//# sourceMappingURL=local-storage.js.map