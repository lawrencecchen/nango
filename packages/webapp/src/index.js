"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sentry_1 = require("./utils/sentry");
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
require("./index.css");
const react_router_dom_1 = require("react-router-dom");
const react_2 = require("posthog-js/react");
const reportWebVitals_1 = __importDefault(require("./reportWebVitals"));
const App_1 = __importDefault(require("./App"));
const ErrorBoundary_1 = require("./components/ErrorBoundary");
const options = {
    api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
    maskAllInputs: true
};
const root = client_1.default.createRoot(document.getElementById('root'));
root.render(<react_1.default.StrictMode>
        <sentry_1.SentryErrorBoundary fallback={<ErrorBoundary_1.ErrorBoundary />}>
            <react_2.PostHogProvider apiKey={process.env.REACT_APP_PUBLIC_POSTHOG_KEY} options={options}>
                <react_router_dom_1.BrowserRouter>
                    <App_1.default />
                </react_router_dom_1.BrowserRouter>
            </react_2.PostHogProvider>
        </sentry_1.SentryErrorBoundary>
    </react_1.default.StrictMode>);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
(0, reportWebVitals_1.default)();
//# sourceMappingURL=index.js.map