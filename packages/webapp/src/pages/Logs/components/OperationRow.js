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
exports.OperationRow = void 0;
const react_table_1 = require("@tanstack/react-table");
const Table = __importStar(require("../../../components/ui/Table"));
const OperationRow = ({ row, onSelectOperation }) => {
    return (<Table.Row data-state={row.getIsSelected() && 'selected'} className="hover:cursor-pointer" onClick={() => {
            onSelectOperation(true, row.original.id);
        }}>
            {row.getVisibleCells().map((cell) => (<Table.Cell key={cell.id}>{(0, react_table_1.flexRender)(cell.column.columnDef.cell, cell.getContext())}</Table.Cell>))}
        </Table.Row>);
};
exports.OperationRow = OperationRow;
//# sourceMappingURL=OperationRow.js.map