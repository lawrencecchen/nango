/// <reference types="react" />
export interface SearchableMultiSelectArgs<T> {
    label: string;
    category: T;
    selected: string[];
    onChange: (selected: T[]) => void;
}
export declare const SearchableMultiSelect: React.FC<SearchableMultiSelectArgs<any>>;
