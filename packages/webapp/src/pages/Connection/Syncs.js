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
const icons_1 = require("@geist-ui/icons");
const core_1 = require("@geist-ui/core");
const react_router_dom_1 = require("react-router-dom");
const outline_1 = require("@heroicons/react/24/outline");
const ActionModal_1 = __importDefault(require("../../components/ui/ActionModal"));
const Tag_1 = require("../../components/ui/label/Tag");
const Spinner_1 = __importDefault(require("../../components/ui/Spinner"));
const types_1 = require("../../types");
const utils_1 = require("../../utils/utils");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const api_1 = require("../../utils/api");
const logs_1 = require("../../utils/logs");
function Syncs({ syncs, connection, provider, reload, loaded, syncLoaded, env }) {
    const [sync, setSync] = (0, react_1.useState)(null);
    const [modalShowSpinner, setModalShowSpinner] = (0, react_1.useState)(false);
    const [showPauseStartLoader, setShowPauseStartLoader] = (0, react_1.useState)(false);
    const [showInterruptLoader, setShowInterruptLoader] = (0, react_1.useState)(false);
    const [showTriggerIncrementalLoader, setShowTriggerIncrementalLoader] = (0, react_1.useState)(false);
    const [showTriggerFullLoader, setShowTriggerFullLoader] = (0, react_1.useState)(false);
    const [syncCommandButtonsDisabled, setSyncCommandButtonsDisabled] = (0, react_1.useState)(false);
    const [openDropdownHash, setOpenDropdownHash] = (0, react_1.useState)(null);
    const { setVisible, bindings } = (0, core_1.useModal)();
    const { setVisible: setErrorVisible, bindings: errorBindings } = (0, core_1.useModal)();
    const runCommandSyncAPI = (0, api_1.useRunSyncAPI)(env);
    const toggleDropdown = (hash) => {
        if (openDropdownHash === hash) {
            setOpenDropdownHash(null);
        }
        else {
            setOpenDropdownHash(hash);
        }
    };
    const resetLoaders = () => {
        setShowPauseStartLoader(false);
        setShowInterruptLoader(false);
        setShowTriggerIncrementalLoader(false);
        setShowTriggerFullLoader(false);
    };
    const hashSync = (sync) => {
        return `${sync.id}${JSON.stringify(sync.models)}`;
    };
    (0, react_1.useEffect)(() => {
        const closeSyncWindow = (e) => {
            if (!e.target.closest('.interact-with-sync')) {
                setOpenDropdownHash(null);
            }
        };
        document.addEventListener('click', closeSyncWindow);
        return () => {
            document.removeEventListener('click', closeSyncWindow);
        };
    }, []);
    const syncCommand = (command, nango_connection_id, scheduleId, syncId, syncName) => __awaiter(this, void 0, void 0, function* () {
        if (syncCommandButtonsDisabled) {
            return;
        }
        setSyncCommandButtonsDisabled(true);
        const res = yield runCommandSyncAPI(command, scheduleId, nango_connection_id, syncId, syncName, provider || '');
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            reload();
            const niceCommand = types_1.UserFacingSyncCommand[command];
            react_toastify_1.toast.success(`The sync was successfully ${niceCommand}`, { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else {
            const data = yield (res === null || res === void 0 ? void 0 : res.json());
            react_toastify_1.toast.error(data.error, { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        setSyncCommandButtonsDisabled(false);
        resetLoaders();
    });
    const fullResync = () => __awaiter(this, void 0, void 0, function* () {
        if (!sync || syncCommandButtonsDisabled) {
            return;
        }
        setShowTriggerFullLoader(true);
        setSyncCommandButtonsDisabled(true);
        setModalShowSpinner(true);
        const res = yield runCommandSyncAPI('RUN_FULL', sync.schedule_id, sync.nango_connection_id, sync.id, sync.name, provider || '');
        if ((res === null || res === void 0 ? void 0 : res.status) === 200) {
            reload();
            react_toastify_1.toast.success('The full resync was successfully triggered', { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        else {
            const data = yield (res === null || res === void 0 ? void 0 : res.json());
            react_toastify_1.toast.error(data.error, { position: react_toastify_1.toast.POSITION.BOTTOM_CENTER });
        }
        setModalShowSpinner(false);
        setVisible(false);
        setSyncCommandButtonsDisabled(false);
        setShowTriggerFullLoader(false);
    });
    const RenderBubble = ({ sync, children }) => {
        var _a, _b, _c;
        const hasActivityLogId = ((_a = sync.latest_sync) === null || _a === void 0 ? void 0 : _a.activity_log_id) !== null;
        const linkPath = (0, logs_1.getLogsUrl)({
            env,
            operationId: (_b = sync.latest_sync) === null || _b === void 0 ? void 0 : _b.activity_log_id,
            connections: connection === null || connection === void 0 ? void 0 : connection.connection_id,
            syncs: sync.name,
            day: new Date((_c = sync.latest_sync) === null || _c === void 0 ? void 0 : _c.updated_at)
        });
        return hasActivityLogId ? <react_router_dom_1.Link to={linkPath}>{children}</react_router_dom_1.Link> : <div>{children}</div>;
    };
    if (!loaded || !syncLoaded || syncs === null)
        return <core_1.Loading spaceRatio={2.5} className="top-24"/>;
    return (<div className="h-fit rounded-md text-white">
            <ActionModal_1.default bindings={bindings} modalTitle="Full Refresh?" modalContent="Triggering a full refresh in Nango will clear all existing records and reset the last sync date used for incremental syncs. This means every record will be fetched again from the start of your sync window and treated as new." modalShowSpinner={modalShowSpinner} modalAction={() => fullResync()} modalTitleColor="text-red-500" setVisible={setVisible}/>
            <core_1.Modal {...errorBindings} wrapClassName="!h-[600px] !w-[550px] !max-w-[550px] !bg-[#0E1014] no-border-modal">
                <core_1.Modal.Action placeholder={null} passive className="!flex !justify-end !text-sm !bg-[#0E1014] !border-0 !h-[100px]" onClick={() => setErrorVisible(false)} onPointerEnterCapture={null} onPointerLeaveCapture={null}>
                    <Button_1.default className="!text-text-light-gray" variant="zombieGray">
                        Close
                    </Button_1.default>
                </core_1.Modal.Action>
            </core_1.Modal>
            {!syncs || syncs.length === 0 ? (<div className="flex flex-col border border-border-gray rounded-md items-center text-white text-center p-10 py-20">
                    <h2 className="text-xl text-center w-full">
                        No models are syncing for <span className="capitalize">{provider}</span>
                    </h2>
                    <div className="mt-4 text-gray-400">
                        Start syncing models for <span className="capitalize">{provider}</span> on the Sync Configuration tab.
                    </div>
                    <react_router_dom_1.Link to={`/${env}/integration/${connection === null || connection === void 0 ? void 0 : connection.provider_config_key}#scripts`} className="flex justify-center w-auto items-center mt-5 px-4 h-10 rounded-md text-sm text-black bg-white hover:bg-gray-300">
                        <span className="flex">
                            <outline_1.AdjustmentsHorizontalIcon className="flex h-5 w-5 mr-3"/>
                            Script Configuration
                        </span>
                    </react_router_dom_1.Link>
                </div>) : (<table className="w-[976px]">
                    <tbody className="flex flex-col space-y-2">
                        <tr>
                            <td className="flex items-center px-3 justify-between text-xs px-2 py-2 bg-active-gray border border-neutral-800 rounded-md">
                                <div className="w-24">Name</div>
                                <div className="w-48">Synced Models</div>
                                <div className="w-16">Status</div>
                                <div className="w-8">Frequency</div>
                                <div className="w-24">Last Sync Start</div>
                                <div className="w-24">Next Sync Start</div>
                                <div className="w-16">Last Run</div>
                                <div className=""></div>
                            </td>
                        </tr>
                        <tr>
                            {syncs.map((sync) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                return (<td key={sync.name} className={`flex items-center px-2 py-3 text-[13px] ${syncCommandButtonsDisabled ? '' : 'cursor-pointer'} justify-between border-b border-border-gray`}>
                                    <div className="flex items-center w-28">
                                        <div className="w-36 max-w-3xl ml-1 truncate">{sync.name}</div>
                                    </div>
                                    <div className="flex items-center w-52">
                                        <div className="w-36 max-w-3xl truncate">{Array.isArray(sync.models) ? sync.models.join(', ') : sync.models}</div>
                                    </div>
                                    <div className="flex w-20 -ml-2">
                                        <span className="">
                                            {sync.status === 'PAUSED' && (<RenderBubble sync={sync}>
                                                    <Tag_1.Tag bgClassName="bg-yellow-500 bg-opacity-30" textClassName="text-yellow-500">
                                                        Paused
                                                    </Tag_1.Tag>
                                                </RenderBubble>)}
                                            {((sync === null || sync === void 0 ? void 0 : sync.status) === 'ERROR' || (sync === null || sync === void 0 ? void 0 : sync.status) === 'STOPPED') && (<RenderBubble sync={sync}>
                                                    <Tag_1.Tag bgClassName="bg-red-base bg-opacity-30" textClassName="text-red-base">
                                                        Failed
                                                    </Tag_1.Tag>
                                                </RenderBubble>)}
                                            {(sync === null || sync === void 0 ? void 0 : sync.status) === 'RUNNING' && (<RenderBubble sync={sync}>
                                                    <Tag_1.Tag bgClassName="bg-blue-base bg-opacity-30" textClassName="text-blue-base">
                                                        Syncing
                                                    </Tag_1.Tag>
                                                </RenderBubble>)}
                                            {(sync === null || sync === void 0 ? void 0 : sync.status) === 'SUCCESS' && (<RenderBubble sync={sync}>
                                                    <Tag_1.Tag bgClassName="bg-green-base bg-opacity-30" textClassName="text-green-base">
                                                        Success
                                                    </Tag_1.Tag>
                                                </RenderBubble>)}
                                        </span>
                                    </div>
                                    <div className="flex items-center w-10">{(0, utils_1.formatFrequency)(sync.frequency)}</div>
                                    <div className="flex items-center w-28">
                                        {((_a = sync.latest_sync) === null || _a === void 0 ? void 0 : _a.result) && Object.keys((_b = sync.latest_sync) === null || _b === void 0 ? void 0 : _b.result).length > 0 ? (<core_1.Tooltip text={<pre>{(0, utils_1.parseLatestSyncResult)(sync.latest_sync.result, sync.latest_sync.models)}</pre>} type="dark">
                                                {((_c = sync.latest_sync) === null || _c === void 0 ? void 0 : _c.activity_log_id) !== null ? (<react_router_dom_1.Link to={(0, logs_1.getLogsUrl)({
                                env,
                                operationId: (_d = sync.latest_sync) === null || _d === void 0 ? void 0 : _d.activity_log_id,
                                connections: connection === null || connection === void 0 ? void 0 : connection.connection_id,
                                syncs: sync.name,
                                day: new Date((_e = sync.latest_sync) === null || _e === void 0 ? void 0 : _e.updated_at)
                            })} className="block w-32 ml-1">
                                                        {(0, utils_1.formatDateToUSFormat)((_f = sync.latest_sync) === null || _f === void 0 ? void 0 : _f.updated_at)}
                                                    </react_router_dom_1.Link>) : (<span className="">{(0, utils_1.formatDateToUSFormat)((_g = sync.latest_sync) === null || _g === void 0 ? void 0 : _g.updated_at)}</span>)}
                                            </core_1.Tooltip>) : (<>
                                                {((_h = sync.latest_sync) === null || _h === void 0 ? void 0 : _h.activity_log_id) ? (<react_router_dom_1.Link to={(0, logs_1.getLogsUrl)({
                                env,
                                operationId: (_j = sync.latest_sync) === null || _j === void 0 ? void 0 : _j.activity_log_id,
                                connections: connection === null || connection === void 0 ? void 0 : connection.connection_id,
                                syncs: sync.name,
                                day: new Date((_k = sync.latest_sync) === null || _k === void 0 ? void 0 : _k.updated_at)
                            })} className="">
                                                        {(0, utils_1.formatDateToUSFormat)((_l = sync.latest_sync) === null || _l === void 0 ? void 0 : _l.updated_at)}
                                                    </react_router_dom_1.Link>) : (<span className="">{(0, utils_1.formatDateToUSFormat)((_m = sync.latest_sync) === null || _m === void 0 ? void 0 : _m.updated_at)}</span>)}
                                            </>)}
                                    </div>
                                    <div className="flex items-center w-28">
                                        {sync.schedule_status === 'RUNNING' && (<>
                                                {(0, utils_1.interpretNextRun)(sync.futureActionTimes) === '-' ? (<span className="">-</span>) : (<span className="">{(0, utils_1.interpretNextRun)(sync.futureActionTimes, (_o = sync.latest_sync) === null || _o === void 0 ? void 0 : _o.updated_at)[0]}</span>)}
                                            </>)}
                                        {sync.schedule_status === 'RUNNING' && !sync.futureActionTimes && <span className="">-</span>}
                                        {sync.schedule_status !== 'RUNNING' && <span className="">-</span>}
                                    </div>
                                    <div className="w-12">{(0, utils_1.getRunTime)((_p = sync.latest_sync) === null || _p === void 0 ? void 0 : _p.created_at, (_q = sync.latest_sync) === null || _q === void 0 ? void 0 : _q.updated_at)}</div>
                                    <div className="relative interact-with-sync">
                                        <outline_1.EllipsisHorizontalIcon className="flex h-5 w-5 cursor-pointer" onClick={() => toggleDropdown(hashSync(sync))}/>
                                        {openDropdownHash === hashSync(sync) && (<div className="text-gray-400 absolute z-10 -top-15 right-1 bg-black rounded border border-neutral-700 items-center">
                                                <div className="flex flex-col w-full">
                                                    <div className={`flex items-center w-full whitespace-nowrap ${!syncCommandButtonsDisabled ? 'hover:bg-neutral-800 ' : ''} px-4 py-2`} onClick={() => __awaiter(this, void 0, void 0, function* () {
                            setShowPauseStartLoader(true);
                            yield syncCommand(sync.schedule_status === 'RUNNING' ? 'PAUSE' : 'UNPAUSE', sync.nango_connection_id, sync.schedule_id, sync.id, sync.name);
                        })}>
                                                        {sync.schedule_status !== 'RUNNING' ? (<>
                                                                <outline_1.PlayCircleIcon className={`flex h-6 w-6 ${syncCommandButtonsDisabled ? 'text-gray-800' : 'text-gray-400 cursor-pointer'}`}/>
                                                                <span className={`pl-2 ${syncCommandButtonsDisabled ? 'text-gray-800' : ''} mr-2`}>
                                                                    Start schedule
                                                                </span>
                                                            </>) : (<>
                                                                <outline_1.PauseCircleIcon className={`flex h-6 w-6 ${syncCommandButtonsDisabled ? 'text-gray-800' : 'text-gray-400 cursor-pointer'}`}/>
                                                                <span className={`pl-2 ${syncCommandButtonsDisabled ? 'text-gray-800' : ''} mr-2`}>
                                                                    Pause schedule
                                                                </span>
                                                            </>)}
                                                        {showPauseStartLoader && <Spinner_1.default size={1}/>}
                                                    </div>
                                                    {(sync === null || sync === void 0 ? void 0 : sync.status) === 'RUNNING' && (<div className={`flex items-center w-full whitespace-nowrap ${!syncCommandButtonsDisabled ? 'hover:bg-neutral-800 ' : ''} px-4 py-2`} onClick={() => {
                                setShowInterruptLoader(true);
                                syncCommand('CANCEL', sync.nango_connection_id, sync.schedule_id, sync.id, sync.name);
                            }}>
                                                            <outline_1.StopCircleIcon className={`flex h-6 w-6 ${syncCommandButtonsDisabled ? 'text-gray-800' : 'text-gray-400 cursor-pointer'}`}/>
                                                            <span className={`pl-2 mr-2 ${syncCommandButtonsDisabled ? 'text-gray-800' : ''}`}>
                                                                Interrupt execution
                                                            </span>
                                                            {showInterruptLoader && <Spinner_1.default size={1}/>}
                                                        </div>)}
                                                    {(sync === null || sync === void 0 ? void 0 : sync.status) !== 'RUNNING' && (<>
                                                            <div className={`flex items-center w-full whitespace-nowrap ${!syncCommandButtonsDisabled ? 'hover:bg-neutral-800 ' : ''} px-4 py-2`} onClick={() => {
                                setShowTriggerIncrementalLoader(true);
                                syncCommand('RUN', sync.nango_connection_id, sync.schedule_id, sync.id, sync.name);
                            }}>
                                                                <outline_1.ArrowPathRoundedSquareIcon className={`flex h-6 w-6 ${syncCommandButtonsDisabled ? 'text-gray-800' : 'text-gray-400 cursor-pointer'}`}/>
                                                                <span className={`pl-2 flex items-center ${syncCommandButtonsDisabled ? 'text-gray-800' : ''}`}>
                                                                    Trigger execution (incremental)
                                                                    <core_1.Tooltip type="dark" text={<>
                                                                                <div className="flex text-white text-sm">
                                                                                    <p>
                                                                                        Incremental: the existing cache and the last sync date will be
                                                                                        preserved, only new/updated data will be synced.
                                                                                    </p>
                                                                                </div>
                                                                            </>}>
                                                                        {!syncCommandButtonsDisabled && (<icons_1.HelpCircle color="gray" className="h-4 ml-1"></icons_1.HelpCircle>)}
                                                                    </core_1.Tooltip>
                                                                    {showTriggerIncrementalLoader && <Spinner_1.default size={1}/>}
                                                                </span>
                                                            </div>
                                                            <div className={`flex items-center w-full whitespace-nowrap ${!syncCommandButtonsDisabled ? 'hover:bg-neutral-800 ' : ''} px-4 py-2`} onClick={() => {
                                setSync(sync);
                                setVisible(true);
                            }}>
                                                                <outline_1.ArrowPathRoundedSquareIcon className={`flex h-6 w-6 ${syncCommandButtonsDisabled ? 'text-gray-800' : 'text-gray-400 cursor-pointer'}`}/>
                                                                <span className={`pl-2 flex items-center ${syncCommandButtonsDisabled ? 'text-gray-800' : ''}`}>
                                                                    Trigger execution (full refresh)
                                                                    <core_1.Tooltip type="dark" text={<>
                                                                                <div className="flex text-white text-sm">
                                                                                    <p>
                                                                                        Full refresh: the existing cache and last sync date will be deleted, all
                                                                                        historical data will be resynced.
                                                                                    </p>
                                                                                </div>
                                                                            </>}>
                                                                        {!syncCommandButtonsDisabled && (<icons_1.HelpCircle color="gray" className="h-4 ml-1"></icons_1.HelpCircle>)}
                                                                    </core_1.Tooltip>
                                                                    {showTriggerFullLoader && <Spinner_1.default size={1}/>}
                                                                </span>
                                                            </div>
                                                            <react_router_dom_1.Link to={(0, logs_1.getLogsUrl)({
                                env,
                                operationId: ((_r = sync.latest_sync) === null || _r === void 0 ? void 0 : _r.activity_log_id) || ((_s = sync.active_logs) === null || _s === void 0 ? void 0 : _s.activity_log_id),
                                connections: connection === null || connection === void 0 ? void 0 : connection.connection_id,
                                syncs: sync.name,
                                day: new Date((_t = sync.latest_sync) === null || _t === void 0 ? void 0 : _t.updated_at)
                            })} className={`flex items-center w-full whitespace-nowrap hover:bg-neutral-800 px-4 py-2`}>
                                                                <outline_1.QueueListIcon className={`flex h-6 w-6 text-gray-400 cursor-pointer`}/>
                                                                <span className={`pl-2 flex items-center`}>View Logs</span>
                                                            </react_router_dom_1.Link>
                                                        </>)}
                                                </div>
                                            </div>)}
                                    </div>
                                </td>);
            })}
                        </tr>
                    </tbody>
                </table>)}
        </div>);
}
exports.default = Syncs;
//# sourceMappingURL=Syncs.js.map