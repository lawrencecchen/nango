"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderTag = void 0;
const IntegrationLogo_1 = __importDefault(require("../../../components/ui/IntegrationLogo"));
const ProviderTag = ({ msg }) => {
    if (!msg.integrationId || !msg.providerName) {
        return <>-</>;
    }
    return (<div className="flex gap-1.5 items-center">
            <div className="w-5">
                <IntegrationLogo_1.default provider={msg.providerName} height={4} width={4} color="text-gray-400"/>
            </div>
            <div className="truncate font-code text-s">{msg.integrationName}</div>
        </div>);
};
exports.ProviderTag = ProviderTag;
//# sourceMappingURL=ProviderTag.js.map