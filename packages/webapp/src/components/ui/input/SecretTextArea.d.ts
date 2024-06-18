import type { TextareaHTMLAttributes } from 'react';
interface SecretTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    copy?: boolean;
    optionalvalue?: string;
    setoptionalvalue?: (value: string) => void;
    additionalclass?: string;
}
declare const SecretTextarea: import('react').ForwardRefExoticComponent<SecretTextareaProps & import('react').RefAttributes<HTMLTextAreaElement>>;
export default SecretTextarea;
