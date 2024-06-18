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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tab = exports.Bloc = void 0;
const Logo_1 = require("../../components/Logo");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const utils_1 = require("../../utils/utils");
const Bloc = ({ active, done, title, subtitle, noTrack, children }) => {
    return (<div className="ml-14">
            <div className={(0, utils_1.cn)('p-5 rounded-lg relative border border-zinc-800', !active && !done && 'border-zinc-900', done && 'border-black bg-gradient-to-r from-emerald-300/20 from-20% to-black to-50%')}>
                {!noTrack && (<div className={(0, utils_1.cn)('absolute left-[-2.6rem] top-[50px] border-l border-zinc-500 h-[calc(100%+6px)]', done && 'border-emerald-300')}></div>)}
                <div className="absolute left-[-3.3rem] top-6 w-6 h-6 rounded-full ring-black bg-[#0e1014] flex items-center justify-center">
                    <div className={(0, utils_1.cn)('rounded-full py-1.5 px-1.5 ', done ? 'bg-emerald-300 ' : active ? 'bg-white' : 'bg-zinc-900')}>
                        <Logo_1.Logo fill={done || active ? 'black' : '#71717A'} size={18}/>
                    </div>
                </div>
                <h2 className={(0, utils_1.cn)('text-xl font-semibold leading-6 text-zinc-500 mb-1', (active || done) && 'text-white')}>{title}</h2>
                <h3 className="text-zinc-400 text-sm">{subtitle}</h3>

                {(active || done) && <div className="mt-6">{children}</div>}
            </div>
        </div>);
};
exports.Bloc = Bloc;
const Tab = (_a) => {
    var { children, className } = _a, props = __rest(_a, ["children", "className"]);
    return (<Button_1.default type="button" variant="black" size="sm" className={(0, utils_1.cn)('cursor-default bg-zinc-800 pointer-events-none text-zinc-200 px-1.5 !py-0.5 !h-6', className)} {...props}>
            {children}
        </Button_1.default>);
};
exports.Tab = Tab;
//# sourceMappingURL=Bloc.js.map