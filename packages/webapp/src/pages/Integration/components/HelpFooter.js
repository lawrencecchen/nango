"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const outline_1 = require("@heroicons/react/24/outline");
const Button_1 = __importDefault(require("../../../components/ui/button/Button"));
function HelpFooter() {
    return (<div className="my-10 space-x-3">
            <a href="https://docs.nango.dev/customize/guides/create-a-custom-integration" target="_blank" rel="noreferrer">
                <Button_1.default variant="zinc">
                    <outline_1.BookOpenIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => true}/>
                    <span>Build Custom</span>
                </Button_1.default>
            </a>
        </div>);
}
exports.default = HelpFooter;
//# sourceMappingURL=HelpFooter.js.map