"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const EndpointRow_1 = __importDefault(require("./components/EndpointRow"));
const HelpFooter_1 = __importDefault(require("./components/HelpFooter"));
function APIReference(props) {
    var _a, _b, _c, _d;
    const { integration, endpoints, setSubTab, setFlow, setEndpoint } = props;
    const allFlows = [
        ...(((_a = endpoints === null || endpoints === void 0 ? void 0 : endpoints.allFlows) === null || _a === void 0 ? void 0 : _a.syncs) || []),
        ...(((_b = endpoints === null || endpoints === void 0 ? void 0 : endpoints.allFlows) === null || _b === void 0 ? void 0 : _b.actions) || []),
        ...(((_c = endpoints === null || endpoints === void 0 ? void 0 : endpoints.disabledFlows) === null || _c === void 0 ? void 0 : _c.syncs) || []),
        ...(((_d = endpoints === null || endpoints === void 0 ? void 0 : endpoints.disabledFlows) === null || _d === void 0 ? void 0 : _d.actions) || [])
    ];
    // if any element in the array has elements in the endpoints array then return true
    const hasEndpoints = allFlows.some((flow) => flow.endpoints.length > 0);
    return (<div className="h-fit rounded-md text-white text-sm">
            {!hasEndpoints ? (<div className="flex flex-col border border-border-gray rounded-md text-white text-sm text-center p-10">
                    <h2 className="text-xl text-center w-full">No available endpoint</h2>
                    <div className="mt-4 text-gray-400">
                        There is no{' '}
                        <a className="text-text-blue hover:text-text-light-blue" href="https://docs.nango.dev/understand/concepts/templates" target="_blank" rel="noreferrer">
                            integration template
                        </a>{' '}
                        available for this API yet.
                    </div>
                    <HelpFooter_1.default />
                </div>) : (<>
                    <table className="w-[976px]">
                        <tbody className="flex flex-col max-w-[976px]">
                            <tr>
                                <td className="flex items-center px-3 justify-between text-xs px-2 py-2 bg-active-gray border border-neutral-800 rounded-md">
                                    <div className="w-0">Endpoint</div>
                                    <div className="w-64 -ml-11">Description</div>
                                    <div className="">Enabled</div>
                                </td>
                            </tr>
                            {allFlows.map((flow, flowIndex) => (<react_1.Fragment key={flowIndex}>
                                    {flow.endpoints.map((endpoint, index) => (<tr key={`tr-${flow.name}-${flowIndex}-${index}`}>
                                            <EndpointRow_1.default flow={flow} endpoint={endpoint} integration={integration} setSubTab={setSubTab} setFlow={setFlow} setEndpoint={setEndpoint}/>
                                        </tr>))}
                                </react_1.Fragment>))}
                        </tbody>
                    </table>
                    <HelpFooter_1.default />
                </>)}
        </div>);
}
exports.default = APIReference;
//# sourceMappingURL=APIReference.js.map