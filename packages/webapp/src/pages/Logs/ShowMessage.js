"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowMessage = void 0;
const react_1 = require("react");
const prism_1 = require("@mantine/prism");
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("../../utils/utils");
const LevelTag_1 = require("./components/LevelTag");
const Tag_1 = require("../../components/ui/label/Tag");
const ShowMessage = ({ message }) => {
    var _a;
    const createdAt = (0, react_1.useMemo)(() => {
        return (0, utils_1.formatDateToLogFormat)(message.createdAt);
    }, [message.createdAt]);
    return (<div className="py-8 px-6 flex flex-col gap-5 h-full">
            <header className="flex gap-2 flex-col border-b border-b-gray-400 pb-5">
                <div className="flex items-center ml-10">
                    <h3 className="text-xl font-semibold text-white">{message.type === 'log' ? 'Message' : 'HTTP'} Details</h3>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex">
                        <LevelTag_1.LevelTag level={message.level}/>
                    </div>
                    <div className="flex bg-border-gray-400 w-[1px] h-[16px]">&nbsp;</div>
                    <div className="flex gap-2 items-center">
                        <react_icons_1.CalendarIcon />
                        <div className="text-gray-400 text-s pt-[1px] font-code">{createdAt}</div>
                    </div>
                </div>
            </header>

            <div className="flex gap-5 flex-wrap mt-4">
                <div className="flex gap-2 items-center w-[48%]">
                    <div className="font-semibold text-sm">Source</div>
                    <div className="text-gray-400 text-xs pt-[1px]">
                        <Tag_1.Tag>{message.source === 'internal' ? 'System' : 'User'}</Tag_1.Tag>
                    </div>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-sm mb-2">Message</h4>
                <div className="text-gray-400 text-sm bg-pure-black py-2 max-h-36 overflow-y-scroll">
                    <prism_1.Prism language="json" className="transparent-code" colorScheme="dark" styles={() => {
            return { code: { padding: '0', whiteSpace: 'pre-wrap' } };
        }} noCopy>
                        {message.message}
                    </prism_1.Prism>
                </div>
            </div>
            <div className="overflow-x-hidden">
                <h4 className="font-semibold text-sm mb-2">Payload</h4>

                {message.meta || message.error ? (<div className="text-gray-400 text-sm bg-pure-black py-2 h-full overflow-y-scroll">
                        <prism_1.Prism language="json" className="transparent-code" colorScheme="dark" styles={() => {
                return { code: { padding: '0', whiteSpace: 'pre-wrap' } };
            }}>
                            {JSON.stringify({ error: ((_a = message.error) === null || _a === void 0 ? void 0 : _a.message) || undefined, output: message.meta || undefined }, null, 2)}
                        </prism_1.Prism>
                    </div>) : (<div className="text-gray-400 text-xs bg-pure-black py-4 px-4">No payload.</div>)}
            </div>
        </div>);
};
exports.ShowMessage = ShowMessage;
//# sourceMappingURL=ShowMessage.js.map