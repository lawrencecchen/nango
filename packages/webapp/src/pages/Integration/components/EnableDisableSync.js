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
const react_1 = require("react");
const react_toastify_1 = require("react-toastify");
const core_1 = require("@geist-ui/core");
const ActionModal_1 = __importDefault(require("../../../components/ui/ActionModal"));
const ToggleButton_1 = __importDefault(require("../../../components/ui/button/ToggleButton"));
const Spinner_1 = __importDefault(require("../../../components/ui/Spinner"));
const api_1 = require("../../../utils/api");
const store_1 = require("../../../store");
function EnableDisableSync({ flow, endpoints, provider, providerConfigKey, reload, rawName, connections, setIsEnabling, showSpinner }) {
    var _a, _b;
    const env = (0, store_1.useStore)((state) => state.env);
    const createFlow = (0, api_1.useCreateFlow)(env);
    const syncs = (_a = endpoints === null || endpoints === void 0 ? void 0 : endpoints.allFlows) === null || _a === void 0 ? void 0 : _a.syncs;
    const actions = (_b = endpoints === null || endpoints === void 0 ? void 0 : endpoints.allFlows) === null || _b === void 0 ? void 0 : _b.actions;
    const currentFlow = flow.type === 'sync' ? syncs === null || syncs === void 0 ? void 0 : syncs.find((sync) => sync.name === flow.name) : actions === null || actions === void 0 ? void 0 : actions.find((action) => action.name === flow.name);
    const { setVisible, bindings } = (0, core_1.useModal)();
    const connectionIds = connections.map((connection) => connection.connection_id);
    const [modalTitle, setModalTitle] = (0, react_1.useState)('');
    const [modalContent, setModalContent] = (0, react_1.useState)('');
    const [modalOkButtonTitle, setModalOkButtonTitle] = (0, react_1.useState)('Confirm');
    const [modalCancelButtonTitle, setModalCancelButtonTitle] = (0, react_1.useState)('Cancel');
    const [modalOkButtonLink, setModalOkButtonLink] = (0, react_1.useState)(null);
    const [modalCancelButtonLink, setModalCancelButtonLink] = (0, react_1.useState)(null);
    const [modalAction, setModalAction] = (0, react_1.useState)(null);
    const [modalShowSpinner, setModalShowSpinner] = (0, react_1.useState)(false);
    const [modalTitleColor, setModalTitleColor] = (0, react_1.useState)('text-white');
    const [enabled, setEnabled] = (0, react_1.useState)(currentFlow ? currentFlow.enabled : flow === null || flow === void 0 ? void 0 : flow.enabled);
    const resetModal = () => {
        setModalTitle('');
        setModalContent('');
        setModalOkButtonTitle('Confirm');
        setModalCancelButtonTitle('Cancel');
        setModalOkButtonLink(null);
        setModalCancelButtonLink(null);
        setModalAction(null);
        setModalShowSpinner(false);
        setModalTitleColor('text-white');
    };
    const enableSync = (flow) => {
        resetModal();
        setModalTitle(`Enable ${flow.type}?`);
        setModalTitleColor('text-white');
        const content = (flow === null || flow === void 0 ? void 0 : flow.type) === 'sync'
            ? 'Records will start syncing potentially for multiple connections. This will impact your billing.'
            : 'This will make the action available for immediate use.';
        setModalContent(content);
        setModalAction(() => () => onEnableSync(flow));
        setVisible(true);
    };
    const createNewFlow = (flow) => __awaiter(this, void 0, void 0, function* () {
        setModalShowSpinner(true);
        if (setIsEnabling) {
            setIsEnabling(true);
        }
        const res = yield createFlow([flow]);
        return finalizeEnableSync(res, flow.model_schema);
    });
    const reEnableFlow = (flow) => __awaiter(this, void 0, void 0, function* () {
        setModalShowSpinner(true);
        if (setIsEnabling) {
            setIsEnabling(true);
        }
        const res = yield (0, api_1.apiFetch)(`/api/v1/flow/${flow === null || flow === void 0 ? void 0 : flow.id}/enable?env=${env}`, {
            method: 'PATCH',
            body: JSON.stringify(flow)
        });
        return finalizeEnableSync(res, flow.model_schema);
    });
    const finalizeEnableSync = (res, _model_schema) => __awaiter(this, void 0, void 0, function* () {
        if (!res) {
            setModalShowSpinner(false);
            if (setIsEnabling) {
                setIsEnabling(false);
            }
            setVisible(false);
            react_toastify_1.toast.error('Something went wrong. Please try again.', {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
            return false;
        }
        if ((res === null || res === void 0 ? void 0 : res.status) >= 200 && (res === null || res === void 0 ? void 0 : res.status) < 300) {
            reload();
        }
        else {
            const payload = yield (res === null || res === void 0 ? void 0 : res.json());
            if (payload.type === 'resource_capped') {
                setModalShowSpinner(false);
                setModalTitleColor('text-white');
                setModalTitle('You’ve reached your connections limit!');
                setModalContent(`Scripts are a paid feature. You can only use them with 3 connections or less.
                    Upgrade or delete some connections to activate this script.`);
                setModalOkButtonTitle('Upgrade');
                setModalCancelButtonTitle('Learn more');
                setModalOkButtonLink('https://nango.dev/chat');
                setModalCancelButtonLink('https://docs.nango.dev/reference/limits');
                setVisible(true);
                if (setIsEnabling) {
                    setIsEnabling(false);
                }
                return false;
            }
            else {
                react_toastify_1.toast.error(payload.error, {
                    position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
                });
            }
        }
        setModalShowSpinner(false);
        if (setIsEnabling) {
            setIsEnabling(false);
        }
        setVisible(false);
        return true;
    });
    const onEnableSync = (flow) => __awaiter(this, void 0, void 0, function* () {
        const flowPayload = {
            provider,
            providerConfigKey,
            type: flow.type,
            name: flow.name,
            runs: flow.runs,
            auto_start: flow.auto_start === true,
            track_deletes: flow.track_deletes,
            sync_type: flow.sync_type,
            models: flow.models.map((model) => model.name),
            scopes: flow.scopes,
            input: flow.input,
            returns: flow.returns,
            metadata: {
                description: flow.description,
                scopes: flow.scopes
            },
            endpoints: flow.endpoints,
            output: flow.output,
            pre_built: flow.pre_built,
            is_public: flow.is_public,
            model_schema: JSON.stringify(flow.models),
            public_route: rawName || provider
        };
        let success = false;
        if (flow.id) {
            success = yield reEnableFlow(Object.assign(Object.assign({}, flowPayload), { id: flow.id }));
        }
        else {
            success = yield createNewFlow(flowPayload);
        }
        if (success && (flow === null || flow === void 0 ? void 0 : flow.type) === 'sync') {
            setEnabled(true);
        }
        return success;
    });
    const disableSync = (flow) => {
        resetModal();
        setModalTitle(`Disable ${(flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' ? 'sync? (destructive action)' : 'action?'}`);
        setModalTitleColor('text-pink-600');
        const content = (flow === null || flow === void 0 ? void 0 : flow.type) === 'sync'
            ? 'Disabling this sync will result in the deletion of all related synced records potentially for multiple connections. The endpoints to fetch these records will no longer work.'
            : 'This will make the action unavailable for immediate use.';
        setModalContent(content);
        setModalAction(() => () => onDisableSync(flow));
        setVisible(true);
    };
    const onDisableSync = (flow) => __awaiter(this, void 0, void 0, function* () {
        setModalShowSpinner(true);
        const res = yield (0, api_1.apiFetch)(`/api/v1/flow/${flow === null || flow === void 0 ? void 0 : flow.id}/disable?env=${env}&sync_name=${flow.name}&connectionIds=${connectionIds.join(',')}`, {
            method: 'PATCH',
            body: JSON.stringify(flow)
        });
        if (res.status === 200) {
            reload();
        }
        else {
            react_toastify_1.toast.error('Something went wrong', {
                position: react_toastify_1.toast.POSITION.BOTTOM_CENTER
            });
        }
        setModalShowSpinner(false);
        setVisible(false);
    });
    const toggleSync = (flow) => __awaiter(this, void 0, void 0, function* () {
        if (enabled) {
            (flow === null || flow === void 0 ? void 0 : flow.type) === 'sync' ? disableSync(flow) : yield onDisableSync(flow);
            setEnabled(false);
        }
        else {
            if ((flow === null || flow === void 0 ? void 0 : flow.type) === 'sync') {
                enableSync(flow);
            }
            else {
                const success = yield onEnableSync(flow);
                if (success) {
                    setEnabled(true);
                }
            }
        }
    });
    return (<>
            <ActionModal_1.default bindings={bindings} modalTitle={modalTitle} modalContent={modalContent} modalAction={modalAction} modalShowSpinner={modalShowSpinner} modalTitleColor={modalTitleColor} setVisible={setVisible} modalOkTitle={modalOkButtonTitle} modalCancelTitle={modalCancelButtonTitle} modalOkLink={modalOkButtonLink} modalCancelLink={modalCancelButtonLink}/>
            {showSpinner && (!('version' in flow) || flow.version === null) && modalShowSpinner && (<span className="mr-2">
                    <Spinner_1.default size={1}/>
                </span>)}
            <ToggleButton_1.default enabled={enabled} onChange={() => toggleSync(flow)}/>
        </>);
}
exports.default = EnableDisableSync;
//# sourceMappingURL=EnableDisableSync.js.map