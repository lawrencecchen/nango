"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionName = exports.providerConfigKey = exports.model = exports.endpointAction = exports.endpointSync = exports.Language = exports.Steps = void 0;
var Steps;
(function (Steps) {
    Steps[Steps["Start"] = 0] = "Start";
    Steps[Steps["Authorize"] = 1] = "Authorize";
    Steps[Steps["Deploy"] = 2] = "Deploy";
    Steps[Steps["Webhooks"] = 3] = "Webhooks";
    Steps[Steps["Fetch"] = 4] = "Fetch";
    Steps[Steps["Write"] = 5] = "Write";
    Steps[Steps["Complete"] = 6] = "Complete";
})(Steps = exports.Steps || (exports.Steps = {}));
var Language;
(function (Language) {
    Language[Language["Node"] = 0] = "Node";
    Language[Language["cURL"] = 1] = "cURL";
})(Language = exports.Language || (exports.Language = {}));
exports.endpointSync = '/github/demo-issues';
exports.endpointAction = '/github/demo-write-issue';
exports.model = 'GithubIssueDemo';
exports.providerConfigKey = 'github-demo';
exports.actionName = 'create-demo-issue';
//# sourceMappingURL=utils.js.map