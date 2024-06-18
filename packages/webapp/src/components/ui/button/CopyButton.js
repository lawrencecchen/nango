"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const core_1 = require("@geist-ui/core");
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("../../../utils/utils");
function ClipboardButton({ text, icontype = 'clipboard', textPrompt = 'Copy', dark = false, className }) {
    const [tooltipText, setTooltipText] = (0, react_1.useState)(textPrompt);
    const copyToClipboard = (e) => __awaiter(this, void 0, void 0, function* () {
        try {
            e.stopPropagation();
            yield navigator.clipboard.writeText(text);
            setTooltipText('Copied');
        }
        catch (err) {
            //this should never happen!
            console.error('Failed to copy:', err);
        }
    });
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            setTooltipText(textPrompt);
        }, 1000);
        return () => {
            clearTimeout(timer);
        };
    }, [tooltipText, textPrompt]);
    return (<core_1.Tooltip className="text-xs" text={tooltipText} type={dark ? 'dark' : 'default'}>
            {icontype === 'link' ? (<react_icons_1.Link2Icon className={(0, utils_1.cn)(`h-4 cursor-pointer text-gray-400 hover:text-white`, className)} onClick={copyToClipboard}/>) : (<react_icons_1.CopyIcon color="gray" className={(0, utils_1.cn)(`h-4 w-4 cursor-pointer`, className)} onClick={copyToClipboard}/>)}
        </core_1.Tooltip>);
}
exports.default = ClipboardButton;
//# sourceMappingURL=CopyButton.js.map