/// <reference types="react" />
export interface MultiSelectArgs<T> {
    label: string;
    options: {
        name: string;
        value: T;
    }[];
    selected: T[];
    defaultSelect: T[];
    all?: boolean;
    onChange: (selected: T[]) => void;
}
export declare const MultiSelect: React.FC<MultiSelectArgs<any>>;
