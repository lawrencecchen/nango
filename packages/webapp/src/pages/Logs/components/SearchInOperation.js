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
exports.SearchInOperation = exports.columns = void 0;
const react_table_1 = require("@tanstack/react-table");
const react_icons_1 = require("@radix-ui/react-icons");
const react_1 = require("react");
const react_use_1 = require("react-use");
const Input_1 = require("../../../components/ui/input/Input");
const useLogs_1 = require("../../../hooks/useLogs");
const utils_1 = require("../../../utils/utils");
const store_1 = require("../../../store");
const Table = __importStar(require("../../../components/ui/Table"));
const Spinner_1 = __importDefault(require("../../../components/ui/Spinner"));
const Info_1 = __importDefault(require("../../../components/ui/Info"));
const LevelTag_1 = require("./LevelTag");
const MessageRow_1 = require("./MessageRow");
const Tag_1 = require("../../../components/ui/label/Tag");
const Skeleton_1 = require("../../../components/ui/Skeleton");
const Button_1 = __importDefault(require("../../../components/ui/button/Button"));
exports.columns = [
    {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        size: 180,
        cell: ({ row }) => {
            return <div className="font-code text-s">{(0, utils_1.formatDateToLogFormat)(row.original.createdAt)}</div>;
        }
    },
    {
        accessorKey: 'type',
        header: 'Type',
        size: 80,
        cell: ({ row }) => {
            return <Tag_1.Tag>{row.original.type === 'log' ? 'Message' : 'HTTP'}</Tag_1.Tag>;
        }
    },
    {
        accessorKey: 'level',
        header: 'Level',
        size: 70,
        cell: ({ row }) => {
            return <LevelTag_1.LevelTag level={row.original.level}/>;
        }
    },
    {
        accessorKey: 'message',
        header: 'Additional Info',
        size: 'auto',
        cell: ({ row }) => {
            return <div className="truncate">{row.original.message}</div>;
        }
    },
    {
        accessorKey: 'id',
        header: '',
        size: 40,
        cell: () => {
            return (<div className="-ml-2">
                    <react_icons_1.ChevronRightIcon />
                </div>);
        }
    }
];
const limit = 50;
const SearchInOperation = ({ operationId, isLive }) => {
    var _a;
    const env = (0, store_1.useStore)((state) => state.env);
    // --- Data fetch
    const [search, setSearch] = (0, react_1.useState)();
    const cursorBefore = (0, react_1.useRef)();
    const cursorAfter = (0, react_1.useRef)();
    const [hasLoadedMore, setHasLoadedMore] = (0, react_1.useState)(false);
    const [readyToDisplay, setReadyToDisplay] = (0, react_1.useState)(false);
    const { data, error, loading, trigger, manualFetch } = (0, useLogs_1.useSearchMessages)(env, { limit, operationId, search });
    const [messages, setMessages] = (0, react_1.useState)([]);
    (0, react_use_1.useDebounce)(() => {
        setMessages([]);
        trigger({});
    }, 250, [search]);
    (0, react_1.useEffect)(() => {
        // Data aggregation to enable infinite scroll
        // Because states are changing we need to deduplicate and update rows
        setMessages((prev) => {
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
        if (data === null || data === void 0 ? void 0 : data.pagination.cursorBefore) {
            cursorBefore.current = data === null || data === void 0 ? void 0 : data.pagination.cursorBefore;
        }
        if (data === null || data === void 0 ? void 0 : data.data) {
            setReadyToDisplay(true);
        }
    }, [data === null || data === void 0 ? void 0 : data.data]);
    (0, react_1.useEffect)(() => {
        if ((data === null || data === void 0 ? void 0 : data.pagination.cursorAfter) && !hasLoadedMore) {
            // We set the cursor only on first page (if we haven't hit a next page)
            // Otherwise the live refresh will erase
            cursorAfter.current = data.pagination.cursorAfter;
        }
    }, [hasLoadedMore, data]);
    (0, react_use_1.useDebounce)(() => {
        // We clear the cursor because it's a brand new search
        cursorAfter.current = null;
        // Debounce the trigger to avoid spamming the backend and avoid conflict with rapid filter change
        trigger({});
    }, 200, []);
    // --- Table Display
    const table = (0, react_table_1.useReactTable)({
        data: messages,
        columns: exports.columns,
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
        trigger({ cursorBefore: cursorBefore.current });
    }, isLive && !loading ? 5000 : null);
    // --- Infinite scroll
    // We use the cursor manually because we want to keep refreshing the head even we add stuff to the tail
    const bottomScrollRef = (0, react_1.useRef)(null);
    const bottomScroll = (0, react_use_1.useIntersection)(bottomScrollRef, {
        root: null,
        rootMargin: '0px',
        threshold: 1
    });
    const appendItems = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!cursorAfter.current) {
            return;
        }
        const rows = yield manualFetch({ cursorAfter: cursorAfter.current });
        if (!rows || 'error' in rows) {
            return;
        }
        cursorAfter.current = rows.res.pagination.cursorAfter;
        setHasLoadedMore(true);
        setMessages((prev) => [...prev, ...rows.res.data]);
    });
    (0, react_1.useEffect)(() => {
        // when the load more button is fully in view
        if (!bottomScroll || !bottomScroll.isIntersecting) {
            return;
        }
        if (cursorAfter.current && !loading) {
            void appendItems();
        }
    }, [bottomScroll, loading, bottomScrollRef]);
    const loadMore = () => {
        if (!loading) {
            void appendItems();
        }
    };
    if (!readyToDisplay) {
        return (<div>
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm flex items-center gap-2">Logs</h4>
                </div>
                <Skeleton_1.Skeleton className="mt-2 w-[250px]"/>
            </div>);
    }
    return (<div className="flex-grow-0 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm flex items-center gap-2">Logs {loading && <Spinner_1.default size={1}/>}</h4>
                <div className="text-white text-xs">
                    {totalHumanReadable} {(data === null || data === void 0 ? void 0 : data.pagination) && data.pagination.total > 1 ? 'logs' : 'log'} found
                </div>
            </div>
            <header className="mt-4">
                <Input_1.Input before={<react_icons_1.MagnifyingGlassIcon className="w-4"/>} placeholder="Search logs..." className="border-border-gray-400" onChange={(e) => setSearch(e.target.value)}/>
            </header>
            <main className="flex flex-col overflow-hidden">
                {error && (<Info_1.default color="red" classNames="text-xs" padding="p-2" size={20}>
                        An error occurred
                    </Info_1.default>)}
                <Table.Table className="mt-6 table-fixed flex flex-col overflow-hidden">
                    <Table.Header className="w-full table table-fixed">
                        {table.getHeaderGroups().map((headerGroup) => (<Table.Row key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                return (<Table.Head key={header.id} style={{
                        width: header.getSize()
                    }} className="bg-pure-black">
                                            {header.isPlaceholder ? null : (0, react_table_1.flexRender)(header.column.columnDef.header, header.getContext())}
                                        </Table.Head>);
            })}
                            </Table.Row>))}
                    </Table.Header>
                    <Table.Body className="overflow-y-scroll block w-full">
                        {((_a = table.getRowModel().rows) === null || _a === void 0 ? void 0 : _a.length) ? (table.getRowModel().rows.map((row) => <MessageRow_1.MessageRow key={row.original.id} row={row}/>)) : messages.length <= 0 && !loading && readyToDisplay ? (<Table.Row>
                                <Table.Cell colSpan={exports.columns.length} className="h-24 text-center">
                                    No results.
                                </Table.Cell>
                            </Table.Row>) : (<Table.Row>
                                {table.getAllColumns().map((col, i) => {
                return (<Table.Cell key={i}>
                                            <Skeleton_1.Skeleton style={{ width: col.getSize() }}/>
                                        </Table.Cell>);
            })}
                            </Table.Row>)}

                        {data && data.pagination.total > 0 && data.data.length > 0 && data.pagination && cursorAfter.current && readyToDisplay && (<div ref={bottomScrollRef}>
                                <Button_1.default disabled={loading} variant="active" className="w-full justify-center" onClick={() => loadMore()}>
                                    {loading ? (<>
                                            <Spinner_1.default size={1}/> Loading...
                                        </>) : ('Load More')}
                                </Button_1.default>
                            </div>)}
                    </Table.Body>
                </Table.Table>
            </main>
        </div>);
};
exports.SearchInOperation = SearchInOperation;
//# sourceMappingURL=SearchInOperation.js.map