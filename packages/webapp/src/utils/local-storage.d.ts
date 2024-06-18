interface PersistentStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: any): void;
}
declare class LocalStorage implements PersistentStorage {
    getItem(key: string): any;
    setItem(key: string, value: any): void;
    clear(): void;
}
export declare enum LocalStorageKeys {
    UserEmail = 'nango_user_email',
    UserName = 'nango_user_name',
    UserId = 'nango_user_id',
    AccountId = 'nango_account_id'
}
declare const storage: LocalStorage;
export default storage;
