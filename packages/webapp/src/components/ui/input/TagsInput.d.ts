/// <reference types="react" />
declare type TagsInputProps = Omit<JSX.IntrinsicElements['input'], 'defaultValue'> & {
    defaultValue?: string;
    selectedScopes?: string[];
    addToScopesSet?: (scope: string) => void;
    removeFromSelectedSet?: (scope: string) => void;
};
declare const TagsInput: import('react').ForwardRefExoticComponent<Omit<TagsInputProps, 'ref'> & import('react').RefAttributes<HTMLInputElement>>;
export default TagsInput;
