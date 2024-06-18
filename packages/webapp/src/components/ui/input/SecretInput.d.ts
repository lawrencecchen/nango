/// <reference types="react" />
declare type SecretInputProps = Omit<JSX.IntrinsicElements['input'], 'defaultValue'> & {
    copy?: boolean;
    defaultValue?: string;
    optionalvalue?: string | null;
    setoptionalvalue?: (value: string) => void;
    additionalclass?: string;
    tall?: boolean;
    refresh?: () => void;
};
declare const SecretInput: import('react').ForwardRefExoticComponent<Omit<SecretInputProps, 'ref'> & import('react').RefAttributes<HTMLInputElement>>;
export default SecretInput;
