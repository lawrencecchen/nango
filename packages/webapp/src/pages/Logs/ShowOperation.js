"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowOperation = void 0;
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const react_icons_1 = require("@radix-ui/react-icons");
const prism_1 = require("@mantine/prism");
const react_use_1 = require("react-use");
const Info_1 = __importDefault(require("../../components/ui/Info"));
const useLogs_1 = require("../../hooks/useLogs");
const store_1 = require("../../store");
const OperationTag_1 = require("./components/OperationTag");
const StatusTag_1 = require("./components/StatusTag");
const utils_1 = require("../../utils/utils");
const SearchInOperation_1 = require("./components/SearchInOperation");
const Skeleton_1 = require("../../components/ui/Skeleton");
const ProviderTag_1 = require("./components/ProviderTag");
const CopyButton_1 = __importDefault(require("../../components/ui/button/CopyButton"));
const ShowOperation = ({ operationId }) => {
    const env = (0, store_1.useStore)((state) => state.env);
    const { operation, loading, error, trigger } = (0, useLogs_1.useGetOperation)(env, { operationId });
    const duration = (0, react_1.useMemo)(() => {
        if (!operation) {
            return '';
        }
        if (!operation.endedAt || !operation.startedAt) {
            return 'n/a';
        }
        return (0, utils_1.elapsedTime)(new Date(operation.startedAt), new Date(operation.endedAt));
    }, [operation]);
    const createdAt = (0, react_1.useMemo)(() => {
        return (operation === null || operation === void 0 ? void 0 : operation.createdAt) ? (0, utils_1.formatDateToLogFormat)(operation === null || operation === void 0 ? void 0 : operation.createdAt) : 'n/a';
    }, [operation === null || operation === void 0 ? void 0 : operation.createdAt]);
    const isLive = (0, react_1.useMemo)(() => {
        return !operation || operation.state === 'waiting' || operation.state === 'running';
    }, [operation]);
    (0, react_use_1.useInterval)(() => {
        // Auto refresh
        trigger();
    }, isLive ? 5000 : null);
    if (loading) {
        return (<div className="py-6 px-6 flex flex-col gap-9">
                <h3 className="text-xl font-semibold text-white flex gap-4 items-center">Operation Details</h3>
                <Skeleton_1.Skeleton className="w-[250px]"/>
                <Skeleton_1.Skeleton className="w-[250px]"/>
                <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Payload</h4>
                    <Skeleton_1.Skeleton className="w-[250px]"/>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Logs</h4>
                    <Skeleton_1.Skeleton className="w-[250px]"/>
                </div>
            </div>);
    }
    if (error || !operation) {
        return (<div className="py-6 px-6 flex flex-col gap-9">
                <Info_1.default color="red" classNames="text-xs" size={20} padding="p-2">
                    An error occurred
                </Info_1.default>
            </div>);
    }
    return (<div className="py-8 px-6 flex flex-col gap-5 h-screen">
            <header className="flex gap-2 flex-col border-b border-b-gray-400 pb-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white ">Operation Details</h3>
                    <div className="mr-8">
                        <CopyButton_1.default text={window.location.href} icontype="link" dark/>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex">
                        <StatusTag_1.StatusTag state={operation.state}/>
                    </div>
                    <div className="flex bg-border-gray-400 w-[1px] h-[16px]">&nbsp;</div>
                    <div className="flex gap-2 items-center">
                        <react_icons_1.ClockIcon />
                        <div className="text-gray-400 text-s pt-[1px] font-code">{duration}</div>
                    </div>
                    <div className="flex bg-border-gray-400 w-[1px] h-[16px]">&nbsp;</div>
                    <div className="flex gap-2 items-center">
                        <react_icons_1.CalendarIcon />
                        <div className="text-gray-400 text-s pt-[1px] font-code">{createdAt}</div>
                    </div>
                </div>
            </header>

            <div className="flex gap-5 flex-wrap">
                <div className="flex gap-2 items-center w-[30%]">
                    <div className="font-semibold text-sm">Type</div>
                    <div className="text-gray-400 text-xs pt-[1px]">
                        <OperationTag_1.OperationTag message={operation.message} operation={operation.operation} highlight/>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
                <div className="flex gap-2 items-center max-w-[30%]">
                    <div className="font-semibold text-sm">Integration</div>
                    <div className="text-gray-400 text-s font-code truncate">
                        {operation.integrationName ? (<react_router_dom_1.Link to={`/${env}/integration/${operation.integrationName}`} target="_blank" className="flex gap-2.5 items-center hover:text-white">
                                <ProviderTag_1.ProviderTag msg={operation}/>
                                <div className="w-4">
                                    <react_icons_1.ExternalLinkIcon className="w-[14px]"/>
                                </div>
                            </react_router_dom_1.Link>) : ('n/a')}
                    </div>
                </div>
                <div className="flex bg-border-gray-400 w-[1px] h-[16px]">&nbsp;</div>
                <div className="flex gap-2 items-center max-w-[30%]">
                    <div className="font-semibold text-sm">Connection</div>
                    <div className="text-gray-400 text-s font-code truncate">
                        {operation.connectionName ? (<react_router_dom_1.Link to={`/${env}/connections/${operation.integrationName}/${operation.connectionName}`} target="_blank" className="flex gap-2.5 items-center hover:text-white">
                                <div className="truncate">{operation.connectionName}</div>
                                <div className="w-4">
                                    <react_icons_1.ExternalLinkIcon className="w-[14px]"/>
                                </div>
                            </react_router_dom_1.Link>) : ('n/a')}
                    </div>
                </div>
                <div className="flex bg-border-gray-400 w-[1px] h-[16px]">&nbsp;</div>
                <div className="flex gap-2 items-center max-w-[30%]">
                    <div className="font-semibold text-sm">Script</div>
                    <div className="text-gray-400 text-s pt-[1px] truncate">{operation.syncConfigName ? operation.syncConfigName : 'n/a'}</div>
                </div>
            </div>
            <div className="">
                <h4 className="font-semibold text-sm mb-2">Payload</h4>
                {operation.meta ? (<div className="text-gray-400 text-sm bg-pure-black py-2 max-h-36 overflow-y-scroll">
                        <prism_1.Prism language="json" className="transparent-code" colorScheme="dark" styles={() => {
                return { code: { padding: '0', whiteSpace: 'pre-wrap' } };
            }}>
                            {JSON.stringify(operation.meta, null, 2)}
                        </prism_1.Prism>
                    </div>) : (<div className="text-gray-400 text-xs bg-pure-black py-4 px-4">No payload.</div>)}
            </div>
            <SearchInOperation_1.SearchInOperation operationId={operationId} isLive={isLive}/>
        </div>);
};
exports.ShowOperation = ShowOperation;
//# sourceMappingURL=ShowOperation.js.map