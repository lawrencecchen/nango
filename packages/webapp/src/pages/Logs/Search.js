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
exports.LogsSearch = void 0;
const react_table_1 = require("@tanstack/react-table");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const react_use_1 = require("react-use");
const LeftNavBar_1 = require("../../components/LeftNavBar");
const DashboardLayout_1 = __importDefault(require("../../layout/DashboardLayout"));
const store_1 = require("../../store");
const Info_1 = __importDefault(require("../../components/ui/Info"));
const useLogs_1 = require("../../hooks/useLogs");
const Table = __importStar(require("../../components/ui/Table"));
const MultiSelect_1 = require("../../components/MultiSelect");
const constants_1 = require("./constants");
const Spinner_1 = __importDefault(require("../../components/ui/Spinner"));
// import { Input } from '../../components/ui/input/Input';
// import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
const utils_1 = require("../../utils/utils");
const SearchableMultiSelect_1 = require("./components/SearchableMultiSelect");
const TypesSelect_1 = require("./components/TypesSelect");
const DatePicker_1 = require("./components/DatePicker");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const Skeleton_1 = require("../../components/ui/Skeleton");
const OperationDrawer_1 = require("./components/OperationDrawer");
const OperationRow_1 = require("./components/OperationRow");
const logs_1 = require("../../utils/logs");
const limit = 20;
const LogsSearch = () => {
    var _a;
    const env = (0, store_1.useStore)((state) => state.env);
    const prevEnv = (0, react_use_1.usePreviousDistinct)(env);
    const [searchParams, setSearchParams] = (0, react_router_dom_1.useSearchParams)();
    // --- Global state
    const [synced, setSynced] = (0, react_1.useState)(false);
    const [operationId, setOperationId] = (0, react_1.useState)();
    // --- Data fetch
    const [isLive, setIsLive] = (0, react_1.useState)(true);
    const [states, setStates] = (0, react_1.useState)(constants_1.statusDefaultOptions);
    const [types, setTypes] = (0, react_1.useState)(constants_1.typesDefaultOptions);
    const [integrations, setIntegrations] = (0, react_1.useState)(constants_1.integrationsDefaultOptions);
    const [connections, setConnections] = (0, react_1.useState)(constants_1.integrationsDefaultOptions);
    const [syncs, setSyncs] = (0, react_1.useState)(constants_1.syncsDefaultOptions);
    const [period, setPeriod] = (0, react_1.useState)(() => (0, logs_1.getPresetRange)('last24h'));
    const [periodString, setPeriodString] = (0, react_1.useState)();
    const cursor = (0, react_1.useRef)();
    const [hasLoadedMore, setHasLoadedMore] = (0, react_1.useState)(false);
    const [readyToDisplay, setReadyToDisplay] = (0, react_1.useState)(false);
    const { data, error, loading, trigger, manualFetch } = (0, useLogs_1.useSearchOperations)(env, { limit, states, types, integrations, connections, syncs, period: periodString }, isLive);
    const [operations, setOperations] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(function resetEnv() {
        if (prevEnv && env && prevEnv !== env) {
            setSynced(false);
            setReadyToDisplay(false);
            setOperations([]);
            setStates(constants_1.statusDefaultOptions);
            setTypes(constants_1.typesDefaultOptions);
            setIntegrations(constants_1.integrationsDefaultOptions);
            setConnections(constants_1.integrationsDefaultOptions);
            setSyncs(constants_1.syncsDefaultOptions);
            setPeriod((0, logs_1.getPresetRange)('last24h'));
            setHasLoadedMore(false);
            cursor.current = null;
        }
    }, [env, prevEnv]);
    (0, react_1.useEffect)(() => {
        // Data aggregation to enable infinite scroll
        // Because states are changing we need to deduplicate and update rows
        setOperations((prev) => {
            if (prev.length <= 0 || !(data === null || data === void 0 ? void 0 : data.data)) {
                return (data === null || data === void 0 ? void 0 : data.data) || [];
            }
            const next = data.data;
            for (const item of prev) {
                if (next.find((n) => n.id === item.id)) {
                    continue;
                }
                next.push(item);
            }
            return next;
        });
        setReadyToDisplay(true);
    }, [data === null || data === void 0 ? void 0 : data.data]);
    (0, react_1.useEffect)(() => {
        if ((data === null || data === void 0 ? void 0 : data.pagination.cursor) && !hasLoadedMore) {
            // We set the cursor only on first page (if we haven't hit a next page)
            // Otherwise the live refresh will erase
            cursor.current = data.pagination.cursor;
        }
    }, [hasLoadedMore, data]);
    (0, react_use_1.useDebounce)(() => {
        // We clear the cursor because it's a brand new search
        cursor.current = null;
        // Debounce the trigger to avoid spamming the backend and avoid conflict with rapid filter change
        trigger();
    }, 200, [limit, states, types, integrations, connections, syncs, period, prevEnv]);
    // --- Query Params
    (0, react_1.useEffect)(function syncQueryParamsToState() {
        // Sync the query params to the react state, it allows to share the URL
        // we do it only on load, after that we don't care about the update
        if (synced) {
            return;
        }
        const tmpStates = searchParams.get('states');
        if (tmpStates) {
            setStates(tmpStates.split(','));
        }
        const tmpIntegrations = searchParams.get('integrations');
        if (tmpIntegrations) {
            setIntegrations(tmpIntegrations.split(','));
        }
        const tmpConnections = searchParams.get('connections');
        if (tmpConnections) {
            setConnections(tmpConnections.split(','));
        }
        const tmpSyncs = searchParams.get('syncs');
        if (tmpSyncs) {
            setSyncs(tmpSyncs.split(','));
        }
        const tmpTypes = searchParams.get('types');
        if (tmpTypes) {
            setTypes(tmpTypes.split(','));
        }
        const tmpFrom = searchParams.get('from');
        const tmpTo = searchParams.get('to');
        if (tmpFrom && tmpTo) {
            const tmpLive = searchParams.get('live');
            const isLive = tmpLive === null || tmpLive === 'true';
            setIsLive(isLive);
            setPeriod(isLive ? (0, logs_1.slidePeriod)({ from: new Date(tmpFrom), to: new Date(tmpTo) }) : { from: new Date(tmpFrom), to: new Date(tmpTo) });
        }
        const tmpOperationId = searchParams.get('operationId');
        if (tmpOperationId) {
            setOperationId(tmpOperationId);
        }
        setSynced(true);
    }, [searchParams, synced]);
    (0, react_1.useEffect)(function resetSearchOnFilterChanges() {
        setOperations([]);
        setHasLoadedMore(false);
        setReadyToDisplay(false);
    }, [states, integrations, period, connections, syncs, types]);
    (0, react_1.useEffect)(function syncStateToQueryParams() {
        if (!synced) {
            return;
        }
        // Sync the state back to the URL for sharing
        const tmp = new URLSearchParams();
        if (states.length > 0 && !(0, utils_1.stringArrayEqual)(states, constants_1.statusDefaultOptions)) {
            tmp.set('states', states);
        }
        if (integrations.length > 0 && !(0, utils_1.stringArrayEqual)(integrations, constants_1.integrationsDefaultOptions)) {
            tmp.set('integrations', integrations);
        }
        if (connections.length > 0 && !(0, utils_1.stringArrayEqual)(connections, constants_1.connectionsDefaultOptions)) {
            tmp.set('connections', connections);
        }
        if (syncs.length > 0 && !(0, utils_1.stringArrayEqual)(syncs, constants_1.syncsDefaultOptions)) {
            tmp.set('syncs', syncs);
        }
        if (types.length > 0 && !(0, utils_1.stringArrayEqual)(types, constants_1.typesDefaultOptions)) {
            tmp.set('types', types);
        }
        if (!isLive) {
            tmp.set('live', 'false');
        }
        if (periodString) {
            const matched = (0, logs_1.matchPresetFromRange)({ from: new Date(periodString.from), to: new Date(periodString.to) });
            if ((matched === null || matched === void 0 ? void 0 : matched.name) !== 'last24h') {
                tmp.set('from', periodString.from);
                tmp.set('to', periodString.to);
            }
        }
        if (operationId) {
            tmp.set('operationId', operationId);
        }
        tmp.sort();
        if (tmp.toString() !== searchParams.toString()) {
            setSearchParams(tmp);
        }
    }, [states, integrations, periodString, connections, syncs, types, operationId, isLive, synced]);
    // --- Table Display
    const table = (0, react_table_1.useReactTable)({
        data: operations,
        columns: constants_1.columns,
        getCoreRowModel: (0, react_table_1.getCoreRowModel)()
    });
    const totalHumanReadable = (0, react_1.useMemo)(() => {
        if (!(data === null || data === void 0 ? void 0 : data.pagination)) {
            return 0;
        }
        return (0, utils_1.formatQuantity)(data.pagination.total);
    }, [data === null || data === void 0 ? void 0 : data.pagination]);
    // --- Live // auto refresh
    (0, react_use_1.useInterval)(function onAutoRefresh() {
        trigger();
    }, synced && isLive && !loading ? 7000 : null);
    // --- Infinite scroll
    // We use the cursor manually because we want to keep refreshing the head even we add stuff to the tail
    const bottomScrollRef = (0, react_1.useRef)(null);
    const bottomScroll = (0, react_use_1.useIntersection)(bottomScrollRef, {
        root: null,
        rootMargin: '0px',
        threshold: 1
    });
    const appendItems = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!cursor.current) {
            return;
        }
        const rows = yield manualFetch(cursor.current);
        if (!rows || 'error' in rows) {
            return;
        }
        setHasLoadedMore(true);
        cursor.current = rows.res.pagination.cursor;
        setOperations((prev) => [...prev, ...rows.res.data]);
    });
    (0, react_1.useEffect)(() => {
        // when the load more button is fully in view
        if (!bottomScroll || !bottomScroll.isIntersecting) {
            return;
        }
        if (cursor.current && !loading) {
            void appendItems();
        }
    }, [bottomScroll, loading, bottomScrollRef]);
    const loadMore = () => {
        if (!loading) {
            void appendItems();
        }
    };
    // Operation select
    const onSelectOperation = (open, operationId) => {
        setOperationId(open ? operationId : undefined);
    };
    // Period
    const onPeriodChange = (range, live) => {
        setPeriod(range);
        setIsLive(live);
    };
    (0, react_1.useEffect)(() => {
        setPeriodString({ from: period.from.toISOString(), to: period.to.toISOString() });
    }, [period]);
    if (error) {
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Logs} fullWidth className="p-6">
                <h2 className="text-3xl font-semibold text-white mb-4">Logs</h2>
                {error.error.code === 'feature_disabled' ? (<div className="flex gap-2 flex-col border border-border-gray rounded-md items-center text-white text-center p-10 py-20">
                        <h2 className="text-xl text-center">Logs not configured</h2>
                        <div className="text-sm text-gray-400">
                            Follow{' '}
                            <react_router_dom_1.Link to="https://docs.nango.dev/host/self-host/self-hosting-instructions#logs" className="text-blue-400">
                                these instructions
                            </react_router_dom_1.Link>{' '}
                            to configure logs.
                        </div>
                    </div>) : (<Info_1.default color={'red'} classNames="text-xs" size={20}>
                        An error occurred, refresh your page or reach out to the support.{' '}
                        {error.error.code === 'generic_error_support' && (<>
                                (id: <span className="select-all">{error.error.payload}</span>)
                            </>)}
                    </Info_1.default>)}
            </DashboardLayout_1.default>);
    }
    if (!synced) {
        return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Logs} fullWidth className="p-6">
                <h2 className="text-3xl font-semibold text-white mb-4">Logs</h2>

                <div className="flex gap-2 flex-col">
                    <Skeleton_1.Skeleton style={{ width: '50%' }}/>
                    <Skeleton_1.Skeleton style={{ width: '50%' }}/>
                    <Skeleton_1.Skeleton style={{ width: '50%' }}/>
                </div>
            </DashboardLayout_1.default>);
    }
    return (<DashboardLayout_1.default selectedItem={LeftNavBar_1.LeftNavBarItems.Logs} fullWidth className="p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold text-white mb-4 flex gap-4 items-center">Logs {loading && <Spinner_1.default size={1}/>}</h2>
                <div className="text-white text-xs">
                    {totalHumanReadable} {(data === null || data === void 0 ? void 0 : data.pagination) && data.pagination.total > 1 ? 'logs' : 'log'} found
                </div>
            </div>
            <div className="flex gap-2 justify-between">
                <div className="w-full">{/* <Input before={<MagnifyingGlassIcon className="w-5 h-5" />} placeholder="Search operations..." /> */}</div>
                <div className="flex gap-2">
                    <MultiSelect_1.MultiSelect label="Status" options={constants_1.statusOptions} selected={states} defaultSelect={constants_1.statusDefaultOptions} onChange={setStates} all/>
                    <TypesSelect_1.TypesSelect selected={types} onChange={setTypes}/>
                    <SearchableMultiSelect_1.SearchableMultiSelect label="Integration" selected={integrations} category={'integration'} onChange={setIntegrations}/>
                    <SearchableMultiSelect_1.SearchableMultiSelect label="Connection" selected={connections} category={'connection'} onChange={setConnections}/>
                    <SearchableMultiSelect_1.SearchableMultiSelect label="Script" selected={syncs} category={'syncConfig'} onChange={setSyncs}/>

                    <DatePicker_1.DatePicker isLive={isLive} period={period} onChange={onPeriodChange}/>
                </div>
            </div>
            <Table.Table className="my-4 table-fixed">
                <Table.Header>
                    {table.getHeaderGroups().map((headerGroup) => (<Table.Row key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                return (<Table.Head key={header.id} style={{
                        width: header.getSize() !== 0 ? header.getSize() : undefined
                    }}>
                                        {header.isPlaceholder ? null : (0, react_table_1.flexRender)(header.column.columnDef.header, header.getContext())}
                                    </Table.Head>);
            })}
                        </Table.Row>))}
                </Table.Header>
                <Table.Body>
                    {loading && !readyToDisplay && (<Table.Row>
                            {table.getAllColumns().map((col, i) => {
                return (<Table.Cell key={i}>
                                        <Skeleton_1.Skeleton style={{ width: col.getSize() - 20 }}/>
                                    </Table.Cell>);
            })}
                        </Table.Row>)}

                    {((_a = table.getRowModel().rows) === null || _a === void 0 ? void 0 : _a.length) > 0 &&
            table.getRowModel().rows.map((row) => <OperationRow_1.OperationRow key={row.original.id} row={row} onSelectOperation={onSelectOperation}/>)}

                    {operations.length <= 0 && readyToDisplay && (<Table.Row>
                            <Table.Cell colSpan={constants_1.columns.length} className="h-24 text-center p-0 pt-4">
                                <div className="flex gap-2 flex-col border border-border-gray rounded-md items-center text-white text-center p-10 py-20">
                                    <div className="text-center">No logs found</div>
                                    <div className="text-gray-400">Note that logs older than 15 days are automatically cleared.</div>
                                </div>
                            </Table.Cell>
                        </Table.Row>)}
                </Table.Body>
            </Table.Table>
            {data && data.pagination.total > 0 && data.data.length > 0 && cursor.current && readyToDisplay && (<div ref={bottomScrollRef}>
                    <Button_1.default disabled={loading} variant="active" className="w-full justify-center" onClick={() => loadMore()}>
                        {loading ? (<>
                                <Spinner_1.default size={1}/> Loading...
                            </>) : ('Load More')}
                    </Button_1.default>
                </div>)}

            {operationId && <OperationDrawer_1.OperationDrawer key={operationId} operationId={operationId} onClose={onSelectOperation}/>}
        </DashboardLayout_1.default>);
};
exports.LogsSearch = LogsSearch;
//# sourceMappingURL=Search.js.map