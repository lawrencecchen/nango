"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const store_1 = require("../store");
const VALID_PATHS = [
    'interactive-demo',
    'integration',
    'integrations',
    'syncs',
    'connections',
    'project-settings',
    'environment-settings',
    'user-settings',
    'account-settings',
    'logs'
];
const NotFound = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const showInteractiveDemo = (0, store_1.useStore)((state) => state.showInteractiveDemo);
    const env = (0, store_1.useStore)((state) => state.env);
    (0, react_1.useEffect)(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        // Add env in URL
        if (pathSegments[0] !== env && VALID_PATHS.includes(pathSegments[0])) {
            navigate(`/${env}/${pathSegments.join('/')}`);
            return;
        }
        navigate(`/${env}/integrations`);
    }, [location, env, navigate, showInteractiveDemo]);
    return null;
};
exports.NotFound = NotFound;
//# sourceMappingURL=NotFound.js.map