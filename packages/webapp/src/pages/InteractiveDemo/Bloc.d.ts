/// <reference types="react" />
import Button from '../../components/ui/button/Button';
export declare const Bloc: React.FC<{
    active: boolean;
    done: boolean;
    title: string;
    subtitle: React.ReactElement;
    children: React.ReactNode;
    noTrack?: boolean;
}>;
export declare const Tab: React.FC<
    {
        children: React.ReactNode;
    } & React.ComponentProps<typeof Button>
>;
