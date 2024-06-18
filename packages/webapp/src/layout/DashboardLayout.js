"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DebugMode_1 = require("../components/DebugMode");
const LeftNavBar_1 = __importDefault(require("../components/LeftNavBar"));
const TopNavBar_1 = __importDefault(require("../components/TopNavBar"));
const utils_1 = require("../utils/utils");
function DashboardLayout({ children, selectedItem, fullWidth = false, className }) {
    return (<div className="h-full min-h-screen flex bg-pure-black">
            <div className="absolute w-screen z-20">
                <DebugMode_1.DebugMode />
            </div>
            <div className="w-[250px] h-screen z-10 flex-grow-0">
                <LeftNavBar_1.default selectedItem={selectedItem}/>
            </div>
            <div className="flex-grow relative h-screen flex flex-col">
                <div className="h-[57px] w-full">
                    <TopNavBar_1.default />
                </div>
                <div className="h-full overflow-auto">
                    <div className={(0, utils_1.cn)('flex-grow h-auto mx-auto', fullWidth ? 'w-full' : 'w-[976px] py-8', className)}>{children}</div>
                </div>
            </div>
        </div>);
}
exports.default = DashboardLayout;
//# sourceMappingURL=DashboardLayout.js.map