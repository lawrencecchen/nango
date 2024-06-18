"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buttonStyles = void 0;
const icons_1 = require("@geist-ui/icons");
const class_variance_authority_1 = require("class-variance-authority");
const react_1 = require("react");
const utils_1 = require("../../../utils/utils");
exports.buttonStyles = (0, class_variance_authority_1.cva)('disabled:pointer-events-none disabled:opacity-50 rounded text-sm', {
    variants: {
        variant: {
            primary: 'bg-white text-black hover:bg-gray-300',
            secondary: 'bg-[#282828] text-white hover:bg-gray-800',
            success: 'bg-green-700 text-white hover:bg-green-500',
            danger: 'bg-red-700 text-white hover:bg-red-500',
            zombie: 'bg-transparent text-white hover:bg-active-gray',
            zombieGray: 'bg-transparent text-white hover:bg-hover-gray border border-active-gray',
            yellow: 'bg-yellow-500 text-white hover:bg-yellow-400',
            black: 'bg-black text-white hover:bg-hover-gray',
            active: 'bg-active-gray text-white',
            hover: 'hover:bg-hover-gray text-white',
            zinc: 'bg-active-gray hover:bg-neutral-800 text-gray-400 border border-neutral-700'
        },
        size: {
            xs: 'h-8 py-1 px-3',
            sm: 'h-9 px-2 ',
            md: 'h-9 py-2 px-4',
            lg: 'h-11 px-8'
        }
    },
    defaultVariants: {
        variant: 'primary',
        size: 'md'
    }
});
const Button = (0, react_1.forwardRef)(function Button(_a, ref) {
    var { size, variant, className, isLoading, children } = _a, props = __rest(_a, ["size", "variant", "className", "isLoading", "children"]);
    if (isLoading) {
        props.disabled = true;
    }
    return (<button ref={ref} className={(0, utils_1.cn)((0, exports.buttonStyles)({ className, variant, size }), 'flex gap-2 items-center', isLoading && 'opacity-0')} {...props}>
            {children}
            {isLoading && <icons_1.Loader className="absolute animate-spin top-0 flex mx-auto inset-x-0 h-full"/>}
        </button>);
});
exports.default = Button;
//# sourceMappingURL=Button.js.map