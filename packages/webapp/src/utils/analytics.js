"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnalyticsReset = exports.useAnalyticsIdentify = exports.useAnalyticsTrack = void 0;
const react_1 = require("posthog-js/react");
function useAnalyticsTrack() {
    const posthog = (0, react_1.usePostHog)();
    return (event, properties) => {
        posthog === null || posthog === void 0 ? void 0 : posthog.capture(event, properties);
    };
}
exports.useAnalyticsTrack = useAnalyticsTrack;
function useAnalyticsIdentify() {
    const posthog = (0, react_1.usePostHog)();
    return (user) => {
        posthog === null || posthog === void 0 ? void 0 : posthog.identify(user.email, {
            email: user.email,
            name: user.name,
            userId: user.id,
            accountId: user.accountId
        });
        posthog === null || posthog === void 0 ? void 0 : posthog.group('company', `${user.accountId}`);
    };
}
exports.useAnalyticsIdentify = useAnalyticsIdentify;
function useAnalyticsReset() {
    const posthog = (0, react_1.usePostHog)();
    return () => {
        posthog === null || posthog === void 0 ? void 0 : posthog.reset();
    };
}
exports.useAnalyticsReset = useAnalyticsReset;
//# sourceMappingURL=analytics.js.map