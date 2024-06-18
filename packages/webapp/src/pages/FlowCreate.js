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
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const react_toastify_1 = require("react-toastify");
const prism_1 = require("@mantine/prism");
const api_1 = require("../utils/api");
const LeftNavBar_1 = require("../components/LeftNavBar");
const DashboardLayout_1 = __importDefault(require("../layout/DashboardLayout"));
const store_1 = require("../store");
const Info_1 = __importDefault(require("../components/ui/Info"));
const Button_1 = __importDefault(require("../components/ui/button/Button"));
const Spinner_1 = __importDefault(require("../components/ui/Spinner"));
function FlowCreate() {
    const env = (0, store_1.useStore)((state) => state.env);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [isDownloading, setIsDownloading] = (0, react_1.useState)(false);
    const [integration, setIntegration] = (0, react_1.useState)('');
    const [flows, setFlows] = (0, react_1.useState)({});
    const [possibleFlowsFromSelection, setPossibleFlowsFromSelection] = (0, react_1.useState)([]);
    const [flowNames, setFlowNames] = (0, react_1.useState)([]);
    const [flow, setFlow] = (0, react_1.useState)();
    const [models, setModels] = (0, react_1.useState)({});
    const [selectedFlowName, setSelectedFlowName] = (0, react_1.useState)('');
    const [alreadyAddedFlows, setAlreadyAddedFlows] = (0, react_1.useState)([]);
    const [canAdd, setCanAdd] = (0, react_1.useState)(true);
    const [frequencyValue, setFrequencyValue] = (0, react_1.useState)();
    const [frequencyUnit, setFrequencyUnit] = (0, react_1.useState)();
    const [showFrequencyError, setShowFrequencyError] = (0, react_1.useState)(false);
    const getFlows = (0, api_1.useGetFlows)(env);
    const createFlow = (0, api_1.useCreateFlow)(env);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        setLoaded(false);
    }, [env]);
    (0, react_1.useEffect)(() => {
        const getAvailableFlows = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield getFlows();
            if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
                const { availableFlows, addedFlows } = yield res.json();
                setAlreadyAddedFlows(addedFlows);
                setFlows(availableFlows.integrations);
                const integration = Object.keys(availableFlows.integrations)[0];
                setIntegration(integration);
                setSelectedFlowName(Object.keys(availableFlows.integrations[Object.keys(availableFlows.integrations)[0]])[0]);
                const flowNames = Object.keys(availableFlows.integrations[Object.keys(availableFlows.integrations)[0]]).filter((name) => name !== 'models' && name !== 'rawName');
                setFlowNames(flowNames);
                setPossibleFlowsFromSelection(flowNames.map((name) => availableFlows.integrations[integration][name]));
                const flow = availableFlows.integrations[Object.keys(availableFlows.integrations)[0]][Object.keys(availableFlows.integrations[Object.keys(availableFlows.integrations)[0]])[0]];
                flow.type = flow.type || 'sync';
                setFlow(flow);
                updateFrequency(flow.runs);
                setModels(availableFlows.integrations[Object.keys(availableFlows.integrations)[0]]['models']);
            }
        });
        if (!loaded) {
            setLoaded(true);
            getAvailableFlows();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getFlows, loaded]);
    const handleSave = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!flow) {
            return;
        }
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const frequencyValue = Number(data['frequency']);
        const frequencyUnit = data['frequency-unit'];
        if (frequencyValue && frequencyValue < 5 && frequencyUnit === 'minutes') {
            setShowFrequencyError(true);
            return;
        }
        else {
            setShowFrequencyError(false);
        }
        const flowObject = flows[data['integration']];
        const models = Array.isArray(flow.returns) ? showModels(flow.returns) : flow.returns;
        const flowPayload = {
            provider: data['integration'].toString(),
            type: flow.type || 'sync',
            name: data['flow-name'].toString(),
            runs: flow.type === 'action' ? null : `every ${frequencyValue} ${frequencyUnit}`,
            auto_start: flow.auto_start !== false,
            models: Array.isArray(flow.returns) ? flow.returns : [flow.returns],
            model_schema: JSON.stringify(Object.keys(models).map((model) => ({
                name: model,
                fields: Object.keys(models[model]).map((field) => ({
                    name: field,
                    type: models[model][field]
                }))
            }))),
            is_public: true,
            public_route: flowObject.rawName || data['integration'].toString()
        };
        const res = yield createFlow([flowPayload]);
        if ((res === null || res === void 0 ? void 0 : res.status) === 201) {
            react_toastify_1.toast.success(`${flowPayload.type} created successfully!`, { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            navigate('/syncs', { replace: true });
        }
        else if (res != null) {
            const payload = yield res.json();
            react_toastify_1.toast.error(payload.error, {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
        }
    });
    const handleIntegrationChange = (e) => {
        setIntegration(e.target.value);
        setShowFrequencyError(false);
        const flowNamesWithModels = Object.keys(flows[e.target.value]);
        const flowNames = flowNamesWithModels.filter((name) => name !== 'models' && name !== 'rawName');
        setPossibleFlowsFromSelection(flowNames.map((name) => flows[e.target.value][name]));
        setFlowNames(flowNames);
        setSelectedFlowName(flowNames[0]);
        const alreadyAdded = alreadyAddedFlows.find((flow) => flow.unique_key === e.target.value && flow.sync_name === flowNames[0]);
        setCanAdd(alreadyAdded === undefined);
        const flow = flows[e.target.value][flowNames[0]];
        setFlow(flow);
        updateFrequency(flow.runs);
        setModels(flows[e.target.value]['models']);
    };
    const handleFlowNameChange = (e) => {
        const flow = flows[integration][e.target.value];
        setSelectedFlowName(e.target.value);
        setShowFrequencyError(false);
        setFlow(flow);
        if (flow.type !== 'action') {
            updateFrequency(flow.runs);
        }
        setModels(flows[integration]['models']);
        const alreadyAdded = alreadyAddedFlows.find((flow) => flow.unique_key === integration && flow.sync_name === e.target.value);
        setCanAdd(alreadyAdded === undefined);
    };
    const showModels = (returns) => {
        var _a;
        const builtModels = {};
        if (!Array.isArray(returns)) {
            return (_a = models[returns]) !== null && _a !== void 0 ? _a : returns;
        }
        returns.forEach((returnedModel) => {
            builtModels[returnedModel] = models[returnedModel];
        });
        return builtModels;
    };
    const matchDefaultFrequencyValue = (frequency) => {
        var _a;
        const frequencyValue = (_a = frequency.match(/\d+/g)) === null || _a === void 0 ? void 0 : _a[0];
        if (frequency.includes('half')) {
            setFrequencyValue(30);
            return;
        }
        if (!frequencyValue) {
            setFrequencyValue(1);
            return;
        }
        setFrequencyValue(Number(frequencyValue));
    };
    const matchDefaultFrequencyUnit = (frequency) => {
        const frequencyWithoutEvery = frequency.replace('every ', '');
        const frequencyWithoutNumber = frequencyWithoutEvery.replace(/\d+/g, '');
        const frequencyUnit = frequencyWithoutNumber.replace(/\s/g, '');
        let unit = '';
        switch (frequencyUnit) {
            case 'minutes':
            case 'minute':
            case 'min':
            case 'mins':
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
        setFrequencyUnit(unit);
    };
    function updateFrequency(frequency) {
        matchDefaultFrequencyValue(frequency);
        matchDefaultFrequencyUnit(frequency);
    }
    const downloadFlow = () => __awaiter(this, void 0, void 0, function* () {
        setIsDownloading(true);
        const flowObject = flows[integration];
        const flowInfo = {
            name: selectedFlowName,
            provider: integration,
            is_public: true,
            public_route: flowObject.rawName || integration
        };
        const response = yield (0, api_1.apiFetch)(`/api/v1/flow/download?env=${env}`, {
            method: 'POST',
            body: JSON.stringify(flowInfo)
        });
        if (response.status !== 200) {
            const error = yield response.json();
            react_toastify_1.toast.error(error.error, {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
            setIsDownloading(false);
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
        link.href = url;
        link.download = 'nango-integrations.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
    });
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Syncs}>
            {flows && Object.keys(flows).length > 0 && (<div className="mx-auto pb-40">
                    <h2 className="mx-20 mt-16 text-left text-3xl font-semibold tracking-tight text-white mb-12">Add New Sync or Action</h2>
                    <div className="mx-20 h-fit text-white text-sm">
                        <div className="mb-8">
                            <Info_1.default>
                                If none of the available templates fit your specific needs, you can create your own{' '}
                                <a href={`https://docs.nango.dev/customize/guides/create-a-custom-integration`} className="text-[#4E80EE]" rel="noreferrer" target="_blank">
                                    custom {(flow === null || flow === void 0 ? void 0 : flow.type) || 'sync'}s
                                </a>
                                , or request that we build them for you by reaching out on our{' '}
                                <a href="https://nango.dev/slack" className="text-[#4E80EE]" rel="noreferrer" target="_blank">
                                    community
                                </a>
                                .
                            </Info_1.default>
                        </div>
                        <form className="space-y-6" onSubmit={handleSave} autoComplete="off">
                            <div>
                                <div>
                                    <div className="flex">
                                        <label htmlFor="integration" className="text-text-light-gray block text-sm font-semibold">
                                            Provider
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <select id="integration" name="integration" className="border-border-gray bg-bg-black text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base shadow-sm active:outline-none focus:outline-none active:border-white focus:border-white" onChange={handleIntegrationChange} defaultValue={Object.keys(flows)[0]}>
                                            {Object.keys(flows).map((integration, index) => (<option key={index} value={integration}>
                                                    {integration}
                                                </option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div className="flex">
                                        <label htmlFor="flow-name" className="text-text-light-gray block text-sm font-semibold">
                                            Template
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <select id="flow-name" name="flow-name" className="border-border-gray bg-bg-black text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base shadow-sm active:outline-none focus:outline-none active:border-white focus:border-white" onChange={handleFlowNameChange} value={selectedFlowName}>
                                            {flowNames.map((flowName, index) => {
                var _a;
                return (<option key={index} value={flowName}>
                                                    {flowName} (
                                                    {((_a = possibleFlowsFromSelection[index]) === null || _a === void 0 ? void 0 : _a.type) === 'action' ? 'action' : 'sync'})
                                                </option>);
            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {(flow === null || flow === void 0 ? void 0 : flow.description) && (<div>
                                    <div className="flex">
                                        <label htmlFor="flow-name" className="text-text-light-gray block text-sm font-semibold">
                                            Description
                                        </label>
                                    </div>
                                    <div className="mt-1">
                                        <span className="text-text-light-gray">{flow.description}</span>
                                    </div>
                                </div>)}
                            {(flow === null || flow === void 0 ? void 0 : flow.type) !== 'action' && (<div>
                                    <div>
                                        <div className="flex">
                                            <label htmlFor="flow-name" className="text-text-light-gray block text-sm font-semibold">
                                                Frequency
                                            </label>
                                        </div>
                                        <div className="flex mt-1">
                                            <div className="flex">
                                                <input id="frequency" name="frequency" type="number" className="border-border-gray bg-bg-black text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base shadow-sm active:outline-none focus:outline-none active:border-white focus:border-white" value={frequencyValue} onChange={(e) => setFrequencyValue(Number(e.target.value))}/>
                                                <select id="frequency-unit" name="frequency-unit" className="ml-4 border-border-gray bg-bg-black text-text-light-gray block h-11 w-full appearance-none rounded-md border px-3 py-2 text-base shadow-sm active:outline-none focus:outline-none active:border-white focus:border-white" value={frequencyUnit} onChange={(e) => setFrequencyUnit(e.target.value)}>
                                                    <option value="minutes">{frequencyValue === 1 ? 'Minute' : 'Minutes'}</option>
                                                    <option value="hours">{frequencyValue === 1 ? 'Hour' : 'Hours'}</option>
                                                    <option value="days">{frequencyValue === 1 ? 'Day' : 'Days'}</option>
                                                </select>
                                            </div>
                                        </div>
                                        {showFrequencyError && <span className="block text-red-500">Frequency cannot be less than 5 minutes</span>}
                                    </div>
                                </div>)}
                            {(flow === null || flow === void 0 ? void 0 : flow.type) !== 'action' && (<div>
                                    <div>
                                        <div className="flex">
                                            <label htmlFor="flow-name" className="text-text-light-gray block text-sm font-semibold">
                                                Auto Starts
                                            </label>
                                        </div>
                                        <div className="mt-1">
                                            <span className="text-white">{(flow === null || flow === void 0 ? void 0 : flow.auto_start) === false ? 'No' : 'Yes'}</span>
                                        </div>
                                    </div>
                                </div>)}
                            {(flow === null || flow === void 0 ? void 0 : flow.returns) && (<div>
                                    <div>
                                        <div className="flex">
                                            <label htmlFor="flow-name" className="text-text-light-gray block text-sm font-semibold">
                                                Model{flow.returns.length > 1 ? 's' : ''}
                                            </label>
                                        </div>
                                        <prism_1.Prism language="json" colorScheme="dark">
                                            {JSON.stringify(showModels(flow.returns), null, 2)}
                                        </prism_1.Prism>
                                    </div>
                                </div>)}
                            <div className="flex flex-col">
                                <div className="flex flex-row items-center">
                                    {canAdd && (<button type="submit" className="bg-white h-8 rounded-md hover:bg-gray-300 border px-3 pt-0.5 text-sm text-black mr-4">
                                            Add {(flow === null || flow === void 0 ? void 0 : flow.type) === 'action' ? 'Action' : 'Sync'}
                                        </button>)}
                                    <Button_1.default type="button" variant="secondary" onClick={downloadFlow}>
                                        Download
                                    </Button_1.default>
                                    {isDownloading && (<span className="ml-4">
                                            <Spinner_1.default size={2}/>
                                        </span>)}
                                </div>
                                {!canAdd && <span className="flex flex-col mt-2 text-red-500">This flow has already been added!</span>}
                            </div>
                        </form>
                    </div>
                </div>)}
        </DashboardLayout_1.default>);
}
exports.default = FlowCreate;
//# sourceMappingURL=FlowCreate.js.map