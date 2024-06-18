"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelTag = void 0;
const Tag_1 = require("../../../components/ui/label/Tag");
const LevelTag = ({ level }) => {
    if (level === 'error') {
        return (<Tag_1.Tag bgClassName="bg-red-400 bg-opacity-30" textClassName="text-red-400">
                Error
            </Tag_1.Tag>);
    }
    else if (level === 'info') {
        return (<Tag_1.Tag bgClassName="bg-blue-400 bg-opacity-30" textClassName="text-blue-400">
                Info
            </Tag_1.Tag>);
    }
    else if (level === 'warn') {
        return (<Tag_1.Tag bgClassName="bg-orange-400 bg-opacity-30" textClassName="text-orange-400">
                Warn
            </Tag_1.Tag>);
    }
    else if (level === 'debug') {
        return (<Tag_1.Tag bgClassName="bg-gray-400 bg-opacity-30" textClassName="text-gray-400">
                Debug
            </Tag_1.Tag>);
    }
    return null;
};
exports.LevelTag = LevelTag;
//# sourceMappingURL=LevelTag.js.map