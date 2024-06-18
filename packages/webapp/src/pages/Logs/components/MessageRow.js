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
exports.MessageRow = void 0;
const react_table_1 = require("@tanstack/react-table");
const react_icons_1 = require("@radix-ui/react-icons");
const Drawer_1 = require("../../../components/ui/Drawer");
const Table = __importStar(require("../../../components/ui/Table"));
const ShowMessage_1 = require("../ShowMessage");
const utils_1 = require("../../../utils/utils");
const drawerWidth = '834px';
const MessageRow = ({ row }) => {
    return (<Drawer_1.Drawer direction="right" snapPoints={[drawerWidth]} handleOnly={true} noBodyStyles={true} nested>
            <Drawer_1.DrawerTrigger asChild type={null}>
                <Table.Row data-state={row.getIsSelected() && 'selected'} className={(0, utils_1.cn)('hover:cursor-pointer border-b-border-gray-400 !border-l-2 table table-fixed w-full', row.original.level === 'error' && 'hover:border-l-red-500', row.original.level === 'warn' && 'hover:border-l-yellow-400', row.original.level === 'info' && 'hover:border-l-blue-400', row.original.level === 'debug' && 'hover:border-l-gray-400')}>
                    {row.getVisibleCells().map((cell) => (<Table.Cell key={cell.id} style={{ width: cell.column.columnDef.size }}>
                            {(0, react_table_1.flexRender)(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>))}
                </Table.Row>
            </Drawer_1.DrawerTrigger>
            <Drawer_1.DrawerContent>
                <div className={`w-[834px] relative h-screen select-text`}>
                    <div className="absolute top-[26px] left-4">
                        <Drawer_1.DrawerClose title="Close" className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white">
                            <react_icons_1.ArrowLeftIcon />
                        </Drawer_1.DrawerClose>
                    </div>
                    <ShowMessage_1.ShowMessage message={row.original}/>
                </div>
            </Drawer_1.DrawerContent>
        </Drawer_1.Drawer>);
};
exports.MessageRow = MessageRow;
//# sourceMappingURL=MessageRow.js.map