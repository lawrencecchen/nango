"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const outline_1 = require("@heroicons/react/24/outline");
const react_1 = require("react");
const store_1 = require("../store");
const user_1 = require("../utils/user");
const Info_1 = __importDefault(require("./ui/Info"));
function NavBar() {
    const signout = (0, user_1.useSignout)();
    const email = (0, store_1.useStore)((state) => state.email);
    const isHNDemo = (0, react_1.useMemo)(() => {
        return Boolean(email.match(/demo-[a-z0-9]+@example.com/));
    }, [email]);
    const onCreateAccount = () => {
        signout();
    };
    return (<div className="bg-pure-black flex justify-between border-b border-border-gray py-3">
            <div className="text-white px-6 text-sm">
                {isHNDemo && (<Info_1.default padding={'px-3 py-1.5'} size={15}>
                        This is a test account. Click{' '}
                        <button className="font-bold" onClick={onCreateAccount}>
                            here
                        </button>{' '}
                        to create a real account.
                    </Info_1.default>)}
            </div>
            <div className="flex items-center pr-6">
                <a href="https://nango.dev/slack" target="_blank" rel="noreferrer" className="flex items-center h-8 rounded-md ml-4 pl-2 bg-active-gray pr-3 text-sm border border-neutral-700 hover:border-white hover:bg-hover-gray hover:text-white text-gray-400">
                    <outline_1.ChatBubbleBottomCenterIcon className="h-5 mr-2"/>
                    <p>Help</p>
                </a>
                <a href="https://docs.nango.dev" target="_blank" rel="noreferrer" className="flex items-center h-8 rounded-md ml-4 pl-2 pr-3 text-sm hover:text-white text-gray-400">
                    <p>Docs</p>
                    <outline_1.ArrowTopRightOnSquareIcon className="h-5 ml-2"/>
                </a>
            </div>
        </div>);
}
exports.default = NavBar;
//# sourceMappingURL=TopNavBar.js.map