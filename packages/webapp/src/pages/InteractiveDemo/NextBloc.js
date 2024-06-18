"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextBloc = void 0;
const react_icons_1 = require("@radix-ui/react-icons");
const Button_1 = __importDefault(require("../../components/ui/button/Button"));
const analytics_1 = require("../../utils/analytics");
const NextBloc = ({ onProgress }) => {
    const analyticsTrack = (0, analytics_1.useAnalyticsTrack)();
    const onClickExplore = () => {
        analyticsTrack('web:demo:explore');
        window.open('https://docs.nango.dev/integrations/overview', '_blank');
        onProgress();
    };
    const onClickGuides = () => {
        analyticsTrack('web:demo:guide');
        window.open('https://docs.nango.dev/integrate/guides/authorize-an-api', '_blank');
        onProgress();
    };
    const onClickLearn = () => {
        analyticsTrack('web:demo:learn');
        window.open('https://docs.nango.dev/understand/core-concepts', '_blank');
        onProgress();
    };
    const onClickJoinCommunity = () => {
        analyticsTrack('web:demo:community');
        window.open('https://nango.dev/slack', '_blank');
        onProgress();
    };
    return (<div className="mt-2">
            <div className=" flex pt-6">
                <div className="w-290px h-240px ml-4">
                    <img src="/images/ship.svg" className=""/>
                </div>
                <div className="mt-10 ml-10">
                    <h2 className={'text-xl font-semibold leading-7 text-white'}>You&apos;re now ready to ship your first integration!</h2>
                    <h3 className="mt-1 text-sm">Build any integration for any API with Nango.</h3>
                    <div className="flex flex-wrap gap-4 mt-6 w-[400px]">
                        <Button_1.default type="button" variant="primary" onClick={onClickExplore}>
                            <react_icons_1.CubeIcon />
                            Explore templates
                        </Button_1.default>
                        <Button_1.default type="button" variant="secondary" onClick={onClickGuides} className="!bg-pure-black border">
                            <react_icons_1.RulerSquareIcon />
                            Explore guides
                        </Button_1.default>
                        <Button_1.default type="button" variant="secondary" onClick={onClickLearn} className="!bg-pure-black border">
                            <react_icons_1.ReaderIcon />
                            Learn about Nango
                        </Button_1.default>
                        <Button_1.default type="button" variant="secondary" onClick={onClickJoinCommunity} className="!bg-pure-black border">
                            <react_icons_1.ChatBubbleIcon />
                            Join the community
                        </Button_1.default>
                    </div>
                </div>
            </div>
        </div>);
};
exports.NextBloc = NextBloc;
//# sourceMappingURL=NextBloc.js.map