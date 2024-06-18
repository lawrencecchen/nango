import type React from 'react';
interface InfoProps {
    size?: number;
    padding?: string;
    verticallyCenter?: boolean;
    children: React.ReactNode;
    color?: 'orange' | 'blue' | 'red';
    showIcon?: boolean;
    classNames?: string;
}
export default function Info({ children, size, padding, verticallyCenter, classNames, color, showIcon }: InfoProps): React.JSX.Element;
export {};
