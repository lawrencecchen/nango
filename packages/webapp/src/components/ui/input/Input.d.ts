import type { InputHTMLAttributes } from 'react';
export declare type InputProps = InputHTMLAttributes<HTMLInputElement>;
declare const Input: import('react').ForwardRefExoticComponent<
    InputProps & {
        before?: React.ReactNode;
        after?: React.ReactNode;
    } & import('react').RefAttributes<HTMLInputElement>
>;
export { Input };
