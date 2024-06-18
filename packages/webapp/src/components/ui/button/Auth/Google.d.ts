/// <reference types="react" />
interface Props {
    text: string;
    setServerErrorMessage: (message: string) => void;
    invitedAccountID?: number;
    token?: string;
}
export default function GoogleButton({ text, setServerErrorMessage, invitedAccountID, token }: Props): import('react').JSX.Element;
export {};
