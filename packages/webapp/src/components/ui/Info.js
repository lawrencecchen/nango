"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const icons_1 = require("@geist-ui/icons");
function Info({ children, size, padding, verticallyCenter = true, classNames = '', color = 'blue', showIcon = true }) {
    const iconClasses = color === 'blue' ? 'stroke-blue-400' : color === 'red' ? 'stroke-red-500' : 'stroke-amber-500';
    const background = color === 'blue' ? 'bg-blue-base/[.35]' : color === 'red' ? 'bg-red-base/[.35]' : 'bg-amber-500';
    const border = color === 'blue' ? 'border border-blue-base' : color === 'red' ? 'border border-red-base' : 'border border-amber-500';
    const bgOpacity = color === 'blue' ? '' : color === 'red' ? '' : 'bg-opacity-20';
    const textColor = color === 'blue' ? 'text-blue-base' : color === 'red' ? 'text-red-base' : 'text-white';
    return (<div className={`flex ${verticallyCenter ? 'items-center' : ''} ${bgOpacity} grow ${classNames} ${padding ? padding : 'p-4'} ${background} ${border} rounded`}>
            {showIcon && <icons_1.Info size={`${size || 36}`} className={`mr-3 ${verticallyCenter ? '' : 'mt-0.5'} ${iconClasses}`}></icons_1.Info>}
            <span className={textColor}>{children}</span>
        </div>);
}
exports.default = Info;
//# sourceMappingURL=Info.js.map