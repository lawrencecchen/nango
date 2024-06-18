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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_toastify_1 = require("react-toastify");
const swr_1 = __importDefault(require("swr"));
const core_1 = require("@geist-ui/core");
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const prism_1 = require("@mantine/prism");
const api_1 = require("../../utils/api");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const Spinner_1 = __importDefault(require("../../components/ui/Spinner"));
const Show_1 = require("./Show");
const EndpointLabel_1 = __importDefault(require("./components/EndpointLabel"));
const ActionModal_1 = __importDefault(require("../../components/ui/ActionModal"));
const Info_1 = __importDefault(require("../../components/ui/Info"));
const utils_1 = require("../../utils/utils");
const EnableDisableSync_1 = __importDefault(require("./components/EnableDisableSync"));
const language_snippets_1 = require("../../utils/language-snippets");
const store_1 = require("../../store");
function FlowPage(props) {
    var _a, _b, _c, _d;
    const { environment, integration, flow, flowConfig, reload, endpoints, setFlow, setActiveTab, setSubTab } = props;
    const env = (0, store_1.useStore)((state) => state.env);
    const { data: connections, error } = (0, swr_1.default)(`/api/v1/integration/${integration.unique_key}/connections?env=${env}`);
    const [showMetadataCode, setShowMetadataCode] = (0, react_1.useState)(false);
    const [showAutoStartCode, setShowAutoStartCode] = (0, react_1.useState)(false);
    const [isDownloading, setIsDownloading] = (0, react_1.useState)(false);
    const [isEnabling, setIsEnabling] = (0, react_1.useState)(false);
    const updateSyncFrequency = (0, api_1.useUpdateSyncFrequency)(env);
    const { setVisible, bindings } = (0, core_1.useModal)();
    const [modalTitle, setModalTitle] = (0, react_1.useState)('');
    const [modalContent, setModalContent] = (0, react_1.useState)('');
    const [modalAction, setModalAction] = (0, react_1.useState)(null);
    const [modalShowSpinner, setModalShowSpinner] = (0, react_1.useState)(false);
    const [modalTitleColor] = (0, react_1.useState)('text-white');
    const [showFrequencyEditMenu, setShowFrequencyEditMenu] = (0, react_1.useState)(false);
    const [frequencyEdit, setFrequencyEdit] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (error) {
            (0, api_1.requestErrorToast)();
        }
    }, [error]);
    const downloadFlow = () => __awaiter(this, void 0, void 0, function* () {
        setIsDownloading(true);
        const flowInfo = {
            id: flow === null || flow === void 0 ? void 0 : flow.id,
            name: flow === null || flow === void 0 ? void 0 : flow.name,
            provider: integration.provider,
            is_public: flow === null || flow === void 0 ? void 0 : flow.is_public,
            public_route: (flowConfig === null || flowConfig === void 0 ? void 0 : flowConfig.rawName) || integration.provider,
            providerConfigKey: integration.unique_key,
            flowType: flow === null || flow === void 0 ? void 0 : flow.type
        };
        const response = yield (0, api_1.apiFetch)(`/api/v1/flow/download?env=${env}`, {
            method: 'POST',
            body: JSON.stringify(flowInfo)
        });
        if (response.status !== 200) {
            const error = yield response.json();
            setIsDownloading(false);
            react_toastify_1.toast.error(error.error, {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
            return;
        }
        else {
            react_toastify_1.toast.success('Integration files downloaded successfully', {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
        }
        const blob = yield response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = Math.floor(new Date().getTime() / 1000).toString();
        link.href = url;
        link.download = `nango-integrations-${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
    });
    const editFrequency = () => {
        if (!(flow === null || flow === void 0 ? void 0 : flow.version)) {
            setModalTitle('Cannot edit sync frequency');
            setModalContent('The sync frequency cannot be edited unless the sync is enabled.');
            setVisible(true);
            return;
        }
        if (!flow.is_public) {
            setModalTitle('Cannot edit frequency for custom syncs');
            setModalContent('If you want to edit the frequency of this sync, edit it in your `nango.yaml` configuration file.');
            setVisible(true);
            return;
        }
        setShowFrequencyEditMenu(true);
    };
    const onSaveFrequency = () => {
        // just in case they included every
        const frequencyWithoutEvery = frequencyEdit.replace('every ', '');
        const frequencyWithoutNumber = frequencyWithoutEvery.replace(/\d+/g, '');
        const frequencyUnit = frequencyWithoutNumber.replace(/\s/g, '');
        let unit = '';
        switch (frequencyUnit) {
            case 'minutes':
            case 'minute':
            case 'min':
            case 'mins':
            case 'm':
                unit = 'minutes';
                break;
            case 'hours':
            case 'hour':
            case 'hr':
            case 'hrs':
            case 'h':
                unit = 'hours';
                break;
            case 'days':
            case 'day':
            case 'd':
                unit = 'days';
                break;
        }
        if (unit === 'minutes' && parseInt(frequencyWithoutEvery) < 5) {
            setModalTitle('Invalid frequency');
            setModalContent('The minimum frequency is 5 minutes.');
            setVisible(true);
            return;
        }
        if (unit === '') {
            setModalTitle('Invalid frequency unit');
            setModalContent(`The unit "${frequencyUnit}" is not a valid time unit. Valid units are minutes, hours, and days.`);
            setVisible(true);
            return;
        }
        setModalTitle('Edit sync frequency?');
        setModalContent('This will affect potential many connections. Increased frequencies can increase your billing.');
        setVisible(true);
        setModalAction(() => () => __awaiter(this, void 0, void 0, function* () {
            setModalShowSpinner(true);
            yield updateSyncFrequency(flow === null || flow === void 0 ? void 0 : flow.id, frequencyWithoutEvery);
            setModalShowSpinner(false);
            setShowFrequencyEditMenu(false);
            setVisible(false);
            reload();
            setFlow(Object.assign(Object.assign({}, flow), { runs: `every ${frequencyWithoutEvery}` }));
        }));
    };
    if (error) {
        return <></>;
    }
    if (!flow) {
        return <core_1.Loading spaceRatio={2.5} className="-top-36"/>;
    }
    const routeToReference = () => {
        setActiveTab(Show_1.Tabs.API);
        setSubTab(Show_1.SubTabs.Reference);
    };
    return (<>
            <ActionModal_1.default bindings={bindings} modalTitle={modalTitle} modalContent={modalContent} modalAction={modalAction} modalShowSpinner={modalShowSpinner} modalTitleColor={modalTitleColor} setVisible={setVisible}/>
            <div className="mx-auto space-y-10 text-sm">
                <div className="flex justify-between">
                    <div className="flex">
                        <div className="mt-3">
                            <span className="text-left text-base font-semibold tracking-tight text-gray-400 mb-12">
                                {((_b = (_a = flow === null || flow === void 0 ? void 0 : flow.type) === null || _a === void 0 ? void 0 : _a.charAt(0)) === null || _b === void 0 ? void 0 : _b.toUpperCase()) + ((_c = flow === null || flow === void 0 ? void 0 : flow.type) === null || _c === void 0 ? void 0 : _c.slice(1))} Script
                            </span>
                            <h2 className="text-left text-[28px] font-semibold tracking-tight text-white mb-12">{flow === null || flow === void 0 ? void 0 : flow.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Button_1.default variant="zinc" disabled={isDownloading} size="sm" onClick={() => downloadFlow()}>
                            <outline_1.CodeBracketIcon className="flex h-5 w-5 cursor-pointer"/>
                            {!isDownloading ? 'Download Code' : 'Downloading'}
                            {isDownloading && <Spinner_1.default size={1}/>}
                        </Button_1.default>
                    </div>
                </div>
                {flow.is_public && (<div className="my-1">
                        <Info_1.default size={18} padding="px-4 py-1.5">
                            This script originates from a template made public by Nango. Templates are intended as a starting point and can easily be customized{' '}
                            <a href="https://docs.nango.dev/customize/guides/extend-an-integration-template" target="_blank" className="text-white underline" rel="noreferrer">
                                (learn more)
                            </a>
                            .
                        </Info_1.default>
                    </div>)}
                {(flow === null || flow === void 0 ? void 0 : flow.nango_yaml_version) === 'v1' && (<div className="my-5">
                        <Info_1.default size={18} padding="px-4 py-1.5">
                            This {flow === null || flow === void 0 ? void 0 : flow.type} is using the legacy nango.yaml schema.{' '}
                            <a href="https://docs.nango.dev/customize/guides/advanced/migrate-integration-configuration" target="_blank" className="text-white underline" rel="noreferrer">
                                Migrate to the new schema
                            </a>{' '}
                            to unlock capabilities, including auto-generated API documentation.
                        </Info_1.default>
                    </div>)}
                {(flow === null || flow === void 0 ? void 0 : flow.description) && (<div className="flex flex-col">
                        <span className="text-gray-400 text-xs uppercase mb-1">Description</span>
                        <div className="text-white">{flow === null || flow === void 0 ? void 0 : flow.description}</div>
                    </div>)}
                <div className="flex">
                    <div className="flex flex-col w-1/2">
                        <span className="text-gray-400 text-xs uppercase mb-1">Enabled</span>
                        {connections && (<span className="flex">
                                <EnableDisableSync_1.default flow={flow} provider={integration.provider} providerConfigKey={integration.unique_key} reload={reload} rawName={flowConfig === null || flowConfig === void 0 ? void 0 : flowConfig.rawName} connections={connections} endpoints={endpoints} setIsEnabling={setIsEnabling}/>
                                {flow.type === 'action' && isEnabling && (<span className="ml-2">
                                        <Spinner_1.default size={1}/>
                                    </span>)}
                            </span>)}
                    </div>
                    <div className="flex flex-col w-1/2">
                        <span className="text-gray-400 text-xs uppercase mb-1">Endpoints</span>
                        {flow === null || flow === void 0 ? void 0 : flow.endpoints.map((endpoint, index) => (<div key={index} onClick={routeToReference} className="flex flex-col space-y-2 cursor-pointer">
                                <EndpointLabel_1.default endpoint={endpoint} type={flow.type}/>
                            </div>))}
                    </div>
                </div>
                {((flow === null || flow === void 0 ? void 0 : flow.version) || (flow === null || flow === void 0 ? void 0 : flow.last_deployed)) && (<div className="flex">
                        {(flow === null || flow === void 0 ? void 0 : flow.version) && (<div className="flex flex-col w-1/2">
                                <span className="text-gray-400 text-xs uppercase mb-1">Version</span>
                                <span className="text-white">{flow === null || flow === void 0 ? void 0 : flow.version}</span>
                            </div>)}
                        {(flow === null || flow === void 0 ? void 0 : flow.last_deployed) && (<div className="flex flex-col w-1/2">
                                <span className="text-gray-400 text-xs uppercase mb-1">Last Deployed</span>
                                <div className="text-white">{(0, utils_1.formatDateToShortUSFormat)(flow === null || flow === void 0 ? void 0 : flow.last_deployed)}</div>
                            </div>)}
                    </div>)}
                <div className="flex">
                    <div className="flex flex-col w-1/2">
                        <span className="text-gray-400 text-xs uppercase mb-1">Source</span>
                        <div className="text-white">{(flow === null || flow === void 0 ? void 0 : flow.is_public) ? 'Template' : 'Custom'}</div>
                    </div>
                    {(flow === null || flow === void 0 ? void 0 : flow.sync_type) && (<div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">Type</span>
                            <div className="text-white">{(flow === null || flow === void 0 ? void 0 : flow.sync_type) === 'FULL' ? 'Full Refresh' : 'Incremental'}</div>
                        </div>)}
                </div>
                {(flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' && (<div className="flex">
                        <div className="flex flex-col w-1/2 relative">
                            <span className="text-gray-400 text-xs uppercase mb-1">Frequency</span>
                            <div className="w-2/3">
                                <div className="flex text-white space-x-3">
                                    {showFrequencyEditMenu ? (<>
                                            <input value={frequencyEdit} onChange={(e) => setFrequencyEdit(e.target.value)} className="bg-active-gray w-full text-white rounded-md px-3 py-0.5 mt-0.5 focus:border-white" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onSaveFrequency();
                    }
                }}/>
                                            <outline_1.XCircleIcon className="flex h-5 w-5 text-red-400 cursor-pointer hover:text-red-700" onClick={() => setShowFrequencyEditMenu(false)}/>
                                        </>) : (<>
                                            <span>{flow === null || flow === void 0 ? void 0 : flow.runs}</span>
                                            <outline_1.PencilSquareIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => editFrequency()}/>
                                        </>)}
                                </div>
                                {showFrequencyEditMenu && frequencyEdit && (<div className="flex items-center border border-border-gray bg-active-gray text-white rounded-md px-3 py-0.5 mt-0.5 cursor-pointer">
                                        <outline_1.PencilSquareIcon className="flex h-5 w-5 cursor-pointer hover:text-zinc-400" onClick={() => editFrequency()}/>
                                        <span className="mt-0.5 cursor-pointer ml-1" onClick={() => onSaveFrequency()}>
                                            Change frequency to: {frequencyEdit}
                                        </span>
                                    </div>)}
                            </div>
                        </div>
                        <div className="flex flex-col w-1/2">
                            <span className="text-gray-400 text-xs uppercase mb-1">Track Deletes</span>
                            <div className="text-white">{(flow === null || flow === void 0 ? void 0 : flow.track_deletes) ? 'Yes' : 'No'}</div>
                        </div>
                    </div>)}
                {(flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' && ((_d = flow === null || flow === void 0 ? void 0 : flow.webhookSubscriptions) === null || _d === void 0 ? void 0 : _d.length) > 0 && (<div className="flex">
                        <div className="flex flex-col w-1/2 relative">
                            <span className="text-gray-400 text-xs uppercase mb-1">Webhook Subscriptions</span>
                            <div className="text-white">{flow.webhookSubscriptions.join(', ')}</div>
                        </div>
                    </div>)}
                {(flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' && (<>
                        {!(flow === null || flow === void 0 ? void 0 : flow.input) || Object.keys(flow === null || flow === void 0 ? void 0 : flow.input).length === 0 ? (<div className="flex">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs uppercase mb-1">Metadata</span>
                                    <div className="text-white">No</div>
                                </div>
                            </div>) : (<div className="flex">
                                <div className="flex flex-col w-full">
                                    <span className="text-gray-400 text-xs uppercase mb-2">Metadata</span>
                                    <div className="text-sm w-full text-[#C3E5FA]">
                                        <Info_1.default size={16} verticallyCenter={false}>
                                            <span>To use this sync, programmatically add metadata on each connection.</span>
                                            <div className="flex w-[700px] cursor-pointer" onClick={() => setShowMetadataCode(!showMetadataCode)}>
                                                <div className="flex-col items-center mt-4 border border-blue-400 border-opacity-50 rounded px-2 py-2 -ml-8 w-full">
                                                    <div className="flex">
                                                        {showMetadataCode ? (<outline_1.ChevronDownIcon className="flex h-5 w-5 text-blue-400 text-opacity-50"/>) : (<outline_1.ChevronUpIcon className="flex h-5 w-5 text-blue-400 text-opacity-50 cursor-pointer"/>)}
                                                        <span className="ml-2 text-blue-400 text-opacity-50">
                                                            {showMetadataCode ? 'Hide Code' : 'Show Code'}
                                                        </span>
                                                    </div>
                                                    {showMetadataCode && (<div className="border-opacity-50 rounded-md text-white text-sm py-2 mt-3">
                                                            <div className="flex justify-between items-center px-4 py-2 border-b border-border-blue-400">
                                                                <div className="space-x-4">
                                                                    <Button_1.default type="button" variant="black" className="pointer-events-none">
                                                                        Node
                                                                    </Button_1.default>
                                                                </div>
                                                                <CopyButton_1.default dark text={(0, language_snippets_1.setMetadaSnippet)(environment.secret_key, integration.unique_key, (0, utils_1.parseInput)(flow))}/>
                                                            </div>
                                                            <prism_1.Prism noCopy language="typescript" className="p-1 transparent-code" colorScheme="dark">
                                                                {(0, language_snippets_1.setMetadaSnippet)(environment.secret_key, integration.unique_key, (0, utils_1.parseInput)(flow))}
                                                            </prism_1.Prism>
                                                        </div>)}
                                                </div>
                                            </div>
                                        </Info_1.default>
                                    </div>
                                </div>
                            </div>)}
                    </>)}
                {(flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' && (<>
                        {(flow === null || flow === void 0 ? void 0 : flow.auto_start) === true ? (<div className="flex">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs uppercase mb-1">Auto Starts</span>
                                    <div className="text-white">No</div>
                                </div>
                            </div>) : (<div className="flex">
                                <div className="flex flex-col w-full">
                                    <span className="text-gray-400 text-xs uppercase mb-2">Auto Starts</span>
                                    <div className="text-sm w-full">
                                        <Info_1.default size={18} verticallyCenter={false}>
                                            <span>To use this sync, programmatically start the sync for each connection.</span>
                                            <div className="flex w-[700px] cursor-pointer" onClick={() => setShowAutoStartCode(!showAutoStartCode)}>
                                                <div className="flex-col items-center mt-4 border border-blue-400 border-opacity-50 rounded px-2 py-2 -ml-8 w-full">
                                                    <div className="flex">
                                                        {showAutoStartCode ? (<outline_1.ChevronDownIcon className="flex h-5 w-5 text-blue-400 text-opacity-50"/>) : (<outline_1.ChevronUpIcon className="flex h-5 w-5 text-blue-400 text-opacity-50 cursor-pointer"/>)}
                                                        <span className="ml-2 text-blue-400 text-opacity-50">
                                                            {showAutoStartCode ? 'Hide Code' : 'Show Code'}
                                                        </span>
                                                    </div>
                                                    {showAutoStartCode && (<div className="border border-blue-400 border-opacity-50 rounded-md text-white text-sm py-2 mt-3">
                                                            <div className="flex justify-between items-center px-4 py-4 border-b border-border-blue-400">
                                                                <div className="space-x-4">
                                                                    <Button_1.default type="button" variant="black" className="pointer-events-none">
                                                                        Node
                                                                    </Button_1.default>
                                                                </div>
                                                                <CopyButton_1.default dark text={(0, language_snippets_1.autoStartSnippet)(environment.secret_key, integration.unique_key, flow === null || flow === void 0 ? void 0 : flow.name)}/>
                                                            </div>
                                                            <prism_1.Prism noCopy language="typescript" className="p-1 transparent-code" colorScheme="dark">
                                                                {(0, language_snippets_1.autoStartSnippet)(environment.secret_key, integration.unique_key, flow === null || flow === void 0 ? void 0 : flow.name)}
                                                            </prism_1.Prism>
                                                        </div>)}
                                                </div>
                                            </div>
                                        </Info_1.default>
                                    </div>
                                </div>
                            </div>)}
                    </>)}
                {(flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' && (<>
                        {(flow === null || flow === void 0 ? void 0 : flow.returns) && (<div className="flex">
                                <div className="flex flex-col w-full">
                                    <span className="text-gray-400 text-xs uppercase mb-2">Output Models</span>
                                    {(Array.isArray(flow === null || flow === void 0 ? void 0 : flow.returns) ? flow === null || flow === void 0 ? void 0 : flow.returns : [flow === null || flow === void 0 ? void 0 : flow.returns]).map((model, index) => (<div key={index}>
                                                <span className="text-white">{model}</span>
                                                <div className="border border-border-gray rounded-md text-white text-sm mt-3">
                                                    <div className="flex justify-between items-center px-4 py-3 border-b border-border-gray">
                                                        <div className="flex items-center space-x-4">
                                                            <Button_1.default type="button" variant="active" className="pointer-events-none">
                                                                JSON
                                                            </Button_1.default>
                                                        </div>
                                                        <CopyButton_1.default dark text={JSON.stringify([(0, utils_1.generateResponseModel)(flow.models, model, true)], null, 2)}/>
                                                    </div>
                                                    <prism_1.Prism noCopy language="json" className="p-3 transparent-code" colorScheme="dark">
                                                        {JSON.stringify({
                        records: [(0, utils_1.generateResponseModel)(flow.models, model, true)],
                        next_cursor: 'MjAyMy0xMS0xN1QxMTo0NzoxNC40NDcrMDI6MDB8fDAz...'
                    }, null, 2)}
                                                    </prism_1.Prism>
                                                </div>
                                            </div>))}
                                </div>
                            </div>)}
                    </>)}
            </div>
        </>);
}
exports.default = FlowPage;
//# sourceMappingURL=FlowPage.js.map