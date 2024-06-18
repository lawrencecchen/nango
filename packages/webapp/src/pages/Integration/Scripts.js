"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@geist-ui/core");
const outline_1 = require("@heroicons/react/24/outline");
const Show_1 = require("./Show");
const EnableDisableSync_1 = __importDefault(require("./components/EnableDisableSync"));
const HelpFooter_1 = __importDefault(require("./components/HelpFooter"));
function Scripts(props) {
    var _a, _b, _c, _d;
    const { integration, endpoints, reload, setFlow, setSubTab, setFlowConfig } = props;
    const syncs = [...(((_a = endpoints === null || endpoints === void 0 ? void 0 : endpoints.allFlows) === null || _a === void 0 ? void 0 : _a.syncs) || []), ...(((_b = endpoints === null || endpoints === void 0 ? void 0 : endpoints.disabledFlows) === null || _b === void 0 ? void 0 : _b.syncs) || [])];
    const actions = [...(((_c = endpoints === null || endpoints === void 0 ? void 0 : endpoints.allFlows) === null || _c === void 0 ? void 0 : _c.actions) || []), ...(((_d = endpoints === null || endpoints === void 0 ? void 0 : endpoints.disabledFlows) === null || _d === void 0 ? void 0 : _d.actions) || [])];
    const hasScripts = syncs.length || actions.length;
    const routeToScript = (flow) => {
        setFlow(flow);
        setSubTab(Show_1.SubTabs.Flow);
        if (flow.is_public) {
            setFlowConfig(endpoints.disabledFlows);
        }
        else {
            setFlowConfig(endpoints.allFlows);
        }
    };
    return (<div className="h-fit rounded-md text-white text-sm">
            {!hasScripts ? (<div className="flex flex-col border border-border-gray rounded-md text-white text-sm text-center p-10">
                    <h2 className="text-xl text-center w-full">No available script</h2>
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
                        <tbody className="flex flex-col">
                            <tr>
                                <td className="flex items-center px-3 justify-between text-xs px-2 py-2 bg-active-gray border border-neutral-800 rounded-md">
                                    <div className="flex w-18 items-center">
                                        <outline_1.ArrowPathRoundedSquareIcon className="flex h-4 w-4 mr-1"/>
                                        Sync Scripts
                                    </div>
                                    <div className="w-12 -ml-10">Models</div>
                                    <div className="w-72">Description</div>
                                    <div className="w-12">Source</div>
                                    <div className="">Enabled</div>
                                </td>
                            </tr>
                            <tr>
                                {syncs.length > 0 && (<>
                                        {syncs.map((flow) => {
                    var _a;
                    return (<td key={flow.name} className="flex items-center p-3 py-4 hover:bg-hover-gray cursor-pointer justify-between border-b border-border-gray" onClick={() => routeToScript(flow)}>
                                                <div className="flex items-center w-36">
                                                    <span className="w-48">{flow.name}</span>
                                                </div>
                                                <div className="flex items-center w-36 -ml-8">
                                                    <core_1.Tooltip text={Array.isArray(flow.returns) ? flow.returns.join(', ') : flow.returns} type="dark">
                                                        <div className="w-36 max-w-3xl truncate">
                                                            {Array.isArray(flow.returns) ? flow.returns.join(', ') : flow.returns}
                                                        </div>
                                                    </core_1.Tooltip>
                                                </div>
                                                <div className="flex items-center w-[22rem] -ml-8">
                                                    <div className="w-72 max-w-3xl truncate">{flow.description}</div>
                                                </div>
                                                <div className="flex items-center w-32">{flow.is_public ? 'Template' : 'Custom'}</div>
                                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                                    <EnableDisableSync_1.default flow={flow} provider={integration.provider} providerConfigKey={integration.unique_key} reload={reload} rawName={(_a = endpoints === null || endpoints === void 0 ? void 0 : endpoints.disabledFlows) === null || _a === void 0 ? void 0 : _a.rawName} connections={integration === null || integration === void 0 ? void 0 : integration.connections}/>
                                                </div>
                                            </td>);
                })}
                                    </>)}
                            </tr>
                        </tbody>
                        <tbody className="flex mt-16 flex-col">
                            <tr>
                                <td className="flex items-center px-3 justify-between text-xs px-2 py-2 bg-active-gray border border-neutral-800 rounded-md">
                                    <div className="flex w-36 items-center">
                                        <outline_1.BoltIcon className="flex h-4 w-4 mr-1"/>
                                        Action Scripts
                                    </div>
                                    <div className="w-[36rem]">Description</div>
                                    <div className="w-12">Source</div>
                                    <div className="">Enabled</div>
                                </td>
                            </tr>
                            <tr>
                                {actions.length > 0 && (<>
                                        {actions.map((flow) => {
                    var _a;
                    return (<td key={flow.name} className="flex items-center cursor-pointer p-3 py-6 hover:bg-hover-gray justify-between border-b border-border-gray" onClick={() => routeToScript(flow)}>
                                                <div className="flex items-center w-36">
                                                    <span className="w-48">{flow.name}</span>
                                                </div>
                                                <div className="flex items-center w-[36rem]">
                                                    <div className="w-[710px] max-w-3xl truncate">{flow.description}</div>
                                                </div>
                                                <div className="flex items-center w-16">{flow.is_public ? 'Template' : 'Custom'}</div>
                                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                                    <EnableDisableSync_1.default flow={flow} provider={integration.provider} providerConfigKey={integration.unique_key} reload={reload} rawName={(_a = endpoints === null || endpoints === void 0 ? void 0 : endpoints.disabledFlows) === null || _a === void 0 ? void 0 : _a.rawName} connections={integration === null || integration === void 0 ? void 0 : integration.connections} showSpinner={true}/>
                                                </div>
                                            </td>);
                })}
                                    </>)}
                            </tr>
                        </tbody>
                    </table>
                    <HelpFooter_1.default />
                </>)}
        </div>);
}
exports.default = Scripts;
//# sourceMappingURL=Scripts.js.map