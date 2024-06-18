"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationTag = void 0;
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("../../../utils/utils");
const Tag_1 = require("../../../components/ui/label/Tag");
const Tooltip = __importStar(require("../../../components/ui/Tooltip"));
const OperationTag = ({ message, operation, highlight }) => {
    return (<Tooltip.Tooltip delayDuration={0}>
            <Tooltip.TooltipTrigger>
                <div className="flex items-center gap-1">
                    <Tag_1.Tag bgClassName={(0, utils_1.cn)('bg-zinc-900', highlight && 'bg-pure-black')} textClassName={(0, utils_1.cn)(highlight && 'text-white')}>
                        {operation.type}
                    </Tag_1.Tag>
                    {operation.type === 'sync' && (<Tag_1.Tag bgClassName={(0, utils_1.cn)('bg-zinc-900 rounded-full py-0.5', highlight && 'bg-pure-black')} textClassName={(0, utils_1.cn)(highlight && 'text-white')}>
                            {operation.action === 'cancel' && <react_icons_1.CrossCircledIcon className="w-3.5"/>}
                            {operation.action === 'init' && <react_icons_1.UploadIcon className="w-3.5"/>}
                            {operation.action === 'pause' && <react_icons_1.PauseIcon className="w-3.5"/>}
                            {operation.action === 'request_run' && <react_icons_1.Crosshair1Icon className="w-3.5"/>}
                            {operation.action === 'request_run_full' && <react_icons_1.Crosshair1Icon className="w-3.5"/>}
                            {operation.action === 'unpause' && <react_icons_1.ResumeIcon className="w-3.5"/>}
                            {operation.action === 'run' && <react_icons_1.PlayIcon className="w-3.5"/>}
                        </Tag_1.Tag>)}

                    {operation.type === 'auth' && (<Tag_1.Tag bgClassName={(0, utils_1.cn)('bg-zinc-900 rounded-full py-0.5', highlight && 'bg-pure-black')} textClassName={(0, utils_1.cn)(highlight && 'text-white')}>
                            {operation.action === 'create_connection' && <react_icons_1.PersonIcon className="w-3.5"/>}
                            {operation.action === 'post_connection' && <react_icons_1.MixerHorizontalIcon className="w-3.5"/>}
                            {operation.action === 'refresh_token' && <react_icons_1.ReloadIcon className="w-3.5"/>}
                        </Tag_1.Tag>)}
                </div>
            </Tooltip.TooltipTrigger>
            <Tooltip.TooltipContent align="start">
                <p>
                    {message}{' '}
                    <code className="text-xs">
                        ({operation.type}
                        {'action' in operation && <>:{operation.action}</>})
                    </code>
                </p>
            </Tooltip.TooltipContent>
        </Tooltip.Tooltip>);
};
exports.OperationTag = OperationTag;
//# sourceMappingURL=OperationTag.js.map