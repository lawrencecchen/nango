"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
function IntegrationLogo({ provider, height = 5, width = 5, color = 'text-white', classNames = '' }) {
    const [imgError, setImgError] = (0, react_1.useState)(false);
    if (provider === 'unauthenticated') {
        return <outline_1.LockOpenIcon className={`h-${height} w-${width} ${color} ${classNames}`}/>;
    }
    return (<>
            {!imgError ? (<img src={`/images/template-logos/${provider}.svg`} alt="" className={`h-${height} w-${width} ${classNames}`} onError={() => setImgError(true)}/>) : (<outline_1.CubeTransparentIcon className={`h-${height} w-${width} ${color} ${classNames}`}/>)}
        </>);
}
exports.default = IntegrationLogo;
//# sourceMappingURL=IntegrationLogo.js.map