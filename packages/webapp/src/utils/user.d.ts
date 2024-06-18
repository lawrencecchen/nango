export interface User {
    id: number;
    accountId: number;
    email: string;
    name: string;
}
export declare function useSignin(): (user: User) => void;
export declare function useSignout(): () => Promise<void>;
export declare function getUser(): User | null;
