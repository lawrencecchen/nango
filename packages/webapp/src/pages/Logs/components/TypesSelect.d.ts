/// <reference types="react" />
export interface SearchableMultiSelectArgs<T> {
    selected: string[];
    onChange: (selected: T[]) => void;
}
export declare const TypesSelect: React.FC<SearchableMultiSelectArgs<any>>;
