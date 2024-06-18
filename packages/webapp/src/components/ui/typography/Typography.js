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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const core_1 = require("@geist-ui/core");
const icons_1 = require("@geist-ui/icons");
const class_variance_authority_1 = require("class-variance-authority");
const classnames_1 = __importDefault(require("classnames"));
const typographyStyles = (0, class_variance_authority_1.cva)('flex gap-2 items-center tracking-tight font-bold', {
    variants: {
        variant: {
            h1: 'text-4xl',
            h2: 'text-3xl',
            h3: 'text-2xl',
            h4: 'text-xl',
            h5: 'text-lg'
        },
        textColor: {
            white: 'text-white',
            black: 'text-black',
            gray: 'text-gray-400'
        }
    },
    defaultVariants: {
        variant: 'h1',
        textColor: 'white'
    }
});
const Typography = (0, react_1.forwardRef)(function Typography(_a, ref) {
    var { tooltipProps, className, variant, textColor, children } = _a, props = __rest(_a, ["tooltipProps", "className", "variant", "textColor", "children"]);
    return (<>
            {react_1.default.createElement(variant !== null && variant !== void 0 ? variant : 'h1', Object.assign(Object.assign({ className: (0, classnames_1.default)(typographyStyles({ className, variant, textColor })) }, props), { ref }), <>
                    {children}
                    {tooltipProps && (<core_1.Tooltip text={tooltipProps.text}>
                            <icons_1.HelpCircle className="h-5"/>
                        </core_1.Tooltip>)}
                </>)}
        </>);
});
exports.default = Typography;
//# sourceMappingURL=Typography.js.map