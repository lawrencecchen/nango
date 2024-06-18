"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const prism_1 = require("@mantine/prism");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const Info_1 = __importDefault(require("../../components/ui/Info"));
const EndpointLabel_1 = __importDefault(require("./components/EndpointLabel"));
const language_snippets_1 = require("../../utils/language-snippets");
const utils_1 = require("../../utils/utils");
const Show_1 = require("./Show");
const store_1 = require("../../store");
var Language;
(function (Language) {
    Language[Language["Node"] = 0] = "Node";
    Language[Language["cURL"] = 1] = "cURL";
    Language[Language["Python"] = 2] = "Python";
    Language[Language["PHP"] = 3] = "PHP";
    Language[Language["Go"] = 4] = "Go";
    Language[Language["Java"] = 5] = "Java";
})(Language || (Language = {}));
function EndpointReference(props) {
    const { environment, integration, activeFlow, setSubTab, setActiveTab, activeEndpoint } = props;
    const [showParametersOpen, setShowParametersOpen] = (0, react_1.useState)(false);
    const [language, setLanguage] = (0, react_1.useState)(Language.Node);
    const [syncSnippet, setSyncSnippet] = (0, react_1.useState)('');
    const [jsonResponseSnippet, setJsonResponseSnippet] = (0, react_1.useState)('');
    const connectionId = '<CONNECTION-ID>';
    const baseUrl = (0, store_1.useStore)((state) => state.baseUrl);
    (0, react_1.useEffect)(() => {
        if (activeFlow) {
            const model = activeFlow.models.length > 0 ? activeFlow.models : activeFlow.returns[0];
            setSyncSnippet(activeFlow.type === 'sync'
                ? (0, language_snippets_1.nodeSnippet)(model, environment.secret_key, connectionId, integration.unique_key)
                : (0, language_snippets_1.nodeActionSnippet)(activeFlow.name, environment.secret_key, connectionId, integration.unique_key, (0, utils_1.parseInput)(activeFlow)));
            const activeEndpointIndex = activeFlow.endpoints.findIndex((endpoint) => endpoint === activeEndpoint);
            const jsonModel = (0, utils_1.generateResponseModel)(activeFlow.models, Array.isArray(activeFlow.returns) ? activeFlow.returns[activeEndpointIndex] : activeFlow.returns, activeFlow.type === 'sync');
            if (activeFlow.type === 'sync') {
                setJsonResponseSnippet(JSON.stringify({ records: [Object.assign({}, jsonModel)], next_cursor: 'MjAyMy0xMS0xN1QxMTo0NzoxNC40NDcrMDI6MDB8fDAz...' }, null, 2));
            }
            else {
                setJsonResponseSnippet(JSON.stringify(jsonModel, null, 2));
            }
        }
    }, [activeFlow, environment, integration.unique_key, activeEndpoint]);
    const routeToFlow = () => {
        setActiveTab(Show_1.Tabs.Scripts);
        setSubTab(Show_1.SubTabs.Flow);
    };
    return (<div className="text-white">
            <div className="flex flex-col z-10 mt-4 text-gray-400">
                <span className="flex items-center">
                    <EndpointLabel_1.default endpoint={activeEndpoint} type={activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.type}/>
                    <outline_1.AdjustmentsHorizontalIcon onClick={routeToFlow} className="flex h-5 w-5 ml-2 cursor-pointer"/>
                </span>
                {(activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.description) && <span className="mt-2">{activeFlow.description}</span>}
            </div>
            {!(activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.version) && (activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.version) === null && (<Info_1.default size={18} classNames="mt-10 mb-10 z-10" padding="px-4 py-1.5" color="orange">
                    This endpoint is disabled. Enable it in the associated{' '}
                    <span className="cursor-pointer underline" onClick={routeToFlow}>
                        script settings
                    </span>
                    .
                </Info_1.default>)}
            <div className="flex flex-col z-10 mt-6">
                <h2 className="text-base">Request</h2>
                <span className="text-gray-400 mb-4">Use the following code snippet to call this endpoint: </span>
                <div className="border border-border-gray rounded-md text-white text-sm">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-border-gray">
                        <div className="flex items-center space-x-4">
                            <Button_1.default type="button" variant={language === Language.Node ? 'active' : 'hover'} className={`cursor-default ${language === Language.Node ? 'pointer-events-none' : 'cursor-pointer'}`} onClick={() => {
            if (language !== Language.Node) {
                setSyncSnippet((activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.type) === 'sync'
                    ? (0, language_snippets_1.nodeSnippet)(activeFlow && activeFlow.models.length > 0 ? activeFlow.models : activeFlow.returns[0], environment.secret_key, connectionId, integration.unique_key)
                    : (0, language_snippets_1.nodeActionSnippet)(activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.name, environment.secret_key, connectionId, integration.unique_key, (0, utils_1.parseInput)(activeFlow)));
                setLanguage(Language.Node);
            }
        }}>
                                Node
                            </Button_1.default>
                            <Button_1.default type="button" variant={language === Language.cURL ? 'active' : 'hover'} className={`cursor-default ${language === Language.cURL ? 'pointer-events-none' : 'cursor-pointer'}`} onClick={() => {
            if (language !== Language.cURL) {
                setSyncSnippet((0, language_snippets_1.curlSnippet)(baseUrl, activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.endpoints[0], environment.secret_key, connectionId, integration.unique_key, (0, utils_1.parseInput)(activeFlow)));
                setLanguage(Language.cURL);
            }
        }}>
                                cURL
                            </Button_1.default>
                        </div>
                        <CopyButton_1.default dark text={syncSnippet}/>
                    </div>
                    <prism_1.Prism noCopy language="typescript" className="p-3 transparent-code" colorScheme="dark">
                        {syncSnippet}
                    </prism_1.Prism>
                </div>
                {(activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.type) === 'sync' && (<>
                        <div className="flex flex-col mt-4 text-gray-400 border border-border-gray rounded-md p-3 mb-5">
                            <div className="flex w-full cursor-pointer" onClick={() => setShowParametersOpen(!showParametersOpen)}>
                                {showParametersOpen ? (<outline_1.ChevronDownIcon className="flex h-5 w-5 text-gray-400"/>) : (<outline_1.ChevronUpIcon className="flex h-5 w-5 text-gray-400 cursor-pointer"/>)}
                                <span className="ml-2">
                                    {showParametersOpen
                ? `Hide Optional ${language === Language.cURL ? 'Query ' : ''}Parameters`
                : `Show Optional ${language === Language.cURL ? 'Query ' : ''}Parameters`}
                                </span>
                            </div>
                            {showParametersOpen && (<div className="flex flex-col mt-4">
                                    <span>
                                        The following parameters can be added to the {language === Language.Node ? <i>listRecords</i> : 'request'}
                                        {language === Language.cURL ? ' as query params' : ''}:
                                    </span>
                                    <div className="border-t border-neutral-700 mt-4 py-4">
                                        <div className="flex">
                                            <span className="text-indigo-200">delta</span>
                                            <span className="ml-2 text-gray-400 bg-neutral-800 rounded text-xs px-1 py-1">string</span>
                                        </div>
                                        <span className="text-gray-400 mt-2">
                                            Only return records added, updated or deleted since this timestmap, e.g. &apos;2023-05-31T11:46:13.390Z&apos;
                                        </span>
                                    </div>
                                    <div className="border-t border-neutral-700 mt-4 py-4">
                                        <div className="flex">
                                            <span className="text-indigo-200">limit</span>
                                            <span className="ml-2 text-gray-400 bg-neutral-800 rounded text-xs px-1 py-1">number</span>
                                        </div>
                                        <span className="text-gray-400 mt-2">The maximum number of records to return. If not passed, defaults to 100.</span>
                                    </div>
                                    <div className="border-t border-neutral-700 mt-4 py-4">
                                        <div className="flex">
                                            <span className="text-indigo-200">cursor</span>
                                            <span className="ml-2 text-gray-400 bg-neutral-800 rounded text-xs px-1 py-1">string</span>
                                        </div>
                                        <span className="text-gray-400 mt-2">
                                            For pagination: obtained from the &apos;next_cursor&apos; property in the response to fetch the next page of
                                            results. The cursor will be included until there are no more results to paginate through.
                                        </span>
                                    </div>
                                    <div className="border-t border-neutral-700 mt-4 py-4">
                                        <div className="flex">
                                            <span className="text-indigo-200">filter</span>
                                            <span className="ml-2 text-gray-400 bg-neutral-800 rounded text-xs px-1 py-1">
                                                &apos;added&apos; | &apos;updated&apos; | &apos;deleted&apos;
                                            </span>
                                        </div>
                                        <span className="text-gray-400 mt-2">
                                            Only return records with the specified change. Accepts comma separated combinations e.g., &apos;added,updated&apos;.
                                        </span>
                                    </div>
                                </div>)}
                        </div>
                    </>)}
                <div className="flex flex-col mt-3">
                    <h2 className="text-base">Response</h2>
                    <span className="text-gray-400 mb-4">This endpoint returns the following response:</span>
                    <div className="border border-border-gray rounded-md text-white text-sm">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-border-gray">
                            <div className="space-x-4">
                                <Button_1.default type="button" variant="active" className={`cursor-default ${language === Language.Node ? 'pointer-events-none' : 'cursor-pointer'}`} onClick={() => {
            if (language !== Language.Node) {
                setSyncSnippet((activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.type) === 'sync'
                    ? (0, language_snippets_1.nodeSnippet)(activeFlow.models || activeFlow.returns[0], environment.secret_key, connectionId, integration.unique_key)
                    : (0, language_snippets_1.nodeActionSnippet)(activeFlow === null || activeFlow === void 0 ? void 0 : activeFlow.name, environment.secret_key, connectionId, integration.unique_key, (0, utils_1.parseInput)(activeFlow)));
                setLanguage(Language.Node);
            }
        }}>
                                    JSON
                                </Button_1.default>
                            </div>
                            <CopyButton_1.default dark text={jsonResponseSnippet}/>
                        </div>
                        <prism_1.Prism noCopy language="json" className="p-3 transparent-code" colorScheme="dark">
                            {jsonResponseSnippet}
                        </prism_1.Prism>
                    </div>
                </div>
            </div>
        </div>);
}
exports.default = EndpointReference;
//# sourceMappingURL=EndpointReference.js.map