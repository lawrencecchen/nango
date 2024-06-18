/// <reference types="react" />
interface ModalProps {
    bindings: any;
    modalTitleColor: string;
    modalShowSpinner: boolean;
    modalContent: string | React.ReactNode;
    modalTitle: string;
    modalAction: (() => void) | null;
    setVisible: (visible: boolean) => void;
    modalOkTitle?: string;
    modalCancelTitle?: string;
    modalOkLink?: string | null;
    modalCancelLink?: string | null;
}
export default function ActionModal({
    bindings,
    modalTitleColor,
    modalShowSpinner,
    modalContent,
    modalTitle,
    modalAction,
    setVisible,
    modalOkTitle,
    modalCancelTitle,
    modalOkLink,
    modalCancelLink
}: ModalProps): import('react').JSX.Element;
export {};
