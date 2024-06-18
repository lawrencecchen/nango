"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryErrorBoundary = exports.SentryRoutes = void 0;
const Sentry = __importStar(require("@sentry/react"));
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
Sentry.init({
    dsn: process.env.REACT_APP_PUBLIC_SENTRY_KEY,
    integrations: [
        Sentry.reactRouterV6BrowserTracingIntegration({
            useEffect: react_1.useEffect,
            useLocation: react_router_dom_1.useLocation,
            useNavigationType: react_router_dom_1.useNavigationType,
            createRoutesFromChildren: react_router_dom_1.createRoutesFromChildren,
            matchRoutes: react_router_dom_1.matchRoutes
        }),
        Sentry.replayIntegration()
    ],
    tracePropagationTargets: [/^https:\/\/app.nango\.dev\/api/],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.3,
    maxBreadcrumbs: 50
});
exports.SentryRoutes = Sentry.withSentryReactRouterV6Routing(react_router_dom_1.Routes);
exports.SentryErrorBoundary = Sentry.ErrorBoundary;
//# sourceMappingURL=sentry.js.map