"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Caption = exports.Cell = exports.Row = exports.Head = exports.Footer = exports.Body = exports.Header = exports.Table = void 0;
const react_1 = require("react");
const utils_1 = require("../../utils/utils");
const Table = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<table ref={ref} className={(0, utils_1.cn)('w-full caption-bottom text-sm border-separate border-spacing-0', className)} {...props}/>);
});
exports.Table = Table;
Table.displayName = 'Table';
const Header = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<thead ref={ref} className={(0, utils_1.cn)('text-white', className)} {...props}/>);
});
exports.Header = Header;
Header.displayName = 'Header';
const Body = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<tbody ref={ref} className={(0, utils_1.cn)('text-gray-400 [&_tr:last-child]:border-0', className)} {...props}/>);
});
exports.Body = Body;
Body.displayName = 'Body';
const Footer = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<tfoot ref={ref} className={(0, utils_1.cn)('bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...props}/>);
});
exports.Footer = Footer;
Footer.displayName = 'Footer';
const Row = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<tr ref={ref} className={(0, utils_1.cn)('text-sm transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted border-transparent border-b border-b-active-gray hover:bg-row-hover hover:text-white', className)} {...props}/>);
});
exports.Row = Row;
Row.displayName = 'Row';
const Head = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<th ref={ref} className={(0, utils_1.cn)('bg-active-gray first-of-type:rounded-l last-of-type:rounded-r px-3 py-1 pt-1.5 text-xs leading-5 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0', className)} {...props}/>);
});
exports.Head = Head;
Head.displayName = 'Head';
const Cell = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<td ref={ref} className={(0, utils_1.cn)('px-3 py-2.5 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props}/>);
});
exports.Cell = Cell;
Cell.displayName = 'Cell';
const Caption = (0, react_1.forwardRef)((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<caption ref={ref} className={(0, utils_1.cn)('mt-4 text-sm text-muted-foreground', className)} {...props}/>);
});
exports.Caption = Caption;
Caption.displayName = 'Caption';
//# sourceMappingURL=Table.js.map