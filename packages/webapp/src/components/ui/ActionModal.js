"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@geist-ui/core");
const outline_1 = require("@heroicons/react/24/outline");
const Spinner_1 = __importDefault(require("./Spinner"));
const Button_1 = __importDefault(require("./button/Button"));
function ActionModal({ bindings, modalTitleColor, modalShowSpinner, modalContent, modalTitle, modalAction, setVisible, modalOkTitle, modalCancelTitle, modalOkLink, modalCancelLink }) {
    const modalOkAction = () => {
        if (modalOkLink) {
            window.open(modalOkLink, '_blank');
        }
        else {
            modalAction && modalAction();
        }
    };
    const modalCancelAction = () => {
        if (modalCancelLink) {
            window.open(modalCancelLink, '_blank');
        }
        else {
            setVisible(false);
        }
    };
    return (<core_1.Modal {...bindings} wrapClassName="!h-[200px] !w-[550px] !max-w-[550px] !bg-off-black no-border-modal !border !border-neutral-700">
            <div className="flex justify-between text-sm">
                <div>
                    <core_1.Modal.Content className="overflow-scroll !h-[190px] max-w-[550px] flex flex-col justify-between h-full">
                        <div>
                            <div className="flex -mt-3 justify-between w-[500px] items-center">
                                <span className="flex items-center -mt-3">
                                    <h1 className={`${modalTitleColor} text-base mr-3 py-2`}>{modalTitle}</h1>
                                    {modalShowSpinner && <Spinner_1.default size={2}/>}
                                </span>
                                <outline_1.XMarkIcon className="flex -mt-4 cursor-pointer hover:bg-active-gray h-7 w-7 text-gray-400 p-1" onClick={() => setVisible(false)}/>
                            </div>
                            <div className="mt-2 mb-4 text-sm text-white">{modalContent}</div>
                        </div>
                        <div className="flex pb-4">
                            {modalAction && (<Button_1.default className="mr-4" disabled={modalShowSpinner} variant="primary" onClick={modalOkAction}>
                                    {modalOkTitle || 'Confirm'}
                                </Button_1.default>)}
                            <Button_1.default className="!text-text-light-gray" variant="zombie" onClick={modalCancelAction}>
                                {modalCancelTitle || 'Cancel'}
                            </Button_1.default>
                        </div>
                    </core_1.Modal.Content>
                </div>
            </div>
        </core_1.Modal>);
}
exports.default = ActionModal;
//# sourceMappingURL=ActionModal.js.map