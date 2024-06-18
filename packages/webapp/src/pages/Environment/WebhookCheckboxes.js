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
const react_toastify_1 = require("react-toastify");
const icons_1 = require("@geist-ui/icons");
const core_1 = require("@geist-ui/core");
const api_1 = require("../../utils/api");
const checkboxesConfig = [
    {
        label: 'Send Webhooks For Empty Sync Responses',
        tooltip: 'If checked, a webhook will be sent on every sync run completion, even if no data has changed.',
        stateKey: 'alwaysSendWebhook'
    },
    {
        label: 'Send New Connection Creation Webhooks',
        tooltip: 'If checked, a webhook will be sent on connection creation success or failure.',
        stateKey: 'sendAuthWebhook'
    },
    {
        label: 'Send Auth Refresh Error Webhooks',
        tooltip: 'If checked, a webhook will be sent on connection refresh failure.',
        stateKey: 'sendRefreshFailedWebhook'
    },
    {
        label: 'Send Sync Error Webhooks',
        tooltip: 'If checked, a webhook will be sent on sync failure.',
        stateKey: 'sendSyncFailedWebhook'
    }
];
const CheckboxForm = ({ env, checkboxState, setCheckboxState, mutate }) => {
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const handleCheckboxChange = (event) => __awaiter(void 0, void 0, void 0, function* () {
        const { name, checked } = event.target;
        const updatedState = Object.assign(Object.assign({}, checkboxState), { [name]: checked });
        setCheckboxState(updatedState);
        const data = Object.fromEntries(Object.entries(updatedState).map(([key, value]) => [key, Boolean(value)]));
        yield handleSubmit(data);
    });
    const handleSubmit = (data) => __awaiter(void 0, void 0, void 0, function* () {
        setIsLoading(true);
        const res = yield (0, api_1.apiFetch)(`/api/v1/environment/webhook/settings?env=${env}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        if (res.status !== 200) {
            react_toastify_1.toast.error('There was an issue updating the webhook settings', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else {
            react_toastify_1.toast.success('Webhook settings updated successfully!', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
            mutate();
        }
        setIsLoading(false);
    });
    return (<form onSubmit={(e) => e.preventDefault()}>
            {checkboxesConfig.map(({ label, tooltip, stateKey }) => (<div key={stateKey} className="mx-8 mt-8">
                    <div className="flex items-center mb-2">
                        <label htmlFor={stateKey} className={`${isLoading ? 'text-gray-700' : 'text-text-light-gray'} text-sm font-semibold`}>
                            {label}
                        </label>
                        <core_1.Tooltip text={<>
                                    <div className="flex text-black text-sm">{tooltip}</div>
                                </>}>
                            <icons_1.HelpCircle color="gray" className="h-5 ml-1"></icons_1.HelpCircle>
                        </core_1.Tooltip>
                        <input type="checkbox" name={stateKey} disabled={isLoading} className={`flex ml-3 bg-black ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`} checked={checkboxState[stateKey]} onChange={handleCheckboxChange}/>
                    </div>
                </div>))}
        </form>);
};
exports.default = CheckboxForm;
//# sourceMappingURL=WebhookCheckboxes.js.map