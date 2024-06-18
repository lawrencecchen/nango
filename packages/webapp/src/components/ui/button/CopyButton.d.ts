/// <reference types="react" />
import type { ClassValue } from 'clsx';
interface ClipboardButtonProps {
    text: string;
    icontype?: 'clipboard' | 'link';
    textPrompt?: string;
    dark?: boolean;
    className?: ClassValue;
}
export default function ClipboardButton({ text, icontype, textPrompt, dark, className }: ClipboardButtonProps): import('react').JSX.Element;
export {};
