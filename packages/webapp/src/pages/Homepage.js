"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Homepage = void 0;
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const useMeta_1 = require("../hooks/useMeta");
const store_1 = require("../store");
const Homepage = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const showInteractiveDemo = (0, store_1.useStore)((state) => state.showInteractiveDemo);
    const env = (0, store_1.useStore)((state) => state.env);
    const { meta } = (0, useMeta_1.useMeta)();
    (0, react_1.useEffect)(() => {
        if (!meta) {
            return;
        }
        if (env === 'dev' && showInteractiveDemo && !meta.onboardingComplete) {
            navigate('/dev/interactive-demo');
            return;
        }
        navigate(`/${env}/integrations`);
    }, [meta, location, env, navigate, showInteractiveDemo]);
    return null;
};
exports.Homepage = Homepage;
//# sourceMappingURL=Homepage.js.map