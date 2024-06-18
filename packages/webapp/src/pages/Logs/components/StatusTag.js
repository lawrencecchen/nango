"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusTag = void 0;
const Tag_1 = require("../../../components/ui/label/Tag");
const StatusTag = ({ state }) => {
    if (state === 'success') {
        return (<Tag_1.Tag bgClassName="bg-green-base bg-opacity-30" textClassName="text-green-base">
                Success
            </Tag_1.Tag>);
    }
    else if (state === 'running') {
        return (<Tag_1.Tag bgClassName="bg-blue-400 bg-opacity-30" textClassName="text-blue-400">
                Running
            </Tag_1.Tag>);
    }
    else if (state === 'cancelled') {
        return (<Tag_1.Tag bgClassName="bg-gray-400 bg-opacity-30" textClassName="text-gray-400">
                Cancelled
            </Tag_1.Tag>);
    }
    else if (state === 'failed') {
        return (<Tag_1.Tag bgClassName="bg-red-400 bg-opacity-30" textClassName="text-red-400">
                Failed
            </Tag_1.Tag>);
    }
    else if (state === 'timeout') {
        return (<Tag_1.Tag bgClassName="bg-gray-400 bg-opacity-30" textClassName="text-gray-400">
                Timeout
            </Tag_1.Tag>);
    }
    else if (state === 'waiting') {
        return (<Tag_1.Tag bgClassName="bg-gray-400 bg-opacity-30" textClassName="text-gray-400">
                Waiting
            </Tag_1.Tag>);
    }
    return null;
};
exports.StatusTag = StatusTag;
//# sourceMappingURL=StatusTag.js.map