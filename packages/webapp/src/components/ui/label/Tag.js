"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const utils_1 = require("../../../utils/utils");
const Tag = ({ children, bgClassName, textClassName }) => {
    return (<div className={(0, utils_1.cn)('inline-flex px-1 pt-[1px] bg-pure-black text-gray-400 rounded', bgClassName)}>
            <div className={(0, utils_1.cn)('uppercase text-[11px] leading-[17px]', textClassName)}>{children}</div>
        </div>);
};
exports.Tag = Tag;
//# sourceMappingURL=Tag.js.map