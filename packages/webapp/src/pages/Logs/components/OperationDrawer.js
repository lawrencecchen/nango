"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationDrawer = void 0;
const react_1 = require("react");
const react_icons_1 = require("@radix-ui/react-icons");
const Drawer_1 = require("../../../components/ui/Drawer");
const ShowOperation_1 = require("../ShowOperation");
const drawerWidth = '1034px';
const OperationDrawer = ({ operationId, onClose }) => {
    const [open, setOpen] = (0, react_1.useState)(true);
    const ref = (0, react_1.useRef)();
    const close = () => {
        if (!ref.current) {
            return;
        }
        // Bug in vaul: https://github.com/emilkowalski/vaul/issues/361
        ref.current.style.setProperty('transform', `translate3d(100%, 0, 0)`);
        ref.current.style.setProperty('transition', `transform 0.5s cubic-bezier(${[0.32, 0.72, 0, 1].join(',')})`);
        setTimeout(() => {
            onClose(false, operationId);
        }, 150);
    };
    return (<Drawer_1.Drawer direction="right" snapPoints={[drawerWidth]} handleOnly={true} noBodyStyles={true} dismissible={true} open={open} onClose={() => setOpen(false)} onOpenChange={(val) => (val ? setOpen(val) : close())} disablePreventScroll={true}>
            <Drawer_1.DrawerTrigger asChild type={null}></Drawer_1.DrawerTrigger>
            <Drawer_1.DrawerContent ref={ref}>
                <div className={`w-[1034px] relative h-screen`}>
                    <div className="absolute right-4 top-7">
                        <Drawer_1.DrawerClose title="Close" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
                            <react_icons_1.Cross1Icon className=""/>
                        </Drawer_1.DrawerClose>
                    </div>
                    <ShowOperation_1.ShowOperation operationId={operationId}/>
                </div>
            </Drawer_1.DrawerContent>
        </Drawer_1.Drawer>);
};
exports.OperationDrawer = OperationDrawer;
//# sourceMappingURL=OperationDrawer.js.map