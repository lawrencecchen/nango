"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModes = exports.UserFacingSyncCommand = void 0;
exports.UserFacingSyncCommand = {
    PAUSE: 'paused',
    UNPAUSE: 'resumed',
    RUN: 'triggered',
    RUN_FULL: 'run full',
    CANCEL: 'cancelled'
};
var AuthModes;
(function (AuthModes) {
    AuthModes["OAuth1"] = "OAUTH1";
    AuthModes["OAuth2"] = "OAUTH2";
    AuthModes["OAuth2CC"] = "OAUTH2_CC";
    AuthModes["Basic"] = "BASIC";
    AuthModes["ApiKey"] = "API_KEY";
    AuthModes["AppStore"] = "APP_STORE";
    AuthModes["App"] = "APP";
    AuthModes["Custom"] = "CUSTOM";
    AuthModes["None"] = "NONE";
})(AuthModes = exports.AuthModes || (exports.AuthModes = {}));
//# sourceMappingURL=types.js.map