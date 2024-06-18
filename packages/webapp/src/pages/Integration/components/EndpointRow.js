"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointLabel_1 = __importDefault(require("./EndpointLabel"));
const FlowCard_1 = __importDefault(require("./FlowCard"));
const Show_1 = require("../Show");
function EndpointRow({ flow, endpoint, setSubTab, setFlow, setEndpoint }) {
    const routeToReference = () => {
        setFlow(flow);
        setEndpoint(endpoint);
        setSubTab(Show_1.SubTabs.Reference);
    };
    return (<td className="flex items-center p-3 py-2.5 border-b border-border-gray hover:bg-hover-gray cursor-pointer" onClick={routeToReference}>
            <div className="flex items-center w-80">
                <EndpointLabel_1.default endpoint={endpoint} type={flow.type}/>
            </div>
            <div className="flex items-center">
                <div className="text-gray-400 ml-12 w-[36rem] truncate">{flow.description}</div>
            </div>
            <div className="flex flex-end relative group hover:bg-neutral-800 rounded p-2 ml-12">
                {flow.enabled ? (<div className="w-2 h-2 bg-green-500 rounded-full cursor-pointer"></div>) : (<div className="w-2 h-2 bg-pink-600 rounded-full cursor-pointer"></div>)}
                <div className="hidden group-hover:block text-white absolute z-10 top-10 -left-24 bg-neutral-800 rounded border border-neutral-700 w-56">
                    <FlowCard_1.default flow={flow}/>
                </div>
            </div>
        </td>);
}
exports.default = EndpointRow;
//# sourceMappingURL=EndpointRow.js.map