const PORT = process.env['SERVER_PORT'] || 3003;
export const localhostUrl = `http://localhost:${PORT}`;
export const cloudHost = 'https://api.nango.dev';
export const stagingHost = 'https://api-staging.nango.dev';
export var NodeEnv;
(function (NodeEnv) {
    NodeEnv["Dev"] = "development";
    NodeEnv["Staging"] = "staging";
    NodeEnv["Prod"] = "production";
})(NodeEnv || (NodeEnv = {}));
//# sourceMappingURL=constants.js.map