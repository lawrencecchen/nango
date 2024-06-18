declare class HmacService {
    private algorithm;
    isEnabled(id: number): Promise<boolean>;
    getKey(id: number): Promise<string>;
    verify(expectedDigest: string, id: number, ...values: string[]): Promise<boolean>;
    digest(id: number, ...values: string[]): Promise<string>;
}
declare const _default: HmacService;
export default _default;
