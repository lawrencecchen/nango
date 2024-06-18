/// <reference types="react" />
export interface AlertOverLayProps {
    title: string;
    message: string;
    onAccept: () => void;
    onCancel: () => void;
}
export default function AlertOverLay(props: AlertOverLayProps): import('react').JSX.Element;
